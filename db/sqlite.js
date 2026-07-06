import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'pulse-db.json');

let db = null;

export function getDb() {
  if (!db) {
    if (fs.existsSync(DB_PATH)) {
      try {
        db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      } catch (err) {
        console.error('[JSON DB] Error reading DB file, initializing empty:', err.message);
        db = createEmptyDb();
      }
    } else {
      db = createEmptyDb();
      saveDb();
    }
  }
  return db;
}

function createEmptyDb() {
  return {
    reviews: [],
    analysis: [],
    embeddings: [],
    digests: [],
    sync_log: []
  };
}

function saveDb() {
  if (db) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    } catch (err) {
      console.error('[JSON DB] Failed to save database:', err.message);
    }
  }
}

// Helper to get joined review + analysis record
function getJoinedReviews() {
  const database = getDb();
  const analysisMap = new Map(database.analysis.map(a => [a.review_id, a]));
  
  return database.reviews.map(r => {
    const a = analysisMap.get(r.id) || {};
    return {
      ...r,
      sentiment: a.sentiment || null,
      sentiment_intensity: a.sentiment_intensity || null,
      sentiment_emotion: a.sentiment_emotion || null,
      primary_topic: a.primary_topic || null,
      secondary_topics: a.secondary_topics ? (typeof a.secondary_topics === 'string' ? JSON.parse(a.secondary_topics) : a.secondary_topics) : [],
      topic_confidence: a.topic_confidence || null,
      user_goal: a.user_goal || null,
      unmet_need: a.unmet_need || null,
      frustration_level: a.frustration_level || null,
      feature_request: a.feature_request || null,
      user_type: a.user_type || null,
      usage_pattern: a.usage_pattern || null,
      discovery_mindset: a.discovery_mindset || null,
      analyzed_at: a.analyzed_at || null
    };
  });
}

// ── Review CRUD ────────────────────────────────────────

