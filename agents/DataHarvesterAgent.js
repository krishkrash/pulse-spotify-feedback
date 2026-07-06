import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * DataHarvesterAgent — Collects raw user feedback from multiple sources.
 * Falls back to seed data when API credentials are not configured.
 */
export class DataHarvesterAgent {
  constructor(config = {}) {
    this.config = config;
    this.results = [];
  }

  generateId(text, source) {
    return createHash('sha256').update(`${source}:${text}`).digest('hex').substring(0, 16);
  }

  async harvestViaPythonScraper() {
    return new Promise((resolve) => {
      console.log('[DataHarvester] Invoking Python scraper...');
      const scraperPath = path.join(__dirname, '..', 'scraper', 'scraper.py');
      
      const process = spawn('python3', [scraperPath, '--limit', '100']);
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code !== 0) {
          console.error(`[DataHarvester] Python scraper failed with exit code ${code}`);
          console.error(stderr);
          resolve(0);
          return;
        }
        
        try {
          const outputPath = path.join(__dirname, '..', 'scraper', 'output', 'reviews.json');
          const fileData = readFileSync(outputPath, 'utf8');
          const scrapedReviews = JSON.parse(fileData);
          
          if (Array.isArray(scrapedReviews) && scrapedReviews.length > 0) {
            console.log(`[DataHarvester] Successfully loaded ${scrapedReviews.length} reviews from Python scraper.`);
            this.results.push(...scrapedReviews);
            resolve(scrapedReviews.length);
          } else {
            console.log('[DataHarvester] Python scraper returned empty review list.');
            resolve(0);
          }
        } catch (err) {
          console.error('[DataHarvester] Failed to read or parse Python scraper output:', err);
          resolve(0);
        }
      });
    });
  }

  async harvest() {
    console.log('[DataHarvester] Starting data collection...');
    this.results = [];

    // 1. Try python scraper first
    const pythonResultsCount = await this.harvestViaPythonScraper();
    
    // 2. If python scraper collected no results, fall back to individual API scrapers and seeds
    if (pythonResultsCount === 0) {
      console.log('[DataHarvester] Python scraper returned no reviews. Falling back to Node.js APIs & seeds...');
      const sources = [
        this.harvestAppStore(),
        this.harvestPlayStore(),
        this.harvestReddit(),
        this.harvestForum(),
        this.harvestTwitter(),
      ];

      const results = await Promise.allSettled(sources);
      
      let totalFromAPIs = 0;
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          totalFromAPIs += result.value;
        }
      }

      // If no API data was collected, load seed data
      if (totalFromAPIs === 0) {
        console.log('[DataHarvester] No API credentials configured. Loading seed data...');
        await this.loadSeedData();
      }
    }

    // Deduplicate
    const seen = new Set();
    this.results = this.results.filter(r => {
      const hash = this.generateId(r.text, r.source);
      if (seen.has(hash)) return false;
      seen.add(hash);
      r.id = hash;
      return true;
    });

    console.log(`[DataHarvester] Collected ${this.results.length} unique reviews`);
    return this.results;
  }

  async harvestAppStore() {
    try {
      const appStore = await import('app-store-scraper');
      console.log('[DataHarvester] Fetching App Store reviews...');
      const reviews = await appStore.default.reviews({
        id: '324684580',
        sort: appStore.default.sort.RECENT,
        num: 200,
        country: 'us'
      });

      for (const r of reviews) {
        this.results.push({
          id: this.generateId(r.text || r.title, 'app_store'),
          source: 'app_store',
          text: `${r.title || ''} ${r.text || ''}`.trim(),
          rating: r.score,
          date: r.updated ? new Date(r.updated).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          author: r.userName || 'anonymous',
          upvotes: r.voteCount || 0,
          url: r.url || `https://apps.apple.com/app/spotify/id324684580`
        });
      }

      console.log(`[DataHarvester] Got ${reviews.length} App Store reviews`);
      return reviews.length;
    } catch (err) {
      console.log(`[DataHarvester] App Store scraping skipped: ${err.message}`);
      return 0;
    }
  }

  async harvestPlayStore() {
    try {
      const gplay = await import('google-play-scraper');
      console.log('[DataHarvester] Fetching Play Store reviews...');
      const reviews = await gplay.default.reviews({
        appId: 'com.spotify.music',
        sort: gplay.default.sort.NEWEST,
        num: 200
      });

      for (const r of reviews.data || reviews) {
        const review = r.data || r;
        this.results.push({
          id: this.generateId(review.text || '', 'play_store'),
          source: 'play_store',
          text: review.text || '',
          rating: review.score,
          date: review.date ? new Date(review.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          author: review.userName || 'anonymous',
          upvotes: review.thumbsUp || 0,
          url: `https://play.google.com/store/apps/details?id=com.spotify.music`
        });
      }

      const count = (reviews.data || reviews).length;
      console.log(`[DataHarvester] Got ${count} Play Store reviews`);
      return count;
    } catch (err) {
      console.log(`[DataHarvester] Play Store scraping skipped: ${err.message}`);
      return 0;
    }
  }

  async harvestReddit() {
    const { REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT } = process.env;
    if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
      console.log('[DataHarvester] Reddit API credentials not configured, skipping');
      return 0;
    }

    try {
      const snoowrap = await import('snoowrap');
      const reddit = new snoowrap.default({
        userAgent: REDDIT_USER_AGENT || 'PulseBot/1.0',
        clientId: REDDIT_CLIENT_ID,
        clientSecret: REDDIT_CLIENT_SECRET,
        username: '',
        password: ''
      });

      const subreddits = ['spotify', 'Music'];
      let count = 0;

      for (const sub of subreddits) {
        const posts = await reddit.getSubreddit(sub).getNew({ limit: 50 });
        for (const post of posts) {
          const text = `${post.title} ${post.selftext || ''}`.trim();
          if (text.toLowerCase().includes('spotify')) {
            this.results.push({
              id: this.generateId(text, 'reddit'),
              source: 'reddit',
              text,
              rating: null,
              date: new Date(post.created_utc * 1000).toISOString().split('T')[0],
              author: `u/${post.author?.name || 'deleted'}`,
              upvotes: post.score || 0,
              url: `https://reddit.com${post.permalink}`
            });
            count++;
          }
        }
      }

      console.log(`[DataHarvester] Got ${count} Reddit posts`);
      return count;
    } catch (err) {
      console.log(`[DataHarvester] Reddit scraping failed: ${err.message}`);
      return 0;
    }
  }

  async harvestForum() {
    // Spotify community forum scraping (basic attempt)
    try {
      const cheerio = await import('cheerio');
      console.log('[DataHarvester] Forum scraping not implemented (requires browser), skipping');
      return 0;
    } catch (err) {
      console.log(`[DataHarvester] Forum scraping skipped: ${err.message}`);
      return 0;
    }
  }

  async harvestTwitter() {
    const { TWITTER_BEARER_TOKEN } = process.env;
    if (!TWITTER_BEARER_TOKEN) {
      console.log('[DataHarvester] Twitter API credentials not configured, skipping');
      return 0;
    }

    try {
      const query = encodeURIComponent('(spotify recommendations OR spotify discovery OR spotify algorithm) -is:retweet lang:en');
      const url = `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=100&tweet.fields=created_at,public_metrics,author_id`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${TWITTER_BEARER_TOKEN}` }
      });

      if (!response.ok) throw new Error(`Twitter API ${response.status}`);
      const data = await response.json();

      let count = 0;
      for (const tweet of data.data || []) {
        this.results.push({
          id: this.generateId(tweet.text, 'twitter'),
          source: 'twitter',
          text: tweet.text,
          rating: null,
          date: tweet.created_at ? tweet.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          author: `@${tweet.author_id}`,
          upvotes: tweet.public_metrics?.like_count || 0,
          url: `https://twitter.com/i/status/${tweet.id}`
        });
        count++;
      }

      console.log(`[DataHarvester] Got ${count} tweets`);
      return count;
    } catch (err) {
      console.log(`[DataHarvester] Twitter scraping failed: ${err.message}`);
      return 0;
    }
  }

  async loadSeedData() {
    try {
      const seedPath = path.join(__dirname, '..', 'data', 'seed-reviews.json');
      const data = JSON.parse(readFileSync(seedPath, 'utf-8'));
      this.results.push(...data);
      console.log(`[DataHarvester] Loaded ${data.length} seed reviews`);
    } catch (err) {
      console.error(`[DataHarvester] Failed to load seed data: ${err.message}`);
    }
  }
}
