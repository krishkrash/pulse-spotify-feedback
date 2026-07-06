import React from 'react';
import { Activity } from 'lucide-react';

export default function WaveformHeader({ title, subtitle }) {
  // Generate random animation delays for the equalizer bars to look realistic
  const bars = Array.from({ length: 24 }).map((_, i) => ({
    height: Math.floor(Math.random() * 24) + 8,
    delay: `${(i % 5) * 0.2}s`,
  }));

  return (
    <div className="glass-panel p-6 rounded-2xl flex items-center justify-between gap-6 border-l-4 border-l-spotify-green shadow-xl relative overflow-hidden mb-6">
      {/* Background radial gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-spotify-green/5 rounded-full blur-3xl -z-10" />

      <div className="flex items-center gap-4">
        <div className="bg-spotify-green/10 p-3 rounded-xl flex items-center justify-center border border-spotify-green/20">
          <Activity className="w-6 h-6 text-spotify-green animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">{title}</h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Decorative Waveform Animating Bars */}
      <div className="hidden sm:flex items-end gap-1.5 h-10 pr-2">
        {bars.map((bar, i) => (
          <div
            key={i}
            className="w-1 bg-spotify-green/85 rounded-full wave-bar"
            style={{
              height: `${bar.height}px`,
              animationDelay: bar.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
}
