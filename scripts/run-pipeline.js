import dotenv from 'dotenv';
import { DataHarvesterAgent } from '../agents/DataHarvesterAgent.js';
import { CleanerAgent } from '../agents/CleanerAgent.js';
import { EmbeddingAgent } from '../agents/EmbeddingAgent.js';
import { AnalysisAgent } from '../agents/AnalysisAgent.js';
import { TrendMonitorAgent } from '../agents/TrendMonitorAgent.js';
import {
  getDb,
  insertReviews,
  getUncleanedReviews,
  updateCleanedReview,
  getUneEmbeddedReviews,
  getUnanalyzedReviews,
  createSyncLog,
  updateSyncLog,
  closeDb
} from '../db/sqlite.js';

dotenv.config();

export async function runPipeline() {
  console.log('🚀 Starting Pulse Feedback Intelligence Pipeline');
  const syncLogId = createSyncLog();
  
  const stats = {
    reviews_harvested: 0,
    reviews_cleaned: 0,
    reviews_embedded: 0,
    reviews_analyzed: 0
  };

  try {
    // 1. Data Harvesting
    const harvester = new DataHarvesterAgent();
    const rawReviews = await harvester.harvest();
    stats.reviews_harvested = rawReviews.length;
    
    if (rawReviews.length > 0) {
      insertReviews(rawReviews);
    }
    updateSyncLog(syncLogId, { reviews_harvested: stats.reviews_harvested });

    // 2. Data Cleaning
    const uncleaned = getUncleanedReviews();
    console.log(`[Pipeline] Found ${uncleaned.length} uncleaned reviews in database.`);
    if (uncleaned.length > 0) {
      const cleaner = new CleanerAgent();
      const cleaned = await cleaner.clean(uncleaned);
      
      for (const r of cleaned) {
        updateCleanedReview(r.id, r.cleaned_text, r.word_count, r.sentiment_hint, r.language, r.is_spam);
      }
      stats.reviews_cleaned = cleaned.length;
    }
    updateSyncLog(syncLogId, { reviews_cleaned: stats.reviews_cleaned });

    // 3. Data Embedding
    const unembedded = getUneEmbeddedReviews();
    console.log(`[Pipeline] Found ${unembedded.length} unembedded reviews in database.`);
    if (unembedded.length > 0) {
      const embedder = new EmbeddingAgent();
      const embeddings = await embedder.embed(unembedded);
      stats.reviews_embedded = embeddings.length;
    }
    updateSyncLog(syncLogId, { reviews_embedded: stats.reviews_embedded });

    // 4. Data Analysis
    const unanalyzed = getUnanalyzedReviews();
    console.log(`[Pipeline] Found ${unanalyzed.length} unanalyzed reviews in database.`);
    if (unanalyzed.length > 0) {
      const analyzer = new AnalysisAgent();
      const analysisStats = await analyzer.analyze(unanalyzed);
      stats.reviews_analyzed = analysisStats.analyzed;
    }
    updateSyncLog(syncLogId, { reviews_analyzed: stats.reviews_analyzed });

    // 5. Trend Detection & Digest Generation
    const trendMonitor = new TrendMonitorAgent();
    await trendMonitor.detectTrends();
    await trendMonitor.generateWeeklyDigest();

    // 6. Complete Log
    updateSyncLog(syncLogId, {
      status: 'completed',
      completed_at: new Date().toISOString()
    });
    console.log('✅ Pulse Feedback Intelligence Pipeline Completed Successfully!');
    console.log(`Summary: Harvested: ${stats.reviews_harvested}, Cleaned: ${stats.reviews_cleaned}, Embedded: ${stats.reviews_embedded}, Analyzed: ${stats.reviews_analyzed}`);

  } catch (error) {
    console.error('❌ Pipeline execution failed:', error);
    updateSyncLog(syncLogId, {
      status: 'failed',
      error_message: error.message,
      completed_at: new Date().toISOString()
    });
  }
}

// If run directly
if (process.argv[1] && process.argv[1].endsWith('run-pipeline.js')) {
  runPipeline().then(() => {
    closeDb();
    process.exit(0);
  }).catch(err => {
    console.error('Unhandled pipeline rejection:', err);
    closeDb();
    process.exit(1);
  });
}
