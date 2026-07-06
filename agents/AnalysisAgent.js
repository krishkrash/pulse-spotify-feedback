import { insertAnalysisBatch } from '../db/sqlite.js';

/**
 * AnalysisAgent — Runs AI classification on every review using Gemini 2.0 Flash.
 * Falls back to rule-based classification when no API key is configured.
 */

const TOPIC_LABELS = [
  'music_discovery', 'recommendations_algorithm', 'repeat_listening',
  'playlist_quality', 'search_experience', 'ui_navigation', 'podcast_content',
  'audio_quality', 'offline_mode', 'social_features', 'pricing_value',
  'onboarding', 'other'
];

const USER_TYPES = [
  'power_user', 'casual_listener', 'new_user', 'churned_user',
  'podcast_listener', 'music_explorer', 'creature_of_habit'
];

// Keyword maps for rule-based fallback
const TOPIC_KEYWORDS = {
  music_discovery: ['discover', 'discovery', 'new music', 'explore', 'find new', 'new artist', 'new song', 'recommendation', 'suggest'],
  recommendations_algorithm: ['algorithm', 'recommend', 'suggestion', 'daily mix', 'discover weekly', 'release radar', 'ai dj', 'personali'],
  repeat_listening: ['repeat', 'same song', 'loop', 'over and over', 'recycled', 'stuck', 'same 40', 'same 30', 'familiar'],
  playlist_quality: ['playlist', 'curated', 'editorial', 'made for you', 'blend', 'collaborative', 'collab'],
  search_experience: ['search', 'find', 'browse', 'filter', 'sort', 'organize', 'library management'],
  ui_navigation: ['ui', 'interface', 'design', 'layout', 'navigation', 'button', 'widget', 'screen', 'home screen', 'ux'],
  podcast_content: ['podcast', 'audiobook', 'joe rogan', 'video podcast', 'episode', 'chapter'],
  audio_quality: ['audio quality', 'sound quality', 'hifi', 'lossless', 'bitrate', 'equalizer', 'eq', 'dac', 'bass'],
  offline_mode: ['offline', 'download', 'airplane', 'no internet', 'cache', 'storage'],
  social_features: ['social', 'friend', 'share', 'collaborative', 'blend', 'group session', 'listening party'],
  pricing_value: ['price', 'cost', 'value', 'subscription', 'premium', 'free tier', 'student', 'family plan', 'duo', 'pay'],
  onboarding: ['new user', 'just started', 'switched from', 'first time', 'getting started', 'sign up', 'onboarding'],
};

const USER_TYPE_KEYWORDS = {
  power_user: ['power user', 'years', 'playlist', 'curate', 'thousands', '10 years', '8 years', '7 years', '5 years', 'producer', 'dj', 'professional'],
  casual_listener: ['casual', 'background', 'cooking', 'cleaning', 'commute', 'occasionally', 'simple'],
  new_user: ['new user', 'just started', 'just switched', 'new to', 'first time', 'recently joined', 'just got'],
  churned_user: ['canceled', 'cancelled', 'switched to', 'leaving', 'unsubscribed', 'quit', 'stopped using', 'left spotify'],
  podcast_listener: ['podcast', 'episode', 'podcaster', 'creator', 'audiobook'],
  music_explorer: ['explore', 'discover', 'new genre', 'adventure', 'eclectic', 'diverse', 'cross-genre', 'world music', 'underground'],
  creature_of_habit: ['same songs', 'comfort', 'familiar', 'repeat', 'routine', 'habit', 'creature of habit', 'same 200'],
};

export class AnalysisAgent {
  constructor() {
    this.geminiClient = null;
    this.stats = { total: 0, analyzed: 0, errors: 0, usedGemini: false };
  }

