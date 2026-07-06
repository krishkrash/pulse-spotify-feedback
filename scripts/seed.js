import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runPipeline } from './run-pipeline.js';
import { closeDb } from '../db/sqlite.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'pulse-db.json');

async function seed() {
  console.log('🧹 Preparing clean database...');
  closeDb();
  
  if (fs.existsSync(DB_PATH)) {
    try {
      fs.unlinkSync(DB_PATH);
      console.log('🗑️ Existing database pulse.db deleted.');
    } catch (err) {
      console.warn('⚠️ Could not delete existing database file:', err.message);
    }
  }

  console.log('🌱 Starting database seeding and analysis pipeline...');
  await runPipeline();
}

seed().then(() => {
  closeDb();
  process.exit(0);
}).catch(err => {
  console.error('❌ Seeding failed:', err);
  closeDb();
  process.exit(1);
});
