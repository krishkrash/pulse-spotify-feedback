import { getAllEmbeddings, insertEmbedding, insertEmbeddings } from './sqlite.js';

/**
 * In-memory vector store with cosine similarity search.
 * Falls back from ChromaDB to this pure-JS implementation.
 */

let vectorCache = null; // { reviewId: string, vector: number[] }[]

function loadCache() {
  if (!vectorCache) {
    vectorCache = getAllEmbeddings();
  }
  return vectorCache;
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}

export async function addVectors(items) {
  // items: [{ reviewId, vector }]
  insertEmbeddings(items);
  // Invalidate cache
  vectorCache = null;
}

export async function addVector(reviewId, vector) {
  insertEmbedding(reviewId, vector);
  vectorCache = null;
}

export async function queryVectors(queryVector, topK = 20, filterFn = null) {
  const cache = loadCache();

  let candidates = cache;
  if (filterFn) {
    candidates = cache.filter(filterFn);
  }

  const scored = candidates.map(item => ({
    reviewId: item.reviewId,
    score: cosineSimilarity(queryVector, item.vector)
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

export function invalidateCache() {
  vectorCache = null;
}

export function getVectorCount() {
  return loadCache().length;
}