export function insertReview(review) {
  const database = getDb();
  if (database.reviews.some(r => r.id === review.id)) {
    return { changes: 0 };
  }
  
  const record = {
    id: review.id,
    source: review.source,
    text: review.text,
    cleaned_text: review.cleaned_text || null,
    rating: review.rating,
    date: review.date,
    author: review.author,
    upvotes: review.upvotes || 0,
    url: review.url || null,
    word_count: review.word_count || null,
    sentiment_hint: review.sentiment_hint || null,
    is_spam: review.is_spam ? 1 : 0,
    language: review.language || 'en',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  database.reviews.push(record);
  saveDb();
  return { changes: 1 };
}

export function insertReviews(reviews) {
  const database = getDb();
  let count = 0;
  for (const review of reviews) {
    if (!database.reviews.some(r => r.id === review.id)) {
      database.reviews.push({
        id: review.id,
        source: review.source,
        text: review.text,
        cleaned_text: review.cleaned_text || null,
        rating: review.rating,
        date: review.date,
        author: review.author,
        upvotes: review.upvotes || 0,
        url: review.url || null,
        word_count: review.word_count || null,
        sentiment_hint: review.sentiment_hint || null,
        is_spam: review.is_spam ? 1 : 0,
        language: review.language || 'en',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      count++;
    }
  }
  if (count > 0) {
    saveDb();
  }
}

export function updateCleanedReview(id, cleanedText, wordCount, sentimentHint, language, isSpam) {
  const database = getDb();
  const review = database.reviews.find(r => r.id === id);
  if (review) {
    review.cleaned_text = cleanedText;
    review.word_count = wordCount;
    review.sentiment_hint = sentimentHint;
    review.language = language;
    review.is_spam = isSpam ? 1 : 0;
    review.updated_at = new Date().toISOString();
    saveDb();
    return { changes: 1 };
  }
  return { changes: 0 };
}

export function getUncleanedReviews() {
  const database = getDb();
  return database.reviews.filter(r => r.cleaned_text === null || r.cleaned_text === undefined);
}

export function getCleanedReviews() {
  const database = getDb();
  return database.reviews.filter(r => r.cleaned_text !== null && r.cleaned_text !== undefined && r.is_spam === 0 && r.language === 'en');
}

export function getUneEmbeddedReviews() {
  const database = getDb();
  const embeddedIds = new Set(database.embeddings.map(e => e.review_id));
  return database.reviews.filter(r => 
    r.cleaned_text !== null && 
    r.cleaned_text !== undefined && 
    r.is_spam === 0 && 
    r.language === 'en' && 
    !embeddedIds.has(r.id)
  );
}

export function getUnanalyzedReviews() {
  const database = getDb();
  const analyzedIds = new Set(database.analysis.map(a => a.review_id));
  return database.reviews.filter(r => 
    r.cleaned_text !== null && 
    r.cleaned_text !== undefined && 
    r.is_spam === 0 && 
    r.language === 'en' && 
    !analyzedIds.has(r.id)
  );
}

export function getReviews({ source, rating, topic, sentiment, userType, limit = 50, offset = 0, sortBy = 'date' } = {}) {
  let list = getJoinedReviews();
  
  // Filter out uncleaned / spam
  list = list.filter(r => r.cleaned_text !== null && r.is_spam === 0);

  if (source) list = list.filter(r => r.source === source);
  if (rating) list = list.filter(r => r.rating === rating);
  if (topic) list = list.filter(r => r.primary_topic === topic);
  if (sentiment) list = list.filter(r => r.sentiment === sentiment);
  if (userType) list = list.filter(r => r.user_type === userType);

  // Sorting
  list.sort((a, b) => {
    let valA, valB;
    if (sortBy === 'rating') {
      valA = a.rating || 0;
      valB = b.rating || 0;
    } else if (sortBy === 'upvotes') {
      valA = a.upvotes || 0;
      valB = b.upvotes || 0;
    } else {
      valA = a.date || '';
      valB = b.date || '';
    }

    if (valA < valB) return 1;
    if (valA > valB) return -1;
    return 0;
  });

  return list.slice(offset, offset + limit);
}

export function getReviewCount(filters = {}) {
  let list = getJoinedReviews();
  list = list.filter(r => r.cleaned_text !== null && r.is_spam === 0);

  if (filters.source) list = list.filter(r => r.source === filters.source);
  if (filters.topic) list = list.filter(r => r.primary_topic === filters.topic);
  if (filters.sentiment) list = list.filter(r => r.sentiment === filters.sentiment);

  return list.length;
}

// ── Analysis CRUD ──────────────────────────────────────

export function insertAnalysis(data) {
  const database = getDb();
  const index = database.analysis.findIndex(a => a.review_id === data.review_id);
  
  const record = {
    review_id: data.review_id,
    sentiment: data.sentiment,
    sentiment_intensity: data.sentiment_intensity,
    sentiment_emotion: data.sentiment_emotion,
    primary_topic: data.primary_topic,
    secondary_topics: Array.isArray(data.secondary_topics) ? data.secondary_topics : JSON.parse(data.secondary_topics || '[]'),
    topic_confidence: data.topic_confidence,
    user_goal: data.user_goal,
    unmet_need: data.unmet_need,
    frustration_level: data.frustration_level,
    feature_request: data.feature_request,
    user_type: data.user_type,
    usage_pattern: data.usage_pattern,
    discovery_mindset: data.discovery_mindset,
    analyzed_at: new Date().toISOString()
  };

  if (index !== -1) {
    database.analysis[index] = record;
  } else {
    database.analysis.push(record);
  }
  saveDb();
}

export function insertAnalysisBatch(items) {
  const database = getDb();
  for (const d of items) {
    const index = database.analysis.findIndex(a => a.review_id === d.review_id);
    const record = {
      review_id: d.review_id,
      sentiment: d.sentiment,
      sentiment_intensity: d.sentiment_intensity,
      sentiment_emotion: d.sentiment_emotion,
      primary_topic: d.primary_topic,
      secondary_topics: Array.isArray(d.secondary_topics) ? d.secondary_topics : JSON.parse(d.secondary_topics || '[]'),
      topic_confidence: d.topic_confidence,
      user_goal: d.user_goal,
      unmet_need: d.unmet_need,
      frustration_level: d.frustration_level,
      feature_request: d.feature_request,
      user_type: d.user_type,
      usage_pattern: d.usage_pattern,
      discovery_mindset: d.discovery_mindset,
      analyzed_at: new Date().toISOString()
    };

    if (index !== -1) {
      database.analysis[index] = record;
    } else {
      database.analysis.push(record);
    }
  }
  saveDb();
}

// ── Embeddings CRUD ────────────────────────────────────

export function insertEmbedding(reviewId, vector) {
  const database = getDb();
  const index = database.embeddings.findIndex(e => e.review_id === reviewId);
  const record = {
    review_id: reviewId,
    vector: vector,
    model: 'all-MiniLM-L6-v2',
    created_at: new Date().toISOString()
  };

  if (index !== -1) {
    database.embeddings[index] = record;
  } else {
    database.embeddings.push(record);
  }
  saveDb();
}

export function insertEmbeddings(items) {
  const database = getDb();
  for (const { reviewId, vector } of items) {
    const index = database.embeddings.findIndex(e => e.review_id === reviewId);
    const record = {
      review_id: reviewId,
      vector: vector,
      model: 'all-MiniLM-L6-v2',
      created_at: new Date().toISOString()
    };

    if (index !== -1) {
      database.embeddings[index] = record;
    } else {
      database.embeddings.push(record);
    }
  }
  saveDb();
}

export function getAllEmbeddings() {
  const database = getDb();
  return database.embeddings.map(row => ({
    reviewId: row.review_id,
    vector: row.vector
  }));
}

// ── Dashboard Aggregations ─────────────────────────────

export function getDashboardStats() {
  const database = getDb();
  const joined = getJoinedReviews().filter(r => r.cleaned_text !== null && r.is_spam === 0);
  
  const total = joined.length;
  
  const sentimentCountsMap = {};
  joined.forEach(r => {
    if (r.sentiment) {
      sentimentCountsMap[r.sentiment] = (sentimentCountsMap[r.sentiment] || 0) + 1;
    }
  });
  
  const sentimentCounts = Object.entries(sentimentCountsMap).map(([sentiment, count]) => ({
    sentiment,
    count
  }));

  const negativeCount = sentimentCountsMap['negative'] || 0;
  const negativePct = total > 0 ? Math.round((negativeCount / total) * 100) : 0;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const thisWeek = joined.filter(r => r.date && r.date >= sevenDaysAgoStr).length;

  const topicCountsMap = {};
  joined.forEach(r => {
    if (r.primary_topic) {
      topicCountsMap[r.primary_topic] = (topicCountsMap[r.primary_topic] || 0) + 1;
    }
  });

  const topTopics = Object.entries(topicCountsMap)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const sourceCountsMap = {};
  joined.forEach(r => {
    sourceCountsMap[r.source] = (sourceCountsMap[r.source] || 0) + 1;
  });

  const sourceCounts = Object.entries(sourceCountsMap).map(([source, count]) => ({
    source,
    count
  }));

  return { total, negativePct, thisWeek, topTopics, sourceCounts, sentimentCounts };
}

export function getSentimentOverTime(days = 30) {
  const joined = getJoinedReviews().filter(r => r.cleaned_text !== null && r.is_spam === 0);
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  const filtered = joined.filter(r => r.date && r.date >= cutoffStr);
  
  // Group by date
  const groups = {};
  filtered.forEach(r => {
    if (!groups[r.date]) {
      groups[r.date] = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
    }
    if (r.sentiment && r.sentiment in groups[r.date]) {
      groups[r.date][r.sentiment]++;
    }
  });

  return Object.entries(groups)
    .map(([date, counts]) => ({
      date,
      ...counts
    }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export function getTopicStats(topic) {
  const joined = getJoinedReviews().filter(r => r.cleaned_text !== null && r.is_spam === 0 && r.primary_topic === topic);
  const total = joined.length;

  // Sentiments breakdown
  const sentimentMap = {};
  joined.forEach(r => {
    if (r.sentiment) {
      sentimentMap[r.sentiment] = (sentimentMap[r.sentiment] || 0) + 1;
    }
  });
  const sentiments = Object.entries(sentimentMap).map(([sentiment, count]) => ({
    sentiment,
    count
  }));

  // Sources breakdown
  const sourceMap = {};
  joined.forEach(r => {
    sourceMap[r.source] = (sourceMap[r.source] || 0) + 1;
  });
  const sources = Object.entries(sourceMap).map(([source, count]) => ({
    source,
    count
  }));

  // Unmet needs
  const needsMap = {};
  joined.forEach(r => {
    if (r.unmet_need) {
      needsMap[r.unmet_need] = (needsMap[r.unmet_need] || 0) + 1;
    }
  });
  const unmetNeeds = Object.entries(needsMap)
    .map(([unmet_need, count]) => ({ unmet_need, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { total, sentiments, sources, unmetNeeds };
}

export function getSegmentStats(userType) {
  const joined = getJoinedReviews().filter(r => r.cleaned_text !== null && r.is_spam === 0 && r.user_type === userType);
  const total = joined.length;

  // Average Rating
  const rated = joined.filter(r => r.rating !== null && r.rating !== undefined);
  const avgRating = rated.length > 0 ? rated.reduce((sum, r) => sum + r.rating, 0) / rated.length : 0;

  // Top Topics
  const topicMap = {};
  joined.forEach(r => {
    if (r.primary_topic) {
      topicMap[r.primary_topic] = (topicMap[r.primary_topic] || 0) + 1;
    }
  });
  const topTopics = Object.entries(topicMap)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Unmet Needs
  const needsMap = {};
  joined.forEach(r => {
    if (r.unmet_need) {
      needsMap[r.unmet_need] = (needsMap[r.unmet_need] || 0) + 1;
    }
  });
  const unmetNeeds = Object.entries(needsMap)
    .map(([unmet_need, count]) => ({ unmet_need, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Feature Requests
  const featMap = {};
  joined.forEach(r => {
    if (r.feature_request) {
      featMap[r.feature_request] = (featMap[r.feature_request] || 0) + 1;
    }
  });
  const featureRequests = Object.entries(featMap)
    .map(([feature_request, count]) => ({ feature_request, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { total, avgRating: Math.round(avgRating * 10) / 10, topTopics, unmetNeeds, featureRequests };
}

export function getAllSegmentOverview() {
  const joined = getJoinedReviews().filter(r => r.cleaned_text !== null && r.is_spam === 0 && r.user_type !== null);
  
  const segments = {};
  joined.forEach(r => {
    if (!segments[r.user_type]) {
      segments[r.user_type] = { count: 0, totalRating: 0, ratedCount: 0, negativeCount: 0 };
    }
    const s = segments[r.user_type];
    s.count++;
    if (r.rating !== null && r.rating !== undefined) {
      s.totalRating += r.rating;
      s.ratedCount++;
    }
    if (r.sentiment === 'negative') {
      s.negativeCount++;
    }
  });

  return Object.entries(segments)
    .map(([user_type, s]) => ({
      user_type,
      count: s.count,
      avg_rating: s.ratedCount > 0 ? Math.round((s.totalRating / s.ratedCount) * 10) / 10 : 0,
      negative_pct: s.count > 0 ? Math.round((s.negativeCount / s.count) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);
}

// ── Digest ─────────────────────────────────────────────

export function insertDigest(weekStart, weekEnd, content) {
  const database = getDb();
  const record = {
    id: database.digests.length + 1,
    week_start: weekStart,
    week_end: weekEnd,
    content: typeof content === 'string' ? content : JSON.stringify(content),
    generated_at: new Date().toISOString()
  };
  database.digests.push(record);
  saveDb();
}

export function getLatestDigest() {
  const database = getDb();
  if (database.digests.length === 0) return null;
  const sorted = [...database.digests].sort((a, b) => (a.generated_at < b.generated_at ? 1 : -1));
  return sorted[0];
}

export function getDigests(limit = 10) {
  const database = getDb();
  const sorted = [...database.digests].sort((a, b) => (a.generated_at < b.generated_at ? 1 : -1));
  return sorted.slice(0, limit);
}

// ── Sync Log ───────────────────────────────────────────

export function createSyncLog() {
  const database = getDb();
  const id = database.sync_log.length + 1;
  database.sync_log.push({
    id,
    status: 'running',
    reviews_harvested: 0,
    reviews_cleaned: 0,
    reviews_embedded: 0,
    reviews_analyzed: 0,
    error_message: null,
    started_at: new Date().toISOString(),
    completed_at: null
  });
  saveDb();
  return id;
}

export function updateSyncLog(id, data) {
  const database = getDb();
  const log = database.sync_log.find(l => l.id === id);
  if (log) {
    Object.assign(log, data);
    saveDb();
  }
}

export function getLatestSync() {
  const database = getDb();
  if (database.sync_log.length === 0) return null;
  const sorted = [...database.sync_log].sort((a, b) => (a.started_at < b.started_at ? 1 : -1));
  return sorted[0];
}

// ── Trend Monitoring Helpers ──────────────────────────

export function getTrendStats() {
  const joined = getJoinedReviews().filter(r => r.cleaned_text !== null && r.is_spam === 0);
  
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  const oneDayAgoStr = oneDayAgo.toISOString().split('T')[0];

  const eightDaysAgo = new Date();
  eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
  const eightDaysAgoStr = eightDaysAgo.toISOString().split('T')[0];

  // recent24h
  const recentReviews = joined.filter(r => r.date && r.date >= oneDayAgoStr);
  const recentTopicMap = {};
  recentReviews.forEach(r => {
    if (r.primary_topic) {
      recentTopicMap[r.primary_topic] = (recentTopicMap[r.primary_topic] || 0) + 1;
    }
  });
  const recent24h = Object.entries(recentTopicMap).map(([primary_topic, count]) => ({
    primary_topic,
    count
  }));

  // prev7d
  const prevReviews = joined.filter(r => r.date && r.date >= eightDaysAgoStr && r.date < oneDayAgoStr);
  const prevTopicMap = {};
  prevReviews.forEach(r => {
    if (r.primary_topic) {
      prevTopicMap[r.primary_topic] = (prevTopicMap[r.primary_topic] || 0) + 1;
    }
  });
  const prev7d = Object.entries(prevTopicMap).map(([primary_topic, count]) => ({
    primary_topic,
    daily_avg: count / 7.0
  }));

  return { recent24h, prev7d };
}

export function getSentimentShiftStats() {
  const joined = getJoinedReviews().filter(r => r.cleaned_text !== null && r.is_spam === 0);
  
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  const oneDayAgoStr = oneDayAgo.toISOString().split('T')[0];

  const eightDaysAgo = new Date();
  eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
  const eightDaysAgoStr = eightDaysAgo.toISOString().split('T')[0];

  // recent
  const recentReviews = joined.filter(r => r.date && r.date >= oneDayAgoStr);
  const recentGroups = {};
  recentReviews.forEach(r => {
    if (r.primary_topic) {
      if (!recentGroups[r.primary_topic]) {
        recentGroups[r.primary_topic] = { total: 0, negative: 0 };
      }
      recentGroups[r.primary_topic].total++;
      if (r.sentiment === 'negative') {
        recentGroups[r.primary_topic].negative++;
      }
    }
  });
  const recent = Object.entries(recentGroups).map(([primary_topic, data]) => ({
    primary_topic,
    neg_pct: (data.negative * 100.0) / data.total
  }));

  // baseline
  const prevReviews = joined.filter(r => r.date && r.date >= eightDaysAgoStr && r.date < oneDayAgoStr);
  const prevGroups = {};
  prevReviews.forEach(r => {
    if (r.primary_topic) {
      if (!prevGroups[r.primary_topic]) {
        prevGroups[r.primary_topic] = { total: 0, negative: 0 };
      }
      prevGroups[r.primary_topic].total++;
      if (r.sentiment === 'negative') {
        prevGroups[r.primary_topic].negative++;
      }
    }
  });
  const baseline = Object.entries(prevGroups).map(([primary_topic, data]) => ({
    primary_topic,
    neg_pct: (data.negative * 100.0) / data.total
  }));

  return { recent, baseline };
}

export function getWeeklyStats() {
  const joined = getJoinedReviews().filter(r => r.cleaned_text !== null && r.is_spam === 0);
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const weeklyReviews = joined.filter(r => r.date && r.date >= sevenDaysAgoStr);
  
  const totalReviews = weeklyReviews.length;

  // topTopics
  const topicMap = {};
  weeklyReviews.forEach(r => {
    if (r.primary_topic) {
      if (!topicMap[r.primary_topic]) {
        topicMap[r.primary_topic] = { count: 0, negative: 0 };
      }
      topicMap[r.primary_topic].count++;
      if (r.sentiment === 'negative') {
        topicMap[r.primary_topic].negative++;
      }
    }
  });
  const topTopics = Object.entries(topicMap)
    .map(([primary_topic, data]) => ({
      primary_topic,
      count: data.count,
      neg_pct: (data.negative * 100.0) / data.count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // sentimentBreakdown
  const sentimentMap = {};
  weeklyReviews.forEach(r => {
    if (r.sentiment) {
      sentimentMap[r.sentiment] = (sentimentMap[r.sentiment] || 0) + 1;
    }
  });
  const sentimentBreakdown = Object.entries(sentimentMap).map(([sentiment, count]) => ({
    sentiment,
    count
  }));

  // topSegments
  const segmentMap = {};
  weeklyReviews.forEach(r => {
    if (r.user_type) {
      if (!segmentMap[r.user_type]) {
        segmentMap[r.user_type] = { count: 0, totalRating: 0, ratedCount: 0, negative: 0 };
      }
      const s = segmentMap[r.user_type];
      s.count++;
      if (r.rating !== null && r.rating !== undefined) {
        s.totalRating += r.rating;
        s.ratedCount++;
      }
      if (r.sentiment === 'negative') {
        s.negative++;
      }
    }
  });
  const topSegments = Object.entries(segmentMap)
    .map(([user_type, s]) => ({
      user_type,
      count: s.count,
      avg_rating: s.ratedCount > 0 ? s.totalRating / s.ratedCount : 0,
      neg_pct: (s.negative * 100.0) / s.count
    }))
    .sort((a, b) => b.neg_pct - a.neg_pct);

  // topComplaints
  const complaintMap = {};
  weeklyReviews.forEach(r => {
    if (r.unmet_need) {
      complaintMap[r.unmet_need] = (complaintMap[r.unmet_need] || 0) + 1;
    }
  });
  const topComplaints = Object.entries(complaintMap)
    .map(([unmet_need, count]) => ({ unmet_need, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // topPraises
  const praiseMap = {};
  weeklyReviews.forEach(r => {
    if (r.primary_topic && r.sentiment === 'positive') {
      praiseMap[r.primary_topic] = (praiseMap[r.primary_topic] || 0) + 1;
    }
  });
  const topPraises = Object.entries(praiseMap)
    .map(([primary_topic, count]) => ({ primary_topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return { totalReviews, topTopics, sentimentBreakdown, topSegments, topComplaints, topPraises };
}

export function getReviewsByIds(reviewIds, filters = {}) {
  let list = getJoinedReviews();
  const idSet = new Set(reviewIds);
  list = list.filter(r => idSet.has(r.id));

  if (filters.source) {
    list = list.filter(r => r.source === filters.source);
  }
  if (filters.minRating !== undefined && filters.minRating !== null) {
    list = list.filter(r => r.rating !== null && r.rating >= filters.minRating);
  }
  if (filters.maxRating !== undefined && filters.maxRating !== null) {
    list = list.filter(r => r.rating !== null && r.rating <= filters.maxRating);
  }
  if (filters.topic) {
    list = list.filter(r => r.primary_topic === filters.topic);
  }

  return list;
}

// ── Discovery Insights Queries ────────────────────────────────────────────

/**
 * Returns structured answers for all 6 discovery focus questions.
 */
export function getDiscoveryInsights() {
  const all = getJoinedReviews().filter(r => r.cleaned_text !== null && r.is_spam === 0);

  // Q1: Why do users struggle to discover new music?
  const discoveryReviews = all.filter(r => r.primary_topic === 'music_discovery');
  const discoveryNegative = discoveryReviews.filter(r => r.sentiment === 'negative');
  const discoveryNeeds = {};
  discoveryNegative.forEach(r => {
    if (r.unmet_need) discoveryNeeds[r.unmet_need] = (discoveryNeeds[r.unmet_need] || 0) + 1;
  });
  const topDiscoveryNeeds = Object.entries(discoveryNeeds).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([need, count]) => ({ need, count }));

  // Q2: Most common algorithm frustrations
  const algoReviews = all.filter(r => r.primary_topic === 'recommendations_algorithm');
  const algoNegative = algoReviews.filter(r => r.sentiment === 'negative');
  const algoNeeds = {};
  algoNegative.forEach(r => {
    if (r.unmet_need) algoNeeds[r.unmet_need] = (algoNeeds[r.unmet_need] || 0) + 1;
  });
  const topAlgoFrustrations = Object.entries(algoNeeds).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([need, count]) => ({ need, count }));
  const algoNegPct = algoReviews.length > 0 ? Math.round((algoNegative.length / algoReviews.length) * 100) : 0;

  // Q3: What listening behaviors are users trying to achieve?
  const behaviorGoals = {};
  all.forEach(r => {
    if (r.user_goal) {
      behaviorGoals[r.user_goal] = (behaviorGoals[r.user_goal] || 0) + 1;
    }
  });
  const topBehaviors = Object.entries(behaviorGoals).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([goal, count]) => ({ goal, count }));

  // Q4: What causes repeat listening?
  const repeatReviews = all.filter(r => r.primary_topic === 'repeat_listening');
  const repeatMindset = {};
  all.forEach(r => {
    if (r.discovery_mindset) repeatMindset[r.discovery_mindset] = (repeatMindset[r.discovery_mindset] || 0) + 1;
  });
  const creatureOfHabit = all.filter(r => r.user_type === 'creature_of_habit');
  const repeatCauses = {};
  repeatReviews.forEach(r => {
    if (r.unmet_need) repeatCauses[r.unmet_need] = (repeatCauses[r.unmet_need] || 0) + 1;
  });
  const topRepeatCauses = Object.entries(repeatCauses).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cause, count]) => ({ cause, count }));

  // Q5: Which user segments experience different discovery challenges?
  const segmentDiscovery = {};
  all.filter(r => r.primary_topic === 'music_discovery' || r.primary_topic === 'recommendations_algorithm').forEach(r => {
    if (r.user_type) {
      if (!segmentDiscovery[r.user_type]) segmentDiscovery[r.user_type] = { total: 0, negative: 0 };
      segmentDiscovery[r.user_type].total++;
      if (r.sentiment === 'negative') segmentDiscovery[r.user_type].negative++;
    }
  });
  const segmentChallenges = Object.entries(segmentDiscovery).map(([segment, data]) => ({
    segment,
    total: data.total,
    negPct: data.total > 0 ? Math.round((data.negative / data.total) * 100) : 0,
  })).sort((a, b) => b.negPct - a.negPct);

  // Q6: Unmet needs across all reviews
  const allNeeds = {};
  const needSources = {};
  all.forEach(r => {
    if (r.unmet_need) {
      allNeeds[r.unmet_need] = (allNeeds[r.unmet_need] || 0) + 1;
      if (!needSources[r.unmet_need]) needSources[r.unmet_need] = new Set();
      if (r.source) needSources[r.unmet_need].add(r.source);
    }
  });
  const topUnmetNeeds = Object.entries(allNeeds)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([need, count]) => ({
      need,
      count,
      sources: [...(needSources[need] || [])],
      crossSource: (needSources[need] || new Set()).size,
    }));

  return {
    discoveryStruggles: {
      totalReviews: discoveryReviews.length,
      negativePercent: discoveryReviews.length > 0 ? Math.round((discoveryNegative.length / discoveryReviews.length) * 100) : 0,
      topUnmetNeeds: topDiscoveryNeeds,
    },
    algorithmFrustrations: {
      totalReviews: algoReviews.length,
      negativePercent: algoNegPct,
      topFrustrations: topAlgoFrustrations,
    },
    listeningBehaviors: {
      topGoals: topBehaviors,
      mindsetBreakdown: Object.entries(repeatMindset).map(([mindset, count]) => ({ mindset, count })),
    },
    repeatListening: {
      totalReviews: repeatReviews.length,
      creatureOfHabitCount: creatureOfHabit.length,
      topCauses: topRepeatCauses,
      prefersFamiliarPct: repeatMindset['prefers_familiar'] && all.length > 0
        ? Math.round((repeatMindset['prefers_familiar'] / all.length) * 100)
        : 0,
    },
    segmentChallenges,
    topUnmetNeeds,
    totalAnalyzed: all.length,
  };
}

/**
 * Returns frustration heatmap data: topic × user_type matrix.
 */
export function getFrustrationHeatmap() {
  const all = getJoinedReviews().filter(r => r.cleaned_text !== null && r.is_spam === 0 && r.primary_topic && r.user_type);

  const TOPICS = ['music_discovery', 'recommendations_algorithm', 'repeat_listening', 'playlist_quality', 'search_experience', 'ui_navigation', 'podcast_content', 'audio_quality', 'offline_mode', 'social_features', 'pricing_value'];
  const SEGMENTS = ['power_user', 'casual_listener', 'new_user', 'churned_user', 'podcast_listener', 'music_explorer', 'creature_of_habit'];

  const matrix = {};
  TOPICS.forEach(topic => {
    matrix[topic] = {};
    SEGMENTS.forEach(seg => {
      matrix[topic][seg] = { total: 0, negative: 0, avgFrustration: 0, totalFrustration: 0 };
    });
  });

  all.forEach(r => {
    const topic = r.primary_topic;
    const seg = r.user_type;
    if (matrix[topic] && matrix[topic][seg] !== undefined) {
      matrix[topic][seg].total++;
      if (r.sentiment === 'negative') matrix[topic][seg].negative++;
      if (r.frustration_level) {
        matrix[topic][seg].totalFrustration += r.frustration_level;
      }
    }
  });

  // Convert to heatmap cells
  const cells = [];
  TOPICS.forEach(topic => {
    SEGMENTS.forEach(seg => {
      const cell = matrix[topic][seg];
      cells.push({
        topic,
        segment: seg,
        total: cell.total,
        negPct: cell.total > 0 ? Math.round((cell.negative / cell.total) * 100) : 0,
        avgFrustration: cell.total > 0 ? Math.round((cell.totalFrustration / cell.total) * 10) / 10 : 0,
        intensity: cell.total > 0 ? Math.min(100, Math.round((cell.negative / cell.total) * 100)) : 0,
      });
    });
  });

  return { cells, topics: TOPICS, segments: SEGMENTS };
}

/**
 * Returns clustered listening behavior goals.
 */
export function getBehaviorClusters() {
  const all = getJoinedReviews().filter(r => r.cleaned_text !== null && r.is_spam === 0);

  // Group by usage pattern and mindset
  const patternMap = {};
  const mindsetMap = {};

  all.forEach(r => {
    if (r.usage_pattern) {
      if (!patternMap[r.usage_pattern]) patternMap[r.usage_pattern] = { count: 0, topics: {} };
      patternMap[r.usage_pattern].count++;
      if (r.primary_topic) {
        patternMap[r.usage_pattern].topics[r.primary_topic] = (patternMap[r.usage_pattern].topics[r.primary_topic] || 0) + 1;
      }
    }
    if (r.discovery_mindset) {
      mindsetMap[r.discovery_mindset] = (mindsetMap[r.discovery_mindset] || 0) + 1;
    }
  });

  const patterns = Object.entries(patternMap).map(([pattern, data]) => ({
    pattern,
    count: data.count,
    topTopics: Object.entries(data.topics).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([topic, count]) => ({ topic, count })),
  }));

  const mindsets = Object.entries(mindsetMap).map(([mindset, count]) => ({ mindset, count }));

  // User type distribution
  const userTypeMap = {};
  all.forEach(r => {
    if (r.user_type) userTypeMap[r.user_type] = (userTypeMap[r.user_type] || 0) + 1;
  });
  const userTypes = Object.entries(userTypeMap).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);

  return { patterns, mindsets, userTypes, totalReviews: all.length };
}

/**
 * Returns ranked unmet needs with cross-source evidence.
 */
export function getUnmetNeedsRanked(limit = 20) {
  const all = getJoinedReviews().filter(r => r.cleaned_text !== null && r.is_spam === 0 && r.unmet_need);

  const needMap = {};
  all.forEach(r => {
    if (!needMap[r.unmet_need]) {
      needMap[r.unmet_need] = {
        count: 0,
        sources: new Set(),
        topics: new Set(),
        segments: new Set(),
        totalFrustration: 0,
        examples: [],
      };
    }
    const entry = needMap[r.unmet_need];
    entry.count++;
    if (r.source) entry.sources.add(r.source);
    if (r.primary_topic) entry.topics.add(r.primary_topic);
    if (r.user_type) entry.segments.add(r.user_type);
    if (r.frustration_level) entry.totalFrustration += r.frustration_level;
    if (entry.examples.length < 2 && (r.cleaned_text || r.text)) {
      entry.examples.push({
        text: (r.cleaned_text || r.text).substring(0, 200),
        source: r.source,
        rating: r.rating,
        date: r.date,
      });
    }
  });

  return Object.entries(needMap)
    .map(([need, data]) => ({
      need,
      count: data.count,
      sources: [...data.sources],
      crossSourceCount: data.sources.size,
      topics: [...data.topics],
      segments: [...data.segments],
      avgFrustration: data.count > 0 ? Math.round((data.totalFrustration / data.count) * 10) / 10 : 0,
      examples: data.examples,
    }))
    .sort((a, b) => (b.crossSourceCount * 2 + b.count) - (a.crossSourceCount * 2 + a.count))
    .slice(0, limit);
}

export function closeDb() {
  saveDb();
}
