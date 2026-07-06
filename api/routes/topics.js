import { Router } from 'express';
import { getDb, getTopicStats } from '../../db/sqlite.js';

const router = Router();

// Get general stats for all topics
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const topicOverview = db.prepare(`
      SELECT 
        a.primary_topic as topic, 
        COUNT(*) as count,
        AVG(r.rating) as avg_rating,
        SUM(CASE WHEN a.sentiment = 'positive' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as positive_pct,
        SUM(CASE WHEN a.sentiment = 'negative' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as negative_pct,
        SUM(CASE WHEN a.sentiment = 'neutral' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as neutral_pct,
        SUM(CASE WHEN a.sentiment = 'mixed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as mixed_pct
      FROM analysis a
      JOIN reviews r ON r.id = a.review_id
      WHERE r.is_spam = 0 AND a.primary_topic IS NOT NULL
      GROUP BY a.primary_topic
      ORDER BY count DESC
    `).all();

    res.json(topicOverview);
  } catch (err) {
    next(err);
  }
});

// Get detailed stats for a single topic
router.get('/:topic', (req, res, next) => {
  try {
    const { topic } = req.params;
    const stats = getTopicStats(topic);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
