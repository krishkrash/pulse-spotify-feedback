import { Router } from 'express';
import { getLatestDigest, getDigests } from '../../db/sqlite.js';

const router = Router();

router.get('/', (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const latestRow = getLatestDigest();
    const historyRows = getDigests(limit);

    const latest = latestRow ? {
      ...latestRow,
      content: JSON.parse(latestRow.content)
    } : null;

    const history = historyRows.map(row => ({
      ...row,
      content: JSON.parse(row.content)
    }));

    res.json({
      latest,
      history
    });
  } catch (err) {
    next(err);
  }
});

export default router;
