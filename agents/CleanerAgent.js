/**
 * CleanerAgent — Normalizes, filters, and prepares raw data for AI analysis.
 */

// Simple positive/negative word dictionaries for crude sentiment hint
const POSITIVE_WORDS = [
  'love', 'great', 'amazing', 'excellent', 'perfect', 'fantastic', 'awesome',
  'brilliant', 'wonderful', 'best', 'incredible', 'beautiful', 'smooth',
  'intuitive', 'reliable', 'impressive', 'enjoy', 'happy', 'flawless',
  'seamless', 'convenient', 'clean', 'useful', 'recommend', 'solid',
  'superb', 'outstanding', 'delight', 'magical', 'genius', 'invaluable',
  'appreciate', 'pleased', 'worth', 'favorite', 'phenomenal', 'adore',
  'stellar', 'elegant', 'refined', 'polished', 'slick', 'premium',
  'exceptional', 'remarkable', 'splendid', 'terrific', 'magnificent', 'glorious'
];

const NEGATIVE_WORDS = [
  'hate', 'terrible', 'awful', 'worst', 'horrible', 'frustrating', 'broken',
  'annoying', 'useless', 'disappointing', 'trash', 'garbage', 'buggy',
  'stupid', 'pathetic', 'ridiculous', 'unacceptable', 'nightmare', 'disaster',
  'painful', 'atrocious', 'ruined', 'failed', 'crash', 'lag', 'slow',
  'bad', 'poor', 'ugly', 'confusing', 'missing', 'lacks', 'impossible',
  'infuriating', 'invasive', 'bloated', 'overpriced', 'exploitative',
  'aggressive', 'disruptive', 'devastating', 'chaos', 'rage', 'desperate',
  'mediocre', 'embarrassing', 'backwards', 'dystopian', 'criminal', 'joke'
];

export class CleanerAgent {
  constructor() {
    this.stats = {
      total: 0,
      filtered_short: 0,
      filtered_language: 0,
      filtered_spam: 0,
      truncated: 0,
      cleaned: 0,
    };
  }

  async clean(reviews) {
    console.log(`[Cleaner] Processing ${reviews.length} reviews...`);
    this.stats.total = reviews.length;

    const cleaned = [];
    const textFingerprints = new Map(); // For spam detection

    for (const review of reviews) {
      // 1. Skip reviews under 20 characters
      if (!review.text || review.text.length < 20) {
        this.stats.filtered_short++;
        continue;
      }

      // 2. Language detection (simple heuristic — check for common English patterns)
      const lang = this.detectLanguage(review.text);
      if (lang !== 'en') {
        this.stats.filtered_language++;
        continue;
      }

      // 3. Clean the text
      let cleanedText = this.cleanText(review.text);

      // 4. Spam detection
      const fingerprint = this.getFingerprint(cleanedText);
      const prevCount = textFingerprints.get(fingerprint) || 0;
      textFingerprints.set(fingerprint, prevCount + 1);

      if (prevCount > 0) {
        this.stats.filtered_spam++;
        review.is_spam = true;
      }

      // 5. Truncate long reviews
      if (cleanedText.length > 2000) {
        cleanedText = cleanedText.substring(0, 1500);
        // Try to end at a sentence boundary
        const lastPeriod = cleanedText.lastIndexOf('.');
        if (lastPeriod > 1200) {
          cleanedText = cleanedText.substring(0, lastPeriod + 1);
        }
        this.stats.truncated++;
      }

      // 6. Normalize date
      review.date = this.normalizeDate(review.date);

      // 7. Calculate word count and sentiment hint
      const wordCount = cleanedText.split(/\s+/).filter(w => w.length > 0).length;
      const sentimentHint = this.getSentimentHint(cleanedText);

      cleaned.push({
        ...review,
        cleaned_text: cleanedText,
        word_count: wordCount,
        sentiment_hint: sentimentHint,
        language: lang,
        is_spam: review.is_spam || false,
      });
      this.stats.cleaned++;
    }

    console.log(`[Cleaner] Results: ${this.stats.cleaned} cleaned, ${this.stats.filtered_short} too short, ${this.stats.filtered_language} non-English, ${this.stats.filtered_spam} spam, ${this.stats.truncated} truncated`);
    return cleaned;
  }

  cleanText(text) {
    let cleaned = text;

    // Strip HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, '');

    // Strip URLs
    cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');
    cleaned = cleaned.replace(/www\.[^\s]+/g, '');

    // Normalize excessive emoji sequences (keep individual emojis, remove long chains)
    cleaned = cleaned.replace(/([\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])\1{2,}/gu, '$1');

    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Remove zero-width characters
    cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');

    return cleaned;
  }

  detectLanguage(text) {
    // Simple English detection heuristic
    // Check for common English words
    const commonEnglish = ['the', 'is', 'and', 'to', 'of', 'a', 'in', 'that', 'it', 'for', 'was', 'on', 'are', 'with', 'this', 'but', 'not', 'have', 'my', 'from'];
    const words = text.toLowerCase().split(/\s+/);
    const englishWordCount = words.filter(w => commonEnglish.includes(w)).length;
    const ratio = englishWordCount / Math.max(words.length, 1);

    // If more than 10% of words are common English words, consider it English
    return ratio > 0.08 ? 'en' : 'other';
  }

  getFingerprint(text) {
    // Normalize for comparison: lowercase, remove punctuation, sort words
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .sort()
      .join(' ');
  }

  normalizeDate(dateStr) {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
      return d.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  getSentimentHint(text) {
    const words = text.toLowerCase().split(/\s+/);
    let posCount = 0;
    let negCount = 0;

    for (const word of words) {
      const cleaned = word.replace(/[^a-z]/g, '');
      if (POSITIVE_WORDS.includes(cleaned)) posCount++;
      if (NEGATIVE_WORDS.includes(cleaned)) negCount++;
    }

    if (posCount > negCount * 1.5) return 'positive';
    if (negCount > posCount * 1.5) return 'negative';
    if (posCount > 0 && negCount > 0) return 'mixed';
    return 'neutral';
  }
}
