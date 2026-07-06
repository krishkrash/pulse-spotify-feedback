import { getDb, insertDigest, getLatestDigest } from '../db/sqlite.js';

/**
 * TrendMonitorAgent — Proactively detects spikes, emerging topics, and sentiment shifts.
 */

export class TrendMonitorAgent {
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
    } catch { return false; }
  }

  async detectTrends() {
    console.log('[TrendMonitor] Analyzing trends...');
    const { getTrendStats } = await import('../db/sqlite.js');
    const { recent24h, prev7d } = getTrendStats();

    const avgMap = new Map(prev7d.map(r => [r.primary_topic, r.daily_avg]));
    const trending = [];

    for (const topic of recent24h) {
      const avg = avgMap.get(topic.primary_topic) || 1;
      const change = ((topic.count - avg) / avg) * 100;
      if (change > 50) {
        trending.push({
          topic: topic.primary_topic,
          current: topic.count,
          average: Math.round(avg * 10) / 10,
          changePercent: Math.round(change),
        });
      }
    }

    // Detect sentiment shifts
    const sentimentShifts = await this.detectSentimentShifts();

    console.log(`[TrendMonitor] Found ${trending.length} trending topics, ${sentimentShifts.length} sentiment shifts`);
    return { trending, sentimentShifts };
  }

  async detectSentimentShifts() {
    const { getSentimentShiftStats } = await import('../db/sqlite.js');
    const { recent, baseline } = getSentimentShiftStats();
    const baselineMap = new Map(baseline.map(r => [r.primary_topic, r.neg_pct]));
    const shifts = [];

    for (const topic of recent) {
      const base = baselineMap.get(topic.primary_topic) || 0;
      const shift = topic.neg_pct - base;
      if (shift > 30) {
        shifts.push({
          topic: topic.primary_topic,
          currentNegPct: Math.round(topic.neg_pct),
          baselineNegPct: Math.round(base),
          shiftPct: Math.round(shift),
        });
      }
    }

    return shifts;
  }

  async generateWeeklyDigest() {
    console.log('[TrendMonitor] Generating weekly digest...');
    const { getWeeklyStats } = await import('../db/sqlite.js');
    const weekStats = getWeeklyStats();

    let digest;
    const hasGemini = await this.initGemini();

    if (hasGemini) {
      digest = await this.generateGeminiDigest(weekStats);
    } else {
      digest = this.generateRuleBasedDigest(weekStats);
    }

    // Store digest
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekEnd = now.toISOString().split('T')[0];

    insertDigest(weekStart, weekEnd, digest);
    console.log('[TrendMonitor] Weekly digest generated and stored');

    // Send to Slack if configured
    await this.sendSlackAlert(digest);

    return digest;
  }

  async generateGeminiDigest(weekStats) {
    const prompt = `Summarize this week's Spotify user feedback data in exactly 5 bullet points.
Focus on: biggest complaint, biggest praise, emerging issue, user segment most affected, and one surprising insight.

Weekly Data:
- Total reviews: ${weekStats.totalReviews}
- Top topics: ${weekStats.topTopics.map(t => `${t.primary_topic} (${t.count} mentions, ${Math.round(t.neg_pct)}% negative)`).join(', ')}
- Sentiment: ${weekStats.sentimentBreakdown.map(s => `${s.sentiment}: ${s.count}`).join(', ')}
- Most affected segment: ${weekStats.topSegments[0]?.user_type || 'N/A'} (${Math.round(weekStats.topSegments[0]?.neg_pct || 0)}% negative)
- Top complaints: ${weekStats.topComplaints.map(c => `"${c.unmet_need}" (${c.count}x)`).join(', ')}
- Most praised: ${weekStats.topPraises.map(p => `${p.primary_topic} (${p.count})`).join(', ')}

Return a JSON object with this structure:
{
  "biggest_complaint": { "title": "...", "detail": "...", "change": "+X%" },
  "biggest_praise": { "title": "...", "detail": "..." },
  "emerging_issue": { "title": "...", "detail": "...", "volume": "Nx normal" },
  "most_affected_segment": { "segment": "...", "detail": "...", "negative_pct": "X%" },
  "surprising_insight": { "title": "...", "detail": "..." },
  "summary": "One paragraph summary"
}`;

    try {
      const result = await this.geminiClient.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error(`[TrendMonitor] Gemini digest error: ${err.message}`);
    }

    return this.generateRuleBasedDigest(weekStats);
  }

  generateRuleBasedDigest(weekStats) {
    const topComplaint = weekStats.topTopics.find(t => t.neg_pct > 50) || weekStats.topTopics[0];
    const topPraise = weekStats.topPraises[0];
    const topSegment = weekStats.topSegments[0];

    return {
      biggest_complaint: {
        title: topComplaint ? topComplaint.primary_topic.replace(/_/g, ' ') : 'General dissatisfaction',
        detail: topComplaint ? `${topComplaint.count} mentions with ${Math.round(topComplaint.neg_pct)}% negative sentiment` : 'No data',
        change: 'Trending this week',
      },
      biggest_praise: {
        title: topPraise ? topPraise.primary_topic.replace(/_/g, ' ') : 'Overall service',
        detail: topPraise ? `${topPraise.count} positive mentions` : 'No data',
      },
      emerging_issue: {
        title: weekStats.topTopics[1]?.primary_topic?.replace(/_/g, ' ') || 'No emerging issue',
        detail: weekStats.topTopics[1] ? `${weekStats.topTopics[1].count} mentions` : 'No spikes detected',
        volume: weekStats.topTopics[1] ? `${weekStats.topTopics[1].count} reviews` : '0',
      },
      most_affected_segment: {
        segment: topSegment?.user_type?.replace(/_/g, ' ') || 'Unknown',
        detail: topSegment ? `Highest negative sentiment this week` : 'No data',
        negative_pct: topSegment ? `${Math.round(topSegment.neg_pct)}%` : '0%',
      },
      surprising_insight: {
        title: 'Cross-topic sentiment gap',
        detail: `Users with complaints about ${topComplaint?.primary_topic?.replace(/_/g, ' ') || 'features'} still rate other aspects positively`,
      },
      summary: `This week saw ${weekStats.totalReviews} reviews. The most discussed topic was ${topComplaint?.primary_topic?.replace(/_/g, ' ') || 'general feedback'} with ${topComplaint?.count || 0} mentions. ${topSegment?.user_type?.replace(/_/g, ' ') || 'Users'} were the most vocal segment.`,
      generated_at: new Date().toISOString(),
      total_reviews: weekStats.totalReviews,
    };
  }

  async sendSlackAlert(digest) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.log('[TrendMonitor] No Slack webhook configured, skipping alert');
      return;
    }

    try {
      const payload = {
        text: `📊 *Pulse Weekly Digest*\n\n` +
          `📉 *Biggest Complaint:* ${digest.biggest_complaint.title} — ${digest.biggest_complaint.detail}\n` +
          `📈 *Biggest Praise:* ${digest.biggest_praise.title} — ${digest.biggest_praise.detail}\n` +
          `🔥 *Emerging Issue:* ${digest.emerging_issue.title} — ${digest.emerging_issue.detail}\n` +
          `👥 *Most Affected:* ${digest.most_affected_segment.segment} — ${digest.most_affected_segment.detail}\n` +
          `💡 *Surprising:* ${digest.surprising_insight.title} — ${digest.surprising_insight.detail}`,
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('[TrendMonitor] Slack alert sent');
    } catch (err) {
      console.error(`[TrendMonitor] Slack alert failed: ${err.message}`);
    }
  }
}
