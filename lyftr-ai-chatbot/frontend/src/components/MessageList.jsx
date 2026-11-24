import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import { Bot, Sparkles, ShieldAlert, Cpu } from 'lucide-react';

export default function MessageList({ messages, isLoading, error, onQuickPrompt }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, error]);

  const starterSuggestions = [
    { title: 'What is machine learning?', desc: 'Live inference test prompt' },
    { title: 'What is Python?', desc: 'Programming language overview' },
    { title: 'My name is Ananya.', desc: 'Multi-turn memory setup' },
    { title: 'What is artificial intelligence?', desc: 'Core concept explanation' },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-2">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
            <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight mb-2">
            AI Assistant with Failover & Caching
          </h2>
          <p className="text-sm text-slate-400 mb-8 max-w-md leading-relaxed">
            Ask questions with multi-turn chat memory, automatic API key failover, and instant response caching.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
            {starterSuggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onQuickPrompt && onQuickPrompt(item.title)}
                className="p-3.5 rounded-xl bg-[#131926]/70 border border-white/5 hover:border-indigo-500/40 hover:bg-[#172033] transition-all text-left group"
              >
                <div className="text-sm font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">
                  {item.title}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((msg, index) => <MessageItem key={msg.id || index} message={msg} />)
      )}

      {/* Loading state indicator */}
      {isLoading && (
        <div className="flex justify-start mb-6 animate-fadeIn">
          <div className="flex items-start max-w-[85%] gap-3.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md text-white animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-5 py-3.5 rounded-2xl rounded-tl-sm bg-[#131926]/90 border border-white/10 shadow-xl flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Generating response</span>
              <div className="flex gap-1 items-center ml-1">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 my-4">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-rose-200">Request Error</div>
            <div className="text-xs mt-1 text-rose-300/90">{error}</div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
