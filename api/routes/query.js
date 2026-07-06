import { Router } from 'express';
import { RAGQueryAgent } from '../../agents/RAGQueryAgent.js';

const router = Router();
const queryAgent = new RAGQueryAgent();

router.post('/', async (req, res, next) => {
  try {
    const { question, filters } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const result = await queryAgent.query(question, filters || {});
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
