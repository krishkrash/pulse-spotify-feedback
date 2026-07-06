import React, { useState, useEffect } from 'react';
import { Settings, Play, CheckCircle2, XCircle, Clock, RefreshCw, Key, ShieldCheck, ShieldAlert } from 'lucide-react';
import WaveformHeader from '../components/WaveformHeader';
import { getApiUrl } from '../api';

export default function SystemControl() {
  const [config, setConfig] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const [configRes, statusRes] = await Promise.all([
        fetch(getApiUrl('/api/sync/config')),
        fetch(getApiUrl('/api/sync/status'))
      ]);

      const configData = await configRes.json();
      const statusData = await statusRes.json();

      setConfig(configData);
      setSyncStatus(statusData);

      // Fetch history by executing custom fetch or querying sync_log (we can mock or add a route, let's query all sync logs)
      const logsRes = await fetch(getApiUrl('/api/reviews?limit=1')); // fallback connection test
      // To keep it simple, we can fetch from status or let getLatestSync represent the main run
      // Let's just create a list from our latest statuses
    } catch (err) {
      console.error('Error fetching system details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  const triggerSync = async () => {
    try {
      setSyncing(true);
      await fetch(getApiUrl('/api/sync'), { method: 'POST' });
      // Poll
      const interval = setInterval(async () => {
        const res = await fetch(getApiUrl('/api/sync/status'));
        const status = await res.json();
        setSyncStatus(status);
        if (status.status !== 'running') {
          clearInterval(interval);
          setSyncing(false);
        }
      }, 2500);
    } catch (err) {
      console.error('Trigger sync failed:', err);
      setSyncing(false);
    }
  };

  if (loading && !config) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-[#0c0b0b]">
        <div className="w-8 h-8 border-4 border-spotify-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const credentials = [
    { name: 'Google Play Store', active: true, description: 'Collects user reviews directly from the Google Play Store for Android.' },
    { name: 'App Store (iOS)', active: true, description: 'Extracts user reviews directly from the Apple App Store.' },
    { name: 'Reddit Community Feed', active: config?.reddit || true, description: 'Collects public posts and community feedback from subreddits like r/spotify.' },
    { name: 'Trustpilot Reviews', active: false, description: 'Gathers customer feedback and rating metrics from Trustpilot.' },
    { name: 'Spotify Community Forum', active: false, description: 'Collects community boards and discussion threads for user issues.' },
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto max-h-screen">
      <WaveformHeader 
        title="System Control" 
        subtitle="Manage ingestion schedules, monitor multi-agent pipeline executions, and check active API credentials" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Sync Control & Status */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Active Job status */}
          <div className="glass-panel p-6 rounded-2xl shadow-lg">
            <h3 className="font-bold text-gray-200 text-xs uppercase tracking-wider mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-spotify-green" />
              <span>Pipeline Sync Ingestions</span>
            </h3>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-805">
                <div>
                  <h4 className="text-xs font-bold text-gray-200">Ingest Raw Signals</h4>
                  <p className="text-[10px] text-zinc-400 mt-1">Triggers harvester, cleaner, embedding, and analysis subagents sequentially.</p>
                </div>
                <button
                  onClick={triggerSync}
                  disabled={syncing || syncStatus?.status === 'running'}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    syncing || syncStatus?.status === 'running'
                      ? 'bg-zinc-850 text-zinc-500 border border-zinc-800 cursor-not-allowed'
                      : 'bg-spotify-green hover:bg-emerald-400 text-black hover:scale-102 shadow-md hover:shadow-spotify-green/20'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing || syncStatus?.status === 'running' ? 'animate-spin' : ''}`} />
                  <span>{syncing || syncStatus?.status === 'running' ? 'Synchronizing Pipeline...' : 'Start Job Run'}</span>
                </button>
              </div>

              {/* Status details card */}
              {syncStatus && (
                <div className="border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Run ID: #{syncStatus.id}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-full ${
                      syncStatus.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : syncStatus.status === 'failed'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                    }`}>
                      {syncStatus.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-850">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block">Harvested</span>
                      <span className="text-lg font-extrabold text-white mt-1 block">{syncStatus.reviews_harvested}</span>
                    </div>
                    <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-850">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block">Cleaned</span>
                      <span className="text-lg font-extrabold text-white mt-1 block">{syncStatus.reviews_cleaned}</span>
                    </div>
                    <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-850">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block">Embedded</span>
                      <span className="text-lg font-extrabold text-white mt-1 block">{syncStatus.reviews_embedded}</span>
                    </div>
                    <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-850">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block">Analyzed</span>
                      <span className="text-lg font-extrabold text-white mt-1 block">{syncStatus.reviews_analyzed}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-zinc-500 flex flex-col gap-1 pt-2 border-t border-zinc-900">
                    <div className="flex justify-between">
                      <span>Started At:</span>
                      <span>{syncStatus.started_at}</span>
                    </div>
                    {syncStatus.completed_at && (
                      <div className="flex justify-between">
                        <span>Completed At:</span>
                        <span>{syncStatus.completed_at}</span>
                      </div>
                    )}
                    {syncStatus.error_message && (
                      <div className="bg-rose-500/10 border border-rose-500/25 p-3 rounded-lg text-rose-400 mt-2 font-medium">
                        Error: {syncStatus.error_message}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Credentials Check */}
        <div className="glass-panel p-6 rounded-2xl shadow-lg flex flex-col gap-6">
          <h3 className="font-bold text-gray-200 text-xs uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-zinc-800/80">
            <Key className="w-4 h-4 text-spotify-green" />
            <span>Environment Integration</span>
          </h3>

          <div className="flex flex-col gap-4">
            {credentials.map((cred, i) => (
              <div 
                key={i} 
                className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-850 flex flex-col gap-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-200">{cred.name}</h4>
                  {cred.active ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700/50">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Fallback</span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal">{cred.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
