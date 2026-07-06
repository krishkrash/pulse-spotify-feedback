import React from 'react';
import { Sparkles, MessageSquare, Target, Lightbulb, Users } from 'lucide-react';

export default function InsightAnswer({ answer }) {
  if (!answer) return null;

  // Extremely basic markdown-to-JSX parser to style the AI response beautifully.
  // The prompt structures it into 5 distinct numbered or bold headers.
  const parseAnswer = (text) => {
    const lines = text.split('\n');
    let currentSection = null;
    const sections = {
      directAnswer: [],
      keyPatterns: [],
      quotes: [],
      segments: [],
      productDirection: [],
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Classify sections based on headers or numbered lists
      if (trimmed.toLowerCase().includes('direct answer') || (trimmed.startsWith('1.') && trimmed.toLowerCase().includes('answer'))) {
        currentSection = 'directAnswer';
      } else if (trimmed.toLowerCase().includes('key pattern') || (trimmed.startsWith('2.') && trimmed.toLowerCase().includes('pattern'))) {
        currentSection = 'keyPatterns';
      } else if (trimmed.toLowerCase().includes('quote') || (trimmed.startsWith('3.') && trimmed.toLowerCase().includes('quote'))) {
        currentSection = 'quotes';
      } else if (trimmed.toLowerCase().includes('segment') || (trimmed.startsWith('4.') && trimmed.toLowerCase().includes('segment'))) {
        currentSection = 'segments';
      } else if (trimmed.toLowerCase().includes('suggested product') || trimmed.toLowerCase().includes('direction') || (trimmed.startsWith('5.') && trimmed.toLowerCase().includes('direction'))) {
        currentSection = 'productDirection';
      } else if (currentSection) {
        sections[currentSection].push(line);
      } else {
        // Default to direct answer if no header has been hit yet
        sections.directAnswer.push(line);
      }
    });

    return sections;
  };

  const sections = parseAnswer(answer);

  // Helper to strip markdown bolding and bullet markers
  const cleanLine = (str) => {
    return str
      .replace(/^\d+\.\s*/, '') // Remove list numberings
      .replace(/^[-*•]\s*/, '') // Remove bullet points
      .replace(/\*\*/g, '')     // Remove bolding markdown
      .trim();
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Direct Answer */}
      <div className="glass-panel p-6 rounded-2xl border-t-2 border-t-purple-500 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl" />
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-gray-100 text-sm tracking-wider uppercase">AI Synthesized Insight</h3>
        </div>
        <p className="text-gray-200 text-sm md:text-base leading-relaxed">
          {sections.directAnswer.length > 0 
            ? sections.directAnswer.map(cleanLine).join(' ') 
            : cleanLine(answer)}
        </p>
      </div>

      {/* Grid of Key Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2. Key Patterns */}
        {sections.keyPatterns.length > 0 && (
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/80">
              <Target className="w-4 h-4 text-sky-400" />
              <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Identified Patterns</h4>
            </div>
            <ul className="flex flex-col gap-2.5 text-xs text-zinc-300">
              {sections.keyPatterns.map((line, i) => {
                const cleaned = cleanLine(line);
                if (!cleaned) return null;
                return (
                  <li key={i} className="flex gap-2 items-start leading-relaxed">
                    <span className="text-sky-400 select-none">•</span>
                    <span>{cleaned}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* 4. Affected User Segments */}
        {sections.segments.length > 0 && (
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/80">
              <Users className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Affected Segments</h4>
            </div>
            <ul className="flex flex-col gap-2.5 text-xs text-zinc-300">
              {sections.segments.map((line, i) => {
                const cleaned = cleanLine(line);
                if (!cleaned) return null;
                return (
                  <li key={i} className="flex gap-2 items-start leading-relaxed">
                    <span className="text-emerald-400 select-none">•</span>
                    <span>{cleaned}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* 3. Quotes */}
      {sections.quotes.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/80">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Illustrative User Quotes</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.quotes.map((line, i) => {
              const cleaned = cleanLine(line);
              if (!cleaned) return null;
              return (
                <div key={i} className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/40 italic text-xs text-zinc-300 leading-relaxed">
                  "{cleaned.replace(/^["']|["']$/g, '')}"
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Product Direction */}
      {sections.productDirection.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-spotify-green shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-spotify-green animate-pulse" />
            <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Recommended Product Direction</h4>
          </div>
          <p className="text-xs md:text-sm text-zinc-300 leading-relaxed font-medium">
            {sections.productDirection.map(cleanLine).join(' ')}
          </p>
        </div>
      )}
    </div>
  );
}
