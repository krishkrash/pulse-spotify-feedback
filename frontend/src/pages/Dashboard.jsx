import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Database, AlertTriangle, Calendar, TrendingUp, RefreshCw } from 'lucide-react';
import WaveformHeader from '../components/WaveformHeader';
import ReviewCard from '../components/ReviewCard';
import { getApiUrl } from '../api';

const COLORS = ['#1DB954', '#ef4444', '#71717a', '#f59e0b'];
const SOURCE_COLORS = {
  app_store: '#a1a1aa',
  play_store: '#22c55e',
  reddit: '#f97316',
  twitter: '#38bdf8',
  forum: '#ec4899',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, reviewsRes] = await Promise.all([
        fetch(getApiUrl('/api/dashboard')),
        fetch(getApiUrl('/api/reviews?limit=3'))
      ]);

      const statsData = await statsRes.json();
      const reviewsData = await reviewsRes.json();

      setData(statsData);
      setReviews(reviewsData.reviews || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerSync = async () => {
    try {
      setSyncing(true);
      await fetch(getApiUrl('/api/sync'), { method: 'POST' });
      // Poll status until complete
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const res = await fetch(getApiUrl('/api/sync/status'));
        const status = await res.json();
        if (status.status !== 'running' || attempts > 20) {
          clearInterval(interval);
          setSyncing(false);
          fetchData();
        }
      }, 3000);
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncing(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-[#0c0b0b]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-spotify-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-400 font-medium">Analyzing signals...</p>
        </div>
      </div>
    );
  }

  // Pre-process charts datasets
  const pieData = data?.sourceCounts?.map(item => ({
    name: item.source.replace('_', ' ').toUpperCase(),
    value: item.count,
    color: SOURCE_COLORS[item.source] || '#71717a'
  })) || [];

  const barData = data?.topTopics?.map(item => ({
    topic: item.topic.replace(/_/g, ' '),
    mentions: item.count
  })) || [];

  const sentimentData = data?.sentimentCounts?.map((item, idx) => ({
    name: item.sentiment,
    value: item.count,
  })) || [];

  return (
    <div className="flex-1 p-8 overflow-y-auto max-h-screen">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <WaveformHeader 
          title="Pulse Dashboard" 
          subtitle="Real-time feedback intelligence pipeline overview and summary statistics" 
        />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total Indexed</span>
            <h3 className="text-3xl font-extrabold text-white mt-1">{data?.total || 0}</h3>
          </div>
          <div className="bg-spotify-green/10 p-3 rounded-xl border border-spotify-green/20">
            <Database className="w-6 h-6 text-spotify-green" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Negative Ratio</span>
            <h3 className="text-3xl font-extrabold text-rose-500 mt-1">{data?.negativePct || 0}%</h3>
          </div>
          <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Ingested 7D</span>
            <h3 className="text-3xl font-extrabold text-sky-400 mt-1">{data?.thisWeek || 0}</h3>
          </div>
          <div className="bg-sky-500/10 p-3 rounded-xl border border-sky-500/20">
            <Calendar className="w-6 h-6 text-sky-400" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Sync State</span>
            <button 
              onClick={triggerSync}
              disabled={syncing}
              className={`flex items-center gap-1.5 mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                syncing 
                  ? 'bg-zinc-800 text-zinc-500 border-zinc-700/50 cursor-not-allowed'
                  : 'bg-spotify-green/10 text-spotify-green border-spotify-green/20 hover:bg-spotify-green/25'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
          <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
            <TrendingUp className="w-6 h-6 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Sentiment Over Time */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 shadow-lg">
          <h3 className="text-base font-bold text-gray-200 mb-6 uppercase tracking-wider text-xs">Sentiment Dynamics (30 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.sentimentOverTime} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" tickLine={false} style={{ fontSize: '10px' }} />
                <YAxis stroke="#71717a" tickLine={false} style={{ fontSize: '10px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="positive" stroke="#1DB954" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="neutral" stroke="#71717a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mixed" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source Breakdown Pie */}
        <div className="glass-panel p-6 rounded-2xl shadow-lg flex flex-col justify-between">
          <h3 className="text-base font-bold text-gray-200 mb-4 uppercase tracking-wider text-xs">Ingestion Sources</h3>
          <div className="h-48 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-500 text-xs">No source data found</div>
            )}
          </div>
          {/* Pie Legends */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-zinc-400">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Topics Bar */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 shadow-lg">
          <h3 className="text-base font-bold text-gray-200 mb-6 uppercase tracking-wider text-xs">Primary Discussion Clusters</h3>
          <div className="h-72">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis type="number" stroke="#71717a" tickLine={false} style={{ fontSize: '10px' }} />
                  <YAxis type="category" dataKey="topic" stroke="#71717a" tickLine={false} style={{ fontSize: '9px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} />
                  <Bar dataKey="mentions" fill="#1DB954" radius={[0, 4, 4, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs">No topics mapped</div>
            )}
          </div>
        </div>

        {/* Live Feed Column */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 shadow-lg">
          <h3 className="text-base font-bold text-gray-200 uppercase tracking-wider text-xs">Recent Signals Ingested</h3>
          <div className="flex flex-col gap-4 overflow-y-auto max-h-72 pr-1">
            {reviews.length > 0 ? (
              reviews.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))
            ) : (
              <div className="text-center text-zinc-500 text-xs py-8">No feedback records index yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
