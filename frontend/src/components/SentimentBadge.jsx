import React from 'react';

export default function SentimentBadge({ sentiment }) {
  const getStyles = () => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'negative':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'mixed':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-semibold tracking-wide uppercase rounded-full border ${getStyles()}`}>
      {sentiment || 'Neutral'}
    </span>
  );
}