  async initGemini() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return false;

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      this.geminiClient = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      return true;
    } catch (err) {
      console.log(`[Analysis] Gemini init failed: ${err.message}`);
      return false;
    }
  }

  async analyze(reviews) {
    console.log(`[Analysis] Analyzing ${reviews.length} reviews...`);
    this.stats.total = reviews.length;

    const hasGemini = await this.initGemini();

    if (hasGemini) {
      console.log('[Analysis] Using Gemini 2.0 Flash for analysis');
      this.stats.usedGemini = true;
      await this.analyzeWithGemini(reviews);
    } else {
      console.log('[Analysis] No Gemini API key, using rule-based analysis');
      await this.analyzeRuleBased(reviews);
    }

    console.log(`[Analysis] Complete: ${this.stats.analyzed} analyzed, ${this.stats.errors} errors`);
    return this.stats;
  }

  /**
   * Extract retry delay (in ms) from a Gemini 429 error message.
   * e.g. "Please retry in 37.49s" → 38000
   */
  _getRetryDelay(err) {
    const match = err.message && err.message.match(/retry in ([\d.]+)s/);
    if (match) return Math.ceil(parseFloat(match[1]) + 2) * 1000; // add 2s buffer
    return 15000; // default 15s
  }

  async analyzeWithGemini(reviews) {
    const batchSize = 10;
    const maxRetries = 3;

    for (let i = 0; i < reviews.length; i += batchSize) {
      const batch = reviews.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(reviews.length / batchSize);
      console.log(`[Analysis] Gemini batch ${batchNum}/${totalBatches}`);

      let success = false;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const results = await this.geminiAnalyzeBatch(batch);
          if (results.length > 0) {
            insertAnalysisBatch(results);
            this.stats.analyzed += results.length;
          }
          success = true;
          break;
        } catch (err) {
          const is429 = err.message && (err.message.includes('429') || err.message.includes('quota'));
          if (is429 && attempt < maxRetries) {
            const delay = this._getRetryDelay(err);
            console.warn(`[Analysis] Quota hit on batch ${batchNum} (attempt ${attempt}/${maxRetries}). Waiting ${Math.round(delay/1000)}s then retrying...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error(`[Analysis] Gemini batch ${batchNum} failed after ${attempt} attempt(s): ${err.message}. Falling back to rule-based.`);
            const results = batch.map(r => this.ruleBasedAnalysis(r));
            insertAnalysisBatch(results);
            this.stats.analyzed += results.length;
            break;
          }
        }
      }

      // Polite delay between batches to stay within free-tier rate limits (15 req/min)
      if (i + batchSize < reviews.length) {
        await new Promise(resolve => setTimeout(resolve, 4500));
      }
    }
  }

  async geminiAnalyzeBatch(reviews) {
    const reviewTexts = reviews.map((r, i) =>
      `Review ${i + 1} (ID: ${r.id}, Source: ${r.source}, Rating: ${r.rating || 'N/A'}):\n"${(r.cleaned_text || r.text).substring(0, 500)}"`
    ).join('\n\n');

    const prompt = `Analyze these Spotify user reviews. For EACH review, return a JSON object with ALL of the following fields.

IMPORTANT: Return ONLY a JSON array, no markdown, no explanation.

For each review, provide:
{
  "review_id": "the review ID",
  "sentiment": "positive|negative|neutral|mixed",
  "sentiment_intensity": "low|medium|high",
  "sentiment_emotion": "frustrated|delighted|confused|bored|excited|disappointed",
  "primary_topic": "one of: music_discovery, recommendations_algorithm, repeat_listening, playlist_quality, search_experience, ui_navigation, podcast_content, audio_quality, offline_mode, social_features, pricing_value, onboarding, other",
  "secondary_topics": ["topic1", "topic2"],
  "topic_confidence": 0.0-1.0,
  "user_goal": "one sentence",
  "unmet_need": "one sentence or null",
  "frustration_level": 1-5,
  "feature_request": "specific feature or null",
  "user_type": "power_user|casual_listener|new_user|churned_user|podcast_listener|music_explorer|creature_of_habit",
  "usage_pattern": "daily|weekly|occasional",
  "discovery_mindset": "open_to_new|prefers_familiar|mixed"
}

Reviews:
${reviewTexts}`;

    const result = await this.geminiClient.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response
    let jsonStr = text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      console.error('[Analysis] Failed to parse Gemini response, falling back to rule-based');
      return reviews.map(r => this.ruleBasedAnalysis(r));
    }
  }

  async analyzeRuleBased(reviews) {
    const results = reviews.map(r => this.ruleBasedAnalysis(r));
    insertAnalysisBatch(results);
    this.stats.analyzed = results.length;
  }

  ruleBasedAnalysis(review) {
    const text = (review.cleaned_text || review.text).toLowerCase();

    // Sentiment from rating or sentiment_hint
    let sentiment = review.sentiment_hint || 'neutral';
    if (review.rating) {
      if (review.rating <= 2) sentiment = 'negative';
      else if (review.rating >= 4) sentiment = 'positive';
      else sentiment = 'mixed';
    }

    const intensity = review.rating <= 1 || review.rating >= 5 ? 'high' :
      review.rating === 2 || review.rating === 4 ? 'medium' : 'low';

    // Emotion based on sentiment + keywords
    let emotion = 'neutral';
    if (sentiment === 'negative') {
      if (text.includes('frustrat') || text.includes('annoying') || text.includes('rage')) emotion = 'frustrated';
      else if (text.includes('disappoint') || text.includes('sad') || text.includes('miss')) emotion = 'disappointed';
      else if (text.includes('confus') || text.includes('unclear') || text.includes('overwhelm')) emotion = 'confused';
      else emotion = 'frustrated';
    } else if (sentiment === 'positive') {
      if (text.includes('love') || text.includes('amazing') || text.includes('incredible')) emotion = 'delighted';
      else if (text.includes('excit') || text.includes('wow') || text.includes('best')) emotion = 'excited';
      else emotion = 'delighted';
    } else {
      emotion = text.includes('bore') || text.includes('meh') ? 'bored' : 'confused';
    }

    // Topic detection
    let primaryTopic = 'other';
    let topicConfidence = 0.3;
    const topicScores = {};

    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      let score = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) score++;
      }
      topicScores[topic] = score;
    }

    const sortedTopics = Object.entries(topicScores)
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1]);

    if (sortedTopics.length > 0) {
      primaryTopic = sortedTopics[0][0];
      topicConfidence = Math.min(0.95, 0.4 + sortedTopics[0][1] * 0.15);
    }

    const secondaryTopics = sortedTopics.slice(1, 3).map(([topic]) => topic);

    // User type detection
    let userType = 'casual_listener';
    let bestTypeScore = 0;

    for (const [type, keywords] of Object.entries(USER_TYPE_KEYWORDS)) {
      let score = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) score++;
      }
      if (score > bestTypeScore) {
        bestTypeScore = score;
        userType = type;
      }
    }

    // Usage pattern heuristic
    const usagePattern = text.includes('every day') || text.includes('daily') || text.includes('8+ hours') ? 'daily' :
      text.includes('weekly') || text.includes('commute') ? 'weekly' : 'occasional';

    // Discovery mindset
    const discoveryMindset = text.includes('new music') || text.includes('discover') || text.includes('explore') ? 'open_to_new' :
      text.includes('same song') || text.includes('familiar') || text.includes('comfort') ? 'prefers_familiar' : 'mixed';

    // User goal and unmet need
    let userGoal = 'Listen to and enjoy music on Spotify';
    let unmetNeed = null;
    let frustrationLevel = 3;
    let featureRequest = null;

    if (primaryTopic === 'music_discovery') {
      userGoal = 'Discover new music that matches their taste';
      unmetNeed = 'Better music discovery beyond mainstream recommendations';
    } else if (primaryTopic === 'recommendations_algorithm') {
      userGoal = 'Get personalized music recommendations';
      unmetNeed = 'Algorithm that truly understands individual taste nuances';
    } else if (primaryTopic === 'repeat_listening') {
      userGoal = 'Break out of repetitive listening patterns';
      unmetNeed = 'Recommendations that go beyond listening history';
    } else if (primaryTopic === 'playlist_quality') {
      userGoal = 'Organize and manage music collections effectively';
      unmetNeed = 'Better playlist management and curation tools';
    } else if (primaryTopic === 'search_experience') {
      userGoal = 'Find specific music quickly and accurately';
      unmetNeed = 'Improved search with filtering and in-library search';
    } else if (primaryTopic === 'ui_navigation') {
      userGoal = 'Navigate the app intuitively and efficiently';
      unmetNeed = 'More intuitive UI with better feature discoverability';
    } else if (primaryTopic === 'podcast_content') {
      userGoal = 'Use Spotify primarily for music without podcast interference';
      unmetNeed = 'Ability to separate music and podcast experiences';
    } else if (primaryTopic === 'audio_quality') {
      userGoal = 'Enjoy high-quality audio playback';
      unmetNeed = 'Better EQ controls and consistent audio quality';
    } else if (primaryTopic === 'offline_mode') {
      userGoal = 'Listen to music reliably without internet';
      unmetNeed = 'More reliable offline mode and download management';
    } else if (primaryTopic === 'social_features') {
      userGoal = 'Share and discover music with friends';
      unmetNeed = 'More meaningful social features and friend interactions';
    } else if (primaryTopic === 'pricing_value') {
      userGoal = 'Get good value for their music streaming subscription';
      unmetNeed = 'Better value proposition for the subscription price';
    }

    if (sentiment === 'negative') frustrationLevel = review.rating ? Math.max(1, 6 - review.rating) : 4;
    else if (sentiment === 'positive') frustrationLevel = 1;
    else frustrationLevel = 3;

    // Extract feature requests (simple heuristic)
    const requestPatterns = [
      /(?:please add|i wish|they should add|we need|please bring back|feature request:?)\s*(.{10,80})/i,
      /(?:why can't|why isn't|why doesn't)\s*(.{10,80})/i,
    ];

    for (const pattern of requestPatterns) {
      const match = text.match(pattern);
      if (match) {
        featureRequest = match[1].trim();
        if (featureRequest.length > 80) featureRequest = featureRequest.substring(0, 80);
        break;
      }
    }

    return {
      review_id: review.id,
      sentiment,
      sentiment_intensity: intensity,
      sentiment_emotion: emotion,
      primary_topic: primaryTopic,
      secondary_topics: secondaryTopics,
      topic_confidence: topicConfidence,
      user_goal: userGoal,
      unmet_need: unmetNeed,
      frustration_level: frustrationLevel,
      feature_request: featureRequest,
      user_type: userType,
      usage_pattern: usagePattern,
      discovery_mindset: discoveryMindset,
    };
  }
}
