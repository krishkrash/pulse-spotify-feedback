import { Router } from 'express';
import { runPipeline } from '../../scripts/run-pipeline.js';
import { getLatestSync } from '../../db/sqlite.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const latest = getLatestSync();
    if (latest && latest.status === 'running') {
      return res.status(409).json({ 
        status: 'running', 
        message: 'Sync pipeline is already running' 
      });
    }

    // Run pipeline in background
    runPipeline().catch(err => {
      console.error('[Sync Route] Background pipeline run failed:', err);
    });

    res.json({
      status: 'started',
      message: 'Sync pipeline started successfully in the background'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/status', (req, res, next) => {
  try {
    const latest = getLatestSync();
    if (!latest) {
      return res.json({
        status: 'idle',
        message: 'No sync logs found. System is ready to sync.'
      });
    }
    res.json(latest);
  } catch (err) {
    next(err);
  }
});

router.get('/config', (req, res) => {
  res.json({
    gemini: !!process.env.GOOGLE_AI_API_KEY,
    reddit: !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET),
    twitter: !!process.env.TWITTER_BEARER_TOKEN,
    slack: !!process.env.SLACK_WEBHOOK_URL
  });
});

export default router;
