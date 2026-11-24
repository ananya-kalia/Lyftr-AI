import React from 'react';
import { Zap, Database, Cpu, Clock, ArrowDownLeft, ArrowUpRight, Key, RefreshCw } from 'lucide-react';

export default function MetadataCard({ metadata }) {
  if (!metadata) return null;

  const isCache = metadata.resolution_source === 'LLM_CACHE';
  const hasFallback = metadata.fallback_attempts > 0;

  return (
    <div className="mt-3 pt-3 border-t border-white/10 text-xs">
      {/* Top badges row */}
      <div className="flex flex-wrap items-center gap-2 mb-2.5">
        {/* Resolution Source Badge */}
        <div
          data-testid="meta-source"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono font-medium text-[11px] tracking-wide transition-all ${
            isCache
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
          }`}
        >
          {isCache ? (
            <>
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>LLM_CACHE</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>LIVE_INFERENCE</span>
            </>
          )}
        </div>

        {/* Model Badge */}
        <div
          data-testid="meta-model"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>{metadata.model || 'Gemini 2.0 Flash'}</span>
        </div>

        {/* Key ID Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
          <Key className="w-3 h-3 text-slate-400" />
          <span>{metadata.key_id || 'key_1'}</span>
        </div>

        {/* Fallback Attempts Pill (if triggered) */}
        {hasFallback && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>fallback_attempts: {metadata.fallback_attempts}</span>
          </div>
        )}
      </div>

      {/* Numerical Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-black/25 border border-white/5 font-mono text-slate-400">
        {/* Latency */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" /> Latency
          </span>
          <span data-testid="meta-latency" className="text-sm font-semibold text-slate-200 mt-0.5">
            {metadata.latency_ms} ms
          </span>
        </div>

        {/* Input Tokens */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <ArrowDownLeft className="w-3 h-3 text-slate-400" /> In Tokens
          </span>
          <span data-testid="meta-input-tokens" className="text-sm font-semibold text-slate-200 mt-0.5">
            {metadata.input_tokens}
          </span>
        </div>

        {/* Output Tokens */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-slate-400" /> Out Tokens
          </span>
          <span data-testid="meta-output-tokens" className="text-sm font-semibold text-slate-200 mt-0.5">
            {metadata.output_tokens}
          </span>
        </div>
      </div>
    </div>
  );
}
