import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, MessageSquare, ShieldAlert } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import WaveformHeader from '../components/WaveformHeader';
import ReviewCard from '../components/ReviewCard';
import SentimentBadge from '../components/SentimentBadge';
import { getApiUrl } from '../api';

const TOPICS = [
  { id: 'music_discovery', label: 'Music Discovery' },
  { id: 'recommendations_algorithm', label: 'Recommendations Algorithm' },
  { id: 'repeat_listening', label: 'Repeat Listening' },
  { id: 'playlist_quality', label: 'Playlist Quality' },
  { id: 'search_experience', label: 'Search Experience' },
  { id: 'ui_navigation', label: 'UI Navigation' },
  { id: 'podcast_content', label: 'Podcast & Audiobook' },
  { id: 'audio_quality', label: 'Audio Quality' },
  { id: 'offline_mode', label: 'Offline Mode' },
  { id: 'social_features', label: 'Social Features' },
  { id: 'pricing_value', label: 'Pricing & Value' },
];

export default function TopicExplorer() {
  const [selectedTopic, setSelectedTopic] = useState('music_discovery');
  const [topicStats, setTopicStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTopicDetails = async (topicId) => {
    try {
      setLoading(true);
      const [statsRes, reviewsRes] = await Promise.all([
        fetch(getApiUrl(`/api/topics/${topicId}`)),
        fetch(getApiUrl(`/api/reviews?topic=${topicId}&limit=10`))
      ]);

      const stats = await statsRes.json();
      const reviewsData = await reviewsRes.json();

      setTopicStats(stats);
      setReviews(reviewsData.reviews || []);
    } catch (err) {
      console.error('Error fetching topic details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopicDetails(selectedTopic);
  }, [selectedTopic]);

  const sourceChartData = topicStats?.sources?.map(s => ({
    source: s.source.replace('_', ' '),
    count: s.count
  })) || [];

  return (
    <div className="flex-1 p-8 overflow-y-auto max-h-screen">
      <WaveformHeader 
        title="Topic Explorer" 
        subtitle="Analyze feedback segments by specific topics, including sentiment and source distributions" 
      />

      {/* Selector Chips */}
      <div className="flex gap-2 flex-wrap mb-8 pb-4 border-b border-zinc-800/60">
        {TOPICS.map((topic) => (
          <button
            key={topic.id}
            onClick={() => setSelectedTopic(topic.id)}
            className={`text-xs font-semibold px-4 py-2.5 rounded-full border transition-all ${
              selectedTopic === topic.id
                ? 'bg-spotify-green text-black border-spotify-green font-bold shadow-md shadow-spotify-green/10'
                : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-800/80'
            }`}
          >
            {topic.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-spotify-green border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider animate-pulse">Retrieving cluster data...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Topic Analytics column */}
          <div className="xl:col-span-2 flex flex-col gap-8">
            {/* Topic Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="glass-panel p-5 rounded-2xl shadow-md">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total Mentions</span>
                <h3 className="text-3xl font-extrabold text-white mt-1">{topicStats?.total || 0} reviews</h3>
              </div>

              <div className="glass-panel p-5 rounded-2xl shadow-md">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Sentiment Breakdown</span>
                <div className="flex gap-1.5 mt-3">
                  {topicStats?.sentiments?.map((s) => (
                    <div 
                      key={s.sentiment}
                      className="flex flex-col items-center gap-1 bg-zinc-900/60 border border-zinc-800 p-2 rounded-xl flex-1 text-center"
                    >
                      <SentimentBadge sentiment={s.sentiment} />
                      <span className="text-sm font-extrabold text-white mt-1">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Source Distribution Chart */}
            <div className="glass-panel p-6 rounded-2xl shadow-lg">
              <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider mb-6">Source Channels Distribution</h4>
              <div className="h-64">
                {sourceChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourceChartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="source" stroke="#71717a" tickLine={false} style={{ fontSize: '10px', textTransform: 'capitalize' }} />
                      <YAxis stroke="#71717a" tickLine={false} style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} />
                      <Bar dataKey="count" fill="#1DB954" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500 text-xs">No distribution data</div>
                )}
              </div>
            </div>

            {/* Topic reviews feed */}
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Evidence Corpus Feed</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))
                ) : (
                  <div className="col-span-2 text-center text-zinc-500 text-xs py-12 border border-dashed border-zinc-800 rounded-2xl">
                    No matching reviews in database for this topic.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Panel: Unmet Needs */}
          <div className="glass-panel p-6 rounded-2xl h-fit shadow-lg flex flex-col gap-4 xl:sticky xl:top-8">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/80">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Top Unmet Needs</h3>
            </div>

            <div className="flex flex-col gap-3">
              {topicStats?.unmetNeeds && topicStats.unmetNeeds.length > 0 ? (
                topicStats.unmetNeeds.map((need, i) => (
                  <div 
                    key={i} 
                    className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-850 flex items-start gap-3 glass-panel-hover"
                  >
                    <div className="bg-rose-500/10 text-rose-400 w-5 h-5 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold border border-rose-500/10">
                      {need.count}
                    </div>
                    <p className="text-xs text-zinc-300 font-medium leading-normal">
                      {need.unmet_need}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center text-zinc-500 text-xs py-8">
                  No explicit pain points mapped
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
