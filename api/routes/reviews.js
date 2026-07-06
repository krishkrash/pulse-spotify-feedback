import { Router } from 'express';
import { getReviews, getReviewCount } from '../../db/sqlite.js';

const router = Router();

router.get('/', (req, res, next) => {
  try {
    const { source, rating, topic, sentiment, userType, sortBy } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const reviews = getReviews({
      source,
      rating: rating ? parseInt(rating) : undefined,
      topic,
      sentiment,
      userType,
      limit,
      offset,
      sortBy
    });

    const total = getReviewCount({ source, topic, sentiment });

    res.json({
      reviews,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
