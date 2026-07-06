import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Compass, Users, FileText, Settings, Radio } from 'lucide-react';

export default function Sidebar() {
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/ask', label: 'Ask Pulse', icon: <MessageSquare className="w-5 h-5" /> },
    { path: '/topics', label: 'Topic Explorer', icon: <Compass className="w-5 h-5" /> },
    { path: '/segments', label: 'User Segments', icon: <Users className="w-5 h-5" /> },
    { path: '/digest', label: 'Weekly Digest', icon: <FileText className="w-5 h-5" /> },
    { path: '/settings', label: 'System Control', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-[#0c0b0b] border-r border-zinc-800/80 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand logo */}
      <div className="p-6 border-b border-zinc-800/60 flex items-center gap-3">
        <div className="bg-spotify-green p-2 rounded-xl flex items-center justify-center text-black">
          <Radio className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white font-serif">P U L S E</h2>
          <p className="text-[10px] text-spotify-green font-semibold tracking-widest uppercase">Feedback Intelligence</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-4 flex flex-col gap-1.5">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-spotify-green/10 text-spotify-green border-l-4 border-l-spotify-green pl-3'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / Info */}
      <div className="p-6 border-t border-zinc-800/60 text-[10px] text-zinc-500 flex flex-col gap-1">
        <p>© 2026 Pulse Intelligence</p>
        <p>Connected to Spotify Feedback</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-2 h-2 rounded-full bg-spotify-green animate-ping" />
          <span className="text-zinc-400 font-medium">System Online</span>
        </div>
      </div>
    </aside>
  );
}
