import React from 'react';
import { Bot, Sliders, RefreshCw, Activity, Sparkles, Layers } from 'lucide-react';

export default function ChatHeader({
  sessionId,
  health,
  onOpenSimulation,
  simulationHeader,
  onResetSession,
}) {
  const isHealthy = health?.status === 'healthy';
  const hasActiveSim = simulationHeader && simulationHeader.trim() !== '';

  return (
    <header className="h-16 px-4 md:px-6 border-b border-white/10 bg-[#0a0d14]/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
          <div className="w-full h-full bg-[#0d121f] rounded-[10px] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-100 tracking-tight">
              Lyftr AI
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              v1.0
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <span>Session:</span>
            <span className="text-slate-300 font-semibold">{sessionId.slice(0, 10)}...</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend & Key Pool Health Status Pill */}
        <div
          title={health ? `Database: ${health.database}, Cache: ${health.cache}, Keys: ${health.key_pool?.total_keys}` : 'Checking health...'}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#131926] border border-white/5 text-xs text-slate-300"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-[11px] font-mono">
            {isHealthy ? 'Backend Ready' : 'Connecting...'}
          </span>
          {health?.key_pool && (
            <span className="text-[10px] text-slate-500 font-mono">
              ({health.key_pool.total_keys} keys)
            </span>
          )}
        </div>

        {/* Simulation / Failover Testing Button */}
        <button
          onClick={onOpenSimulation}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all border ${
            hasActiveSim
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'bg-[#131926] border-white/10 hover:border-indigo-500/30 text-slate-300 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Test Failover</span>
          {hasActiveSim && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        {/* New Session Button */}
        <button
          onClick={onResetSession}
          title="Start new conversation"
          className="p-2 rounded-xl bg-[#131926] border border-white/10 hover:border-indigo-500/30 text-slate-400 hover:text-slate-100 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
