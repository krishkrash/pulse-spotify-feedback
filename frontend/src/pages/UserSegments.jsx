import React, { useState, useEffect } from 'react';
import { Users, Smile, Frown, Sparkles } from 'lucide-react';
import WaveformHeader from '../components/WaveformHeader';
import ReviewCard from '../components/ReviewCard';
import SentimentBadge from '../components/SentimentBadge';
import { getApiUrl } from '../api';

const SEGMENTS = [
  { id: 'power_user', label: 'Power Users', desc: 'Frequent listeners curating large libraries and playlists' },
  { id: 'casual_listener', label: 'Casual Listeners', desc: 'Background listeners seeking simplicity and passive content' },
  { id: 'new_user', label: 'New Users', desc: 'Newly registered accounts navigating onboarding flows' },
  { id: 'churned_user', label: 'Churned Users', desc: 'Inactive or canceled users flagging pricing or competitor features' },
  { id: 'podcast_listener', label: 'Podcast Listeners', desc: 'Primarily listening to talk shows and audiobooks' },
  { id: 'music_explorer', label: 'Music Explorers', desc: 'Actively searching for underground, new, or niche genres' },
  { id: 'creature_of_habit', label: 'Creatures of Habit', desc: 'Prefers looping familiar songs and comfort playlists' },
];

export default function UserSegments() {
  const [selectedSegment, setSelectedSegment] = useState('power_user');
  const [segmentStats, setSegmentStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSegmentDetails = async (segmentId) => {
    try {
      setLoading(true);
      const [statsRes, reviewsRes] = await Promise.all([
        fetch(getApiUrl(`/api/segments/${segmentId}`)),
        fetch(getApiUrl(`/api/reviews?userType=${segmentId}&limit=6`))
      ]);

      const stats = await statsRes.json();
      const reviewsData = await reviewsRes.json();

      setSegmentStats(stats);
      setReviews(reviewsData.reviews || []);
    } catch (err) {
      console.error('Error fetching segment details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegmentDetails(selectedSegment);
  }, [selectedSegment]);

  return (
    <div className="flex-1 p-8 overflow-y-auto max-h-screen">
      <WaveformHeader 
        title="User Segments" 
        subtitle="Analyze feedback trends across distinct consumer classes and listening profiles" 
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left column: Sidebar tabs */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] uppercase font-bold text-zinc-500 px-2">Segment Directory</span>
          {SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              onClick={() => setSelectedSegment(seg.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                selectedSegment === seg.id
                  ? 'bg-spotify-green/10 text-white border-spotify-green shadow-md'
                  : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-800/80'
              }`}
            >
              <h4 className="text-xs font-bold capitalize">{seg.label}</h4>
              <p className="text-[10px] text-zinc-400 mt-1 leading-normal">{seg.desc}</p>
            </button>
          ))}
        </div>

        {/* Right columns: Analytics details */}
        <div className="xl:col-span-3 flex flex-col gap-8">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-spotify-green border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider animate-pulse">Calculating segment models...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary KPIs Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-5 rounded-2xl shadow-md">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Sample Size</span>
                  <h3 className="text-3xl font-extrabold text-white mt-1">{segmentStats?.total || 0} reviews</h3>
                </div>

                <div className="glass-panel p-5 rounded-2xl shadow-md">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Average Rating</span>
                  <h3 className="text-3xl font-extrabold text-amber-400 mt-1">★ {segmentStats?.avgRating || 'N/A'}</h3>
                </div>

                <div className="glass-panel p-5 rounded-2xl shadow-md">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider font-semibold">Primary Interests</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {segmentStats?.topTopics?.map((t, i) => (
                      <span key={i} className="bg-zinc-850 text-zinc-300 text-[10px] border border-zinc-800 p-1 px-2.5 rounded-lg capitalize">
                        {t.topic.replace(/_/g, ' ')} ({t.count})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Wants vs Frustrations columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Wants / Feature requests */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 shadow-lg border-t-2 border-t-emerald-500">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/80">
                    <Smile className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Core Desires & Requests</h4>
                  </div>
                  <div className="flex flex-col gap-3">
                    {segmentStats?.featureRequests && segmentStats.featureRequests.length > 0 ? (
                      segmentStats.featureRequests.map((req, i) => (
                        <div key={i} className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-850 flex items-start gap-2.5">
                          <Sparkles className="w-3.5 h-3.5 text-spotify-green shrink-0 mt-0.5" />
                          <p className="text-xs text-zinc-300 font-medium leading-normal">{req.feature_request}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-zinc-500 text-xs py-8">No specific requests mapped</div>
                    )}
                  </div>
                </div>

                {/* Frustrations / Unmet needs */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 shadow-lg border-t-2 border-t-rose-500">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/80">
                    <Frown className="w-4 h-4 text-rose-400" />
                    <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider font-semibold">Friction Points & Frustrations</h4>
                  </div>
                  <div className="flex flex-col gap-3">
                    {segmentStats?.unmetNeeds && segmentStats.unmetNeeds.length > 0 ? (
                      segmentStats.unmetNeeds.map((need, i) => (
                        <div key={i} className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-850 flex items-start gap-2.5">
                          <span className="text-rose-400 text-sm font-bold shrink-0 mt-0.5">•</span>
                          <p className="text-xs text-zinc-300 font-medium leading-normal">{need.unmet_need}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-zinc-500 text-xs py-8">No specific pain points mapped</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sample feedback feed */}
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Representative Reviews</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))
                  ) : (
                    <div className="col-span-2 text-center text-zinc-500 text-xs py-8">No reviews in database matching this profile</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
