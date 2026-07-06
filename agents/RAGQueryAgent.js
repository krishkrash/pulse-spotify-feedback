import { queryVectors } from '../db/vectorStore.js';
import { getReviewsByIds } from '../db/sqlite.js';
import { EmbeddingAgent } from './EmbeddingAgent.js';

/**
 * RAGQueryAgent — Answers natural language questions about the feedback corpus.
 * Embeds the question, finds similar reviews, and generates structured answers.
 */

const embeddingAgent = new EmbeddingAgent();

export class RAGQueryAgent {
  constructor() {
    this.geminiClient = null;
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
      console.log(`[RAGQuery] Gemini init failed: ${err.message}`);
      return false;
    }
  }

  async query(question, filters = {}) {
    console.log(`[RAGQuery] Processing question: "${question}"`);

    // 1. Embed the question
    const queryVector = await embeddingAgent.embedQuery(question);

    // 2. Find similar reviews
    const similar = await queryVectors(queryVector, 20);

    if (similar.length === 0) {
      return {
        answer: 'No relevant reviews found in the corpus. Try running a data sync first.',
        reviewCount: 0,
        reviews: [],
        question,
      };
    }

    // 3. Fetch full review data with analysis
    const reviewIds = similar.map(s => s.reviewId);
    const reviews = getReviewsByIds(reviewIds, filters);

    // Add similarity scores
    const scoreMap = new Map(similar.map(s => [s.reviewId, s.score]));
    reviews.forEach(r => { r.similarity_score = scoreMap.get(r.id) || 0; });
    reviews.sort((a, b) => b.similarity_score - a.similarity_score);

    // 4. Generate answer
    const hasGemini = await this.initGemini();
    let answer;

    if (hasGemini) {
      answer = await this.generateGeminiAnswer(question, reviews);
    } else {
      answer = this.generateRuleBasedAnswer(question, reviews);
    }

    return {
      answer,
      reviewCount: reviews.length,
      reviews: reviews.slice(0, 10).map(r => ({
        id: r.id,
        source: r.source,
        text: (r.cleaned_text || r.text || '').substring(0, 300),
        rating: r.rating,
        date: r.date,
        author: r.author,
        sentiment: r.sentiment,
        primary_topic: r.primary_topic,
        similarity_score: r.similarity_score,
      })),
      question,
      filters,
    };
  }

  async generateGeminiAnswer(question, reviews) {
    const reviewContext = reviews.map((r, i) => {
      const source = r.source?.replace('_', ' ') || 'Unknown';
      const rating = r.rating ? `⭐${r.rating}` : '';
      const date = r.date || '';
      return `[${i + 1}] [${source} ${rating}, ${date}] "${(r.cleaned_text || r.text || '').substring(0, 400)}"`;
    }).join('\n\n');

    const prompt = `You are Pulse, a feedback intelligence analyst for Spotify's product team.
You have access to thousands of real user reviews from App Store, Play Store, Reddit, forums, and Twitter.

Answer the analyst's question using ONLY the evidence from the provided reviews.
For every insight you state, cite the source (e.g., "[App Store, ⭐2, June 2025]").

Structure your answer as:
1. **Direct answer** (2-3 sentences)
2. **Key patterns found** (bullet points with evidence)
3. **User quotes** that best illustrate the finding (max 3 quotes)
4. **Affected user segments**
5. **Suggested product direction** (1-2 sentences)

If the reviews don't contain enough evidence, say so clearly.
Do not invent or assume facts not present in the reviews.

Retrieved reviews:
${reviewContext}

Analyst question: ${question}`;

    try {
      const result = await this.geminiClient.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.error(`[RAGQuery] Gemini error: ${err.message}`);
      return this.generateRuleBasedAnswer(question, reviews);
    }
  }

  generateRuleBasedAnswer(question, reviews) {
    const total = reviews.length;
    if (total === 0) return 'No relevant reviews found for this question.';

    // Calculate stats
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
    const topicCounts = {};
    const sourceBreakdown = {};

    for (const r of reviews) {
      const s = r.sentiment || 'neutral';
      sentimentCounts[s] = (sentimentCounts[s] || 0) + 1;

      if (r.primary_topic) {
        topicCounts[r.primary_topic] = (topicCounts[r.primary_topic] || 0) + 1;
      }

      if (r.source) {
        sourceBreakdown[r.source] = (sourceBreakdown[r.source] || 0) + 1;
      }
    }

    const negativePct = Math.round((sentimentCounts.negative / total) * 100);
    const topTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0];

    // Build answer
    let answer = `📊 **Based on ${total} relevant reviews:**\n\n`;

    // Direct answer
    answer += `**Overall Sentiment:** ${negativePct}% of relevant reviews express negative sentiment`;
    if (topTopic) {
      answer += `, with "${topTopic[0].replace(/_/g, ' ')}" being the most common topic (${topTopic[1]} mentions).\n\n`;
    } else {
      answer += '.\n\n';
    }

    // Key patterns
    answer += '**Key Patterns:**\n';
    const sortedTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    for (const [topic, count] of sortedTopics) {
      answer += `• ${topic.replace(/_/g, ' ')} — mentioned in ${count} of ${total} relevant reviews\n`;
    }
    answer += '\n';

    // Top quotes
    answer += '**Illustrative Quotes:**\n';
    const topQuotes = reviews
      .filter(r => r.cleaned_text || r.text)
      .slice(0, 3);

    for (const q of topQuotes) {
      const text = (q.cleaned_text || q.text || '').substring(0, 200);
      const source = q.source?.replace('_', ' ') || 'Unknown';
      const rating = q.rating ? `, ⭐${q.rating}` : '';
      answer += `> "${text}..." — [${source}${rating}, ${q.date || ''}]\n\n`;
    }

    // Source breakdown
    answer += '**Source Breakdown:** ';
    const sources = Object.entries(sourceBreakdown).map(([s, c]) => `${s.replace('_', ' ')} (${c})`);
    answer += sources.join(', ') + '\n\n';

    // Suggestion
    answer += '**Suggested Direction:** Focus on the most frequently mentioned pain points, particularly around ' +
      (topTopic ? topTopic[0].replace(/_/g, ' ') : 'user experience') +
      ', to address the core user frustrations identified in this feedback.\n';

    return answer;
  }
}
