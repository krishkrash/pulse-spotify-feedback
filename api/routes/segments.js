import { Router } from 'express';
import { getSegmentStats, getAllSegmentOverview } from '../../db/sqlite.js';

const router = Router();

// Get summary of all segments
router.get('/', (req, res, next) => {
  try {
    const overview = getAllSegmentOverview();
    res.json(overview);
  } catch (err) {
    next(err);
  }
});

// Get detailed stats for a specific segment
router.get('/:segment', (req, res, next) => {
  try {
    const { segment } = req.params;
    const stats = getSegmentStats(segment);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
