import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, RefreshCw, Key, HelpCircle, Zap } from 'lucide-react';

export default function SimulationDrawer({
  isOpen,
  onClose,
  simulationHeader,
  onSetSimulationHeader,
  health,
}) {
  const [customHeader, setCustomHeader] = useState(simulationHeader || '');

  if (!isOpen) return null;

  const presets = [
    {
      title: 'Normal Request',
      header: '',
      desc: 'No failure simulation. Uses primary key_1 normally.',
      color: 'emerald',
    },
    {
      title: 'Simulate Key 1 Rate Limit (429)',
      header: 'key_1=429',
      desc: 'Forces key_1 to fail with HTTP 429. Backend automatically fails over to key_2 (fallback_attempts: 1).',
      color: 'amber',
    },
    {
      title: 'Simulate All Keys Unavailable (503)',
      header: 'key_1=429,key_2=500',
      desc: 'Simulates failure across all keys. Expects clean HTTP 503 "all providers unavailable" without crash.',
      color: 'rose',
    },
  ];

  const handleApplyPreset = (hdr) => {
    onSetSimulationHeader(hdr);
    setCustomHeader(hdr);
  };

  const handleApplyCustom = () => {
    onSetSimulationHeader(customHeader);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#0f1422] border-l border-white/10 h-full flex flex-col p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">
              Failover & Simulation Panel
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6">
          {/* Key Pool Info */}
          <div className="p-4 rounded-xl bg-[#141b2d] border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Key className="w-4 h-4 text-indigo-400" />
              <span>Configured Key Pool</span>
            </div>
            <div className="text-xs text-slate-400">
              Backend is configured with{' '}
              <span className="font-semibold text-slate-200">
                {health?.key_pool?.total_keys || 2} API keys
              </span>
              :
            </div>
            <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
              {(health?.key_pool?.keys_configured || ['key_1', 'key_2']).map((k) => (
                <span
                  key={k}
                  className="px-2.5 py-1 rounded bg-black/40 border border-white/10 text-indigo-300"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Testing Presets (X-Simulate-Failure)
            </div>

            {presets.map((p, idx) => {
              const isSelected = simulationHeader === p.header;
              return (
                <div
                  key={idx}
                  onClick={() => handleApplyPreset(p.header)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500/50 shadow-md'
                      : 'bg-[#131926]/70 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-200">
                      {p.title}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                    {p.desc}
                  </p>
                  {p.header && (
                    <div className="font-mono text-[11px] text-amber-300/90 bg-black/40 px-2 py-1 rounded border border-white/5 inline-block">
                      Header: X-Simulate-Failure: {p.header}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Custom Header Input */}
          <div className="p-4 rounded-xl bg-[#131926]/70 border border-white/5 space-y-3">
            <div className="text-xs font-semibold text-slate-300">
              Custom Failure Header
            </div>
            <input
              type="text"
              value={customHeader}
              onChange={(e) => setCustomHeader(e.target.value)}
              placeholder="e.g. key_1=429 or key_1=500,key_2=503"
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleApplyCustom}
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
            >
              Apply Custom Header
            </button>
          </div>

          {/* Caching Test Hint */}
          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
              <Zap className="w-4 h-4" />
              <span>How to test Response Caching:</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              Send a prompt like <code className="bg-black/30 px-1.5 py-0.5 rounded text-cyan-300">"What is machine learning?"</code>.
              The first call returns <span className="font-mono text-emerald-400">LIVE_INFERENCE</span>.
              Send the exact same prompt again — it will instantly return from <span className="font-mono text-cyan-300">LLM_CACHE</span> with ~2-15ms latency!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-all"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
