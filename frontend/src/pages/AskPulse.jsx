import React, { useState } from 'react';
import { Send, Sparkles, Filter, ListFilter, AlertCircle, Copy, Check } from 'lucide-react';
import WaveformHeader from '../components/WaveformHeader';
import InsightAnswer from '../components/InsightAnswer';
import ReviewCard from '../components/ReviewCard';
import { getApiUrl } from '../api';

const SUGGESTED_CHIPS = [
  "Why do users struggle to discover new music?",
  "What recommendations algorithm bugs are being reported?",
  "Why are users stuck listening to the same songs repeatedly?",
  "What features do power users request most?",
  "What is frustrating churned users?"
];

export default function AskPulse() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [source, setSource] = useState('');
  const [topic, setTopic] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');

  const handleAsk = async (text) => {
    const qText = text || question;
    if (!qText.trim()) return;

    try {
      setLoading(true);
      setResult(null);
      
      const payload = {
        question: qText,
        filters: {}
      };

      if (source) payload.filters.source = source;
      if (topic) payload.filters.topic = topic;
      if (minRating) payload.filters.minRating = parseInt(minRating);
      if (maxRating) payload.filters.maxRating = parseInt(maxRating);

      const res = await fetch(getApiUrl('/api/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Error asking Pulse:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.answer) return;
    navigator.clipboard.writeText(result.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto max-h-screen flex flex-col">
      <WaveformHeader 
        title="Ask Pulse" 
        subtitle="Conversational RAG agent that synthesizes structured answers using raw reviews as evidence" 
      />

      {/* Main chat entry section */}
      <div className="glass-panel p-6 rounded-2xl shadow-lg flex flex-col gap-4 mb-6">
        <div className="flex gap-2 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-spotify-green animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ask the Intelligence System</span>
          </div>
          
          <button 
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all ${
              filtersOpen 
                ? 'bg-spotify-green/20 text-spotify-green border-spotify-green/30' 
                : 'bg-zinc-800 text-zinc-300 border-zinc-700/50 hover:bg-zinc-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Expandable filters block */}
        {filtersOpen && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-zinc-900/40 rounded-xl border border-zinc-800/80 animate-fadeIn">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Source</label>
              <select 
                value={source} 
                onChange={(e) => setSource(e.target.value)}
                className="bg-zinc-800 border border-zinc-700/50 text-zinc-300 text-xs rounded-lg p-2 focus:outline-none focus:border-spotify-green"
              >
                <option value="">All Sources</option>
                <option value="app_store">App Store</option>
                <option value="play_store">Play Store</option>
                <option value="reddit">Reddit</option>
                <option value="twitter">Twitter</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Topic</label>
              <select 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)}
                className="bg-zinc-800 border border-zinc-700/50 text-zinc-300 text-xs rounded-lg p-2 focus:outline-none focus:border-spotify-green"
              >
                <option value="">All Topics</option>
                <option value="music_discovery">Music Discovery</option>
                <option value="recommendations_algorithm">Recommendations Algorithm</option>
                <option value="repeat_listening">Repeat Listening</option>
                <option value="playlist_quality">Playlist Quality</option>
                <option value="search_experience">Search Experience</option>
                <option value="ui_navigation">UI Navigation</option>
                <option value="podcast_content">Podcast Content</option>
                <option value="audio_quality">Audio Quality</option>
                <option value="offline_mode">Offline Mode</option>
                <option value="social_features">Social Features</option>
                <option value="pricing_value">Pricing Value</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Min Rating</label>
              <select 
                value={minRating} 
                onChange={(e) => setMinRating(e.target.value)}
                className="bg-zinc-800 border border-zinc-700/50 text-zinc-300 text-xs rounded-lg p-2 focus:outline-none focus:border-spotify-green"
              >
                <option value="">Any</option>
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Max Rating</label>
              <select 
                value={maxRating} 
                onChange={(e) => setMaxRating(e.target.value)}
                className="bg-zinc-800 border border-zinc-700/50 text-zinc-300 text-xs rounded-lg p-2 focus:outline-none focus:border-spotify-green"
              >
                <option value="">Any</option>
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
              </select>
            </div>
          </div>
        )}

        {/* Input box */}
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3 focus-within:border-spotify-green transition-all">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Type your product inquiry (e.g. Why do users hate the recommendations algorithm?)..."
            className="flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder-zinc-600"
          />
          <button 
            onClick={() => handleAsk()}
            disabled={loading || !question.trim()}
            className="bg-spotify-green hover:bg-emerald-400 text-black p-2.5 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Suggested chips list */}
        <div className="flex items-center flex-wrap gap-2 pt-1.5">
          <span className="text-[10px] uppercase font-bold text-zinc-500 mr-1.5">Suggestions:</span>
          {SUGGESTED_CHIPS.map((chip, i) => (
            <button
              key={i}
              onClick={() => {
                setQuestion(chip);
                handleAsk(chip);
              }}
              className="bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/85 hover:border-zinc-700 text-[11px] text-zinc-400 hover:text-gray-200 px-3 py-1.5 rounded-full transition-all"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Answers Display area */}
      <div className="flex-1 flex flex-col gap-6">
        {loading && (
          <div className="glass-panel p-10 rounded-2xl flex flex-col items-center justify-center gap-4">
            <div className="flex items-end gap-1.5 h-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-1 bg-spotify-green rounded-full wave-bar"
                  style={{ height: '32px', animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider animate-pulse">Running semantic retrieval and AI analysis...</p>
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start animate-fadeIn">
            {/* AI Synthesized output */}
            <div className="xl:col-span-2 flex flex-col gap-4">
              <div className="flex justify-between items-center bg-zinc-900/40 p-3 px-4 rounded-xl border border-zinc-800/60">
                <span className="text-xs text-zinc-400 font-medium">Source Evidence: {result.reviewCount} matching reviews</span>
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 p-1.5 px-3 rounded-lg border border-zinc-800 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-spotify-green" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Response'}</span>
                </button>
              </div>
              <InsightAnswer answer={result.answer} />
            </div>

            {/* Cited source reviews panel */}
            <div className="flex flex-col gap-4 glass-panel p-6 rounded-2xl xl:sticky xl:top-8 max-h-[75vh] overflow-hidden">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/80">
                <ListFilter className="w-4 h-4 text-spotify-green" />
                <h3 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Semantic Sources</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
                {result.reviews?.map((r, i) => (
                  <div key={r.id} className="relative group">
                    <span className="absolute top-3 left-3 bg-zinc-800 text-zinc-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-zinc-700 z-10">
                      {i + 1}
                    </span>
                    <div className="pl-6">
                      <ReviewCard review={r} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {!loading && !result && (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-800/80 rounded-2xl p-16 text-center">
            <AlertCircle className="w-10 h-10 text-zinc-700 mb-3" />
            <h3 className="text-base font-bold text-zinc-400">Consult the Intelligence Engine</h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1">Submit a question regarding recommendation loops, music discovery, billing pain, or UI updates to query reviews.</p>
          </div>
        )}
      </div>
    </div>
  );
}
