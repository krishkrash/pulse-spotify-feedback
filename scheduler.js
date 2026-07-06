import cron from 'node-cron';
import dotenv from 'dotenv';
import { runPipeline } from './scripts/run-pipeline.js';
import { TrendMonitorAgent } from './agents/TrendMonitorAgent.js';
import { closeDb } from './db/sqlite.js';

dotenv.config();

console.log('⏰ Pulse Background Scheduler Started');

// 1. Every 6 hours: run full pipeline sync (at minute 0 of hour 0, 6, 12, 18)
cron.schedule('0 */6 * * *', async () => {
  console.log('⏰ [Scheduler] Triggering scheduled pipeline run...');
  try {
    await runPipeline();
  } catch (err) {
    console.error('⏰ [Scheduler] Scheduled pipeline run failed:', err.message);
  } finally {
    closeDb();
  }
});

// 2. Monday 9:00 AM: generate weekly digest & push Slack notification
cron.schedule('0 9 * * 1', async () => {
  console.log('⏰ [Scheduler] Triggering Monday morning digest compilation...');
  try {
    const monitor = new TrendMonitorAgent();
    await monitor.generateWeeklyDigest();
  } catch (err) {
    console.error('⏰ [Scheduler] Weekly digest compilation failed:', err.message);
  } finally {
    closeDb();
  }
});

// Keep process alive
process.on('SIGTERM', () => {
  console.log('⏰ [Scheduler] Exiting gracefully...');
  closeDb();
  process.exit(0);
});
