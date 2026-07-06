import express from 'express';
import { getDiscoveryInsights, getFrustrationHeatmap, getBehaviorClusters, getUnmetNeedsRanked } from '../../db/sqlite.js';

const router = express.Router();

/**
 * GET /api/insights/discovery
 * Returns structured answers to all 6 discovery focus questions.
 */
router.get('/discovery', (req, res) => {
  try {
    const insights = getDiscoveryInsights();
    res.json(insights);
  } catch (err) {
    console.error('[Insights] Discovery error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/insights/heatmap
 * Returns topic × user_type frustration heatmap matrix.
 */
router.get('/heatmap', (req, res) => {
  try {
    const heatmap = getFrustrationHeatmap();
    res.json(heatmap);
  } catch (err) {
    console.error('[Insights] Heatmap error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/insights/behaviors
 * Returns listening behavior clusters.
 */
router.get('/behaviors', (req, res) => {
  try {
    const behaviors = getBehaviorClusters();
    res.json(behaviors);
  } catch (err) {
    console.error('[Insights] Behaviors error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/insights/unmet-needs
 * Returns ranked unmet needs with cross-source evidence.
 */
router.get('/unmet-needs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const needs = getUnmetNeedsRanked(limit);
    res.json({ needs, total: needs.length });
  } catch (err) {
    console.error('[Insights] Unmet needs error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
