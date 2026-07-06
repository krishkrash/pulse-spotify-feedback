import { Apple, Play, Flame, MessageSquare, ThumbsUp, ExternalLink } from 'lucide-react';
import SentimentBadge from './SentimentBadge';
import TopicTag from './TopicTag';

const TwitterIcon = (props) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

export default function ReviewCard({ review }) {
  const getSourceIcon = (source) => {
    switch (source) {
      case 'app_store':
        return <Apple className="w-4 h-4 text-gray-300" />;
      case 'play_store':
        return <Play className="w-4 h-4 text-green-400" />;
      case 'reddit':
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'twitter':
        return <TwitterIcon className="w-4 h-4 text-sky-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getSourceLabel = (source) => {
    switch (source) {
      case 'app_store': return 'App Store';
      case 'play_store': return 'Play Store';
      case 'reddit': return 'Reddit';
      case 'twitter': return 'Twitter';
      case 'forum': return 'Forum';
      default: return 'Feedback';
    }
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    return (
      <div className="flex gap-0.5 text-amber-400 text-xs">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < rating ? 'opacity-100' : 'opacity-20'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="glass-panel glass-panel-hover p-5 rounded-xl flex flex-col gap-3 relative overflow-hidden">
      {/* Top row: Source, Author, Rating */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-zinc-800/80 p-1.5 rounded-lg flex items-center justify-center">
            {getSourceIcon(review.source)}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-200">{getSourceLabel(review.source)}</h4>
            <p className="text-[10px] text-zinc-400">By {review.author || 'Anonymous'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {renderStars(review.rating)}
          <span className="text-[10px] text-zinc-400">{review.date}</span>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-1.5">
        {review.sentiment && <SentimentBadge sentiment={review.sentiment} />}
        {review.primary_topic && <TopicTag topic={review.primary_topic} />}
        {review.user_type && (
          <span className="bg-zinc-800/60 text-zinc-300 border border-zinc-700/50 px-2 py-0.5 text-[10px] font-medium rounded-md uppercase tracking-wider">
            {review.user_type.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* Review Text */}
      <p className="text-sm text-gray-300 leading-relaxed break-words whitespace-pre-line">
        {review.cleaned_text || review.text}
      </p>

      {/* Bottom row: Upvotes & Link */}
      <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800/60 mt-auto">
        <div className="flex items-center gap-1.5">
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>{review.upvotes || 0}</span>
        </div>
        {review.url && (
          <a
            href={review.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-zinc-400 hover:text-spotify-green transition-colors"
          >
            <span>View Source</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
