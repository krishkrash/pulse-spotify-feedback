import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDb, closeDb } from '../db/sqlite.js';

import dashboardRouter from './routes/dashboard.js';
import reviewsRouter from './routes/reviews.js';
import queryRouter from './routes/query.js';
import topicsRouter from './routes/topics.js';
import segmentsRouter from './routes/segments.js';
import digestRouter from './routes/digest.js';
import syncRouter from './routes/sync.js';
import insightsRouter from './routes/insights.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
getDb();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// Mount Routes
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/ask', queryRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/segments', segmentsRouter);
app.use('/api/digest', digestRouter);
app.use('/api/sync', syncRouter);
app.use('/api/insights', insightsRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[API Error]', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const server = app.listen(PORT, () => {
  console.log(`📡 Pulse API Server listening on http://localhost:${PORT}`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down API server gracefully...');
  server.close(() => {
    closeDb();
    console.log('Database connection closed. Goodbye!');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
