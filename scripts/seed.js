import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  getDb, 
  insertReviews, 
  insertAnalysisBatch, 
  closeDb,
  createSyncLog,
  updateSyncLog 
} from '../db/sqlite.js';
import { TrendMonitorAgent } from '../agents/TrendMonitorAgent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'pulse-db.json');
const SEED_DATA_PATH = path.join(__dirname, '..', 'data', 'seed-reviews.json');

async function seed() {
  console.log('🧹 Preparing clean database...');
  closeDb();
  
  if (fs.existsSync(DB_PATH)) {
    try {
      fs.unlinkSync(DB_PATH);
      console.log('🗑️ Existing database file deleted.');
    } catch (err) {
      console.warn('⚠️ Could not delete existing database file:', err.message);
    }
  }

  // Initialize new empty DB
  const db = getDb();

  console.log('🌱 Reading seed reviews...');
  if (!fs.existsSync(SEED_DATA_PATH)) {
    throw new Error(`Seed data file not found at ${SEED_DATA_PATH}`);
  }

  const rawData = JSON.parse(fs.readFileSync(SEED_DATA_PATH, 'utf-8'));
  console.log(`[Seed] Loaded ${rawData.length} reviews from JSON.`);

  // Create a sync log entry
  const syncLogId = createSyncLog();

  // 1. Insert Reviews
  console.log('[Seed] Inserting reviews...');
  insertReviews(rawData);

  // 2. Insert pre-computed Analyses
  console.log('[Seed] Inserting pre-computed analyses...');
  const analyses = [];
  for (const review of rawData) {
    if (review._analysis) {
      analyses.push({
        review_id: review.id,
        ...review._analysis
      });
    }
  }

  if (analyses.length > 0) {
    insertAnalysisBatch(analyses);
  }

  // Update sync log stats
  updateSyncLog(syncLogId, {
    reviews_harvested: rawData.length,
    reviews_cleaned: rawData.length,
    reviews_analyzed: analyses.length,
    reviews_embedded: 0
  });

  // 3. Generate initial trends and digests
  console.log('[Seed] Generating weekly digest & trend monitoring...');
  const trendMonitor = new TrendMonitorAgent();
  await trendMonitor.detectTrends();
  await trendMonitor.generateWeeklyDigest();

  // Complete sync log
  updateSyncLog(syncLogId, {
    status: 'completed',
    completed_at: new Date().toISOString()
  });

  console.log('✅ Seeding completed successfully!');
}

seed().then(() => {
  closeDb();
  process.exit(0);
}).catch(err => {
  console.error('❌ Seeding failed:', err);
  closeDb();
  process.exit(1);
});

