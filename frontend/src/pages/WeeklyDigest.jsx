import React, { useState, useEffect } from 'react';
import { FileText, AlertTriangle, Heart, Zap, UserCheck, HelpCircle, Copy, Check, Download } from 'lucide-react';
import WaveformHeader from '../components/WaveformHeader';
import { getApiUrl } from '../api';

export default function WeeklyDigest() {
  const [digest, setDigest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchDigestData = async () => {
    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/api/digest'));
      const data = await res.json();
      setDigest(data.latest);
      setHistory(data.history || []);
    } catch (err) {
      console.error('Error fetching weekly digest:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDigestData();
  }, []);

  const handleCopySlack = () => {
    if (!digest) return;
    
    const d = digest.content;
    const slackText = `📊 *Pulse Weekly Digest (${digest.week_start} to ${digest.week_end})*\n\n` +
      `📉 *Biggest Complaint:* ${d.biggest_complaint?.title} — ${d.biggest_complaint?.detail}\n` +
      `📈 *Biggest Praise:* ${d.biggest_praise?.title} — ${d.biggest_praise?.detail}\n` +
      `🔥 *Emerging Issue:* ${d.emerging_issue?.title} — ${d.emerging_issue?.detail}\n` +
      `👥 *Most Affected:* ${d.most_affected_segment?.segment} — ${d.most_affected_segment?.detail}\n` +
      `💡 *Surprising Insight:* ${d.surprising_insight?.title} — ${d.surprising_insight?.detail}\n\n` +
      `📝 *Summary:* ${d.summary}`;

    navigator.clipboard.writeText(slackText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    if (!digest) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(digest, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", `pulse_digest_${digest.week_start}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-[#0c0b0b]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-spotify-green border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider animate-pulse">Assembling report...</p>
        </div>
      </div>
    );
  }

  const dContent = digest?.content;

  return (
    <div className="flex-1 p-8 overflow-y-auto max-h-screen">
      <WaveformHeader 
        title="Weekly Digest" 
        subtitle="AI-synthesized weekly reporting on complaint spikes, product praises, and consumer shifts" 
      />

      {digest ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          {/* Main Digest details */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {/* Header row with action buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/80">
              <div>
                <h3 className="font-bold text-gray-200 text-sm">Report Period</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{digest.week_start} to {digest.week_end}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleCopySlack}
                  className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-850 hover:bg-zinc-800 p-2 px-3 rounded-lg border border-zinc-800 transition-all font-semibold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-spotify-green" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy for Slack'}</span>
                </button>
                <button 
                  onClick={handleDownloadJSON}
                  className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-850 hover:bg-zinc-800 p-2 px-3 rounded-lg border border-zinc-800 transition-all font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            {/* Digest Summary Paragraph */}
            {dContent?.summary && (
              <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-spotify-green shadow-md">
                <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider mb-2">Executive Summary</h4>
                <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                  {dContent.summary}
                </p>
              </div>
            )}

            {/* Bullet blocks list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Biggest complaint */}
              {dContent?.biggest_complaint && (
                <div className="glass-panel p-6 rounded-2xl flex flex-col gap-3 border-t-2 border-t-rose-500">
                  <div className="flex items-center gap-2 text-rose-400">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Biggest Complaint</h4>
                  </div>
                  <h3 className="text-base font-extrabold text-white capitalize">{dContent.biggest_complaint.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{dContent.biggest_complaint.detail}</p>
                  {dContent.biggest_complaint.change && (
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mt-1 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full w-fit">
                      {dContent.biggest_complaint.change}
                    </span>
                  )}
                </div>
              )}

              {/* Biggest Praise */}
              {dContent?.biggest_praise && (
                <div className="glass-panel p-6 rounded-2xl flex flex-col gap-3 border-t-2 border-t-emerald-500">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Heart className="w-5 h-5 shrink-0" />
                    <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Biggest Praise</h4>
                  </div>
                  <h3 className="text-base font-extrabold text-white capitalize">{dContent.biggest_praise.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{dContent.biggest_praise.detail}</p>
                </div>
              )}

              {/* Emerging Issue */}
              {dContent?.emerging_issue && (
                <div className="glass-panel p-6 rounded-2xl flex flex-col gap-3 border-t-2 border-t-amber-500">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Zap className="w-5 h-5 shrink-0 animate-pulse" />
                    <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider font-semibold">Emerging Spike</h4>
                  </div>
                  <h3 className="text-base font-extrabold text-white capitalize">{dContent.emerging_issue.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{dContent.emerging_issue.detail}</p>
                  {dContent.emerging_issue.volume && (
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mt-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full w-fit">
                      Volume: {dContent.emerging_issue.volume}
                    </span>
                  )}
                </div>
              )}

              {/* Affected Segment */}
              {dContent?.most_affected_segment && (
                <div className="glass-panel p-6 rounded-2xl flex flex-col gap-3 border-t-2 border-t-sky-500">
                  <div className="flex items-center gap-2 text-sky-400">
                    <UserCheck className="w-5 h-5 shrink-0" />
                    <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Most Impacted Segment</h4>
                  </div>
                  <h3 className="text-base font-extrabold text-white capitalize">{dContent.most_affected_segment.segment}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{dContent.most_affected_segment.detail}</p>
                  {dContent.most_affected_segment.negative_pct && (
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mt-1 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full w-fit">
                      Negative Ratio: {dContent.most_affected_segment.negative_pct}
                    </span>
                  )}
                </div>
              )}

              {/* Surprising Insight */}
              {dContent?.surprising_insight && (
                <div className="glass-panel p-6 rounded-2xl flex flex-col gap-3 border-t-2 border-t-purple-500 md:col-span-2">
                  <div className="flex items-center gap-2 text-purple-400">
                    <HelpCircle className="w-5 h-5 shrink-0" />
                    <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Surprising Insight</h4>
                  </div>
                  <h3 className="text-base font-extrabold text-white">{dContent.surprising_insight.title}</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed font-medium">{dContent.surprising_insight.detail}</p>
                </div>
              )}
            </div>
          </div>

          {/* Previous Weekly Reports Archive */}
          <div className="glass-panel p-6 rounded-2xl h-fit shadow-lg flex flex-col gap-4 xl:sticky xl:top-8 max-h-[80vh]">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/80">
              <FileText className="w-4 h-4 text-spotify-green" />
              <h3 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Report Archive</h3>
            </div>

            <div className="overflow-y-auto flex flex-col gap-3 pr-1">
              {history.length > 0 ? (
                history.map((h, i) => (
                  <button
                    key={h.id}
                    onClick={() => setDigest(h)}
                    className={`text-left p-3.5 rounded-xl border flex flex-col gap-1 transition-all ${
                      digest.id === h.id
                        ? 'bg-spotify-green/10 border-spotify-green text-white font-bold'
                        : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Week #{h.id}</span>
                    <span className="text-xs font-bold leading-none mt-1">Period: {h.week_start}</span>
                    <span className="text-[10px] text-zinc-400 mt-1 leading-normal truncate w-full">
                      {h.content?.summary || 'Report Generated'}
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-center text-zinc-500 text-xs py-8">
                  No previous digests stored.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-24 glass-panel rounded-2xl border border-dashed border-zinc-850">
          <FileText className="w-12 h-12 text-zinc-650 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-400">No digest generated yet</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">Run a database sync or trigger report compilation from System Control to compile weekly feedback models.</p>
        </div>
      )}
    </div>
  );
}
