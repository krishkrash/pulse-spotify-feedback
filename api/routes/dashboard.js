import { Router } from 'express';
import { getDashboardStats, getSentimentOverTime } from '../../db/sqlite.js';

const router = Router();

router.get('/', (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const stats = getDashboardStats();
    const sentimentOverTime = getSentimentOverTime(days);
    
    res.json({
      ...stats,
      sentimentOverTime
    });
  } catch (err) {
    next(err);
  }
});

export default router;
