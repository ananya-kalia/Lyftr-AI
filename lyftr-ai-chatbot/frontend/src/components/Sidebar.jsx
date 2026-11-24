import React from 'react';
import { MessageSquare, Plus, Database, Sparkles, Key, Zap } from 'lucide-react';

export default function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  isOpen,
  onClose,
}) {
  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-30 w-72 bg-[#0c101a] border-r border-white/10 flex flex-col transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Top Header & New Chat button */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={onNewSession}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2">
          Recent Conversations
        </div>

        {sessions.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-slate-500">
            No previous conversations found.
          </div>
        ) : (
          sessions.map((s) => {
            const isActive = s.session_id === currentSessionId;
            return (
              <button
                key={s.session_id}
                onClick={() => onSelectSession(s.session_id)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-2.5 group cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-200'
                    : 'hover:bg-white/5 border border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">
                    {s.first_message || `Session ${s.session_id.slice(0, 8)}`}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2 font-mono">
                    <span>{s.message_count || 1} msgs</span>
                    <span>•</span>
                    <span>{s.session_id.slice(0, 6)}</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Feature Summary Footer */}
      <div className="p-4 border-t border-white/10 bg-black/20 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-[11px] uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5" />
          <span>Engine Features</span>
        </div>
        <ul className="text-[11px] space-y-1 text-slate-400">
          <li className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Multi-turn SQLite Memory
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> LiteLLM Response Caching
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Automatic Key Failover (429)
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Token & Latency Metrics
          </li>
        </ul>
      </div>
    </aside>
  );
}
