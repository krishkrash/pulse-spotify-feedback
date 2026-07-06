import React from 'react';

const TOPIC_COLORS = {
  music_discovery: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  recommendations_algorithm: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  repeat_listening: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
  playlist_quality: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  search_experience: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  ui_navigation: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  podcast_content: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  audio_quality: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  offline_mode: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  social_features: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  pricing_value: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  onboarding: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  other: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
};

export default function TopicTag({ topic }) {
  const cleanTopic = topic ? topic.replace(/_/g, ' ') : 'Other';
  const colorClass = TOPIC_COLORS[topic] || TOPIC_COLORS.other;

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-md border capitalize ${colorClass}`}>
      {cleanTopic}
    </span>
  );
}
