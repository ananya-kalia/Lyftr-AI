import React from 'react';
import MetadataCard from './MetadataCard';
import { Bot, User, Sparkles } from 'lucide-react';

export default function MessageItem({ message }) {
  const isAssistant = message.role === 'assistant';

  if (!isAssistant) {
    // User message bubble
    return (
      <div className="flex justify-end mb-6 animate-fadeIn">
        <div className="flex items-start max-w-[80%] gap-3 flex-row-reverse">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shrink-0 shadow-md text-white">
            <User className="w-4 h-4" />
          </div>
          <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-indigo-600 text-white shadow-lg text-[15px] leading-relaxed break-words">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // Assistant message block with Perplexity-style card and required data-testid
  return (
    <div className="flex justify-start mb-6 animate-fadeIn w-full">
      <div className="flex items-start max-w-[90%] md:max-w-[85%] gap-3.5 w-full">
        {/* Assistant Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md text-white ring-2 ring-indigo-500/20">
          <Bot className="w-4 h-4" />
        </div>

        {/* Message Container with data-testid="assistant-message" */}
        <div
          data-testid="assistant-message"
          className="flex-1 px-5 py-4 rounded-2xl rounded-tl-sm bg-[#131926]/90 border border-white/10 shadow-xl backdrop-blur-md"
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold tracking-wide text-indigo-400 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Assistant</span>
          </div>

          {/* Assistant content */}
          <div className="text-[15px] leading-relaxed text-slate-200 whitespace-pre-wrap font-normal selection:bg-indigo-500/30">
            {message.content}
          </div>

          {/* Underneath response: Resolution source, Model, Latency, Tokens metadata */}
          <MetadataCard metadata={message.metadata} />
        </div>
      </div>
    </div>
  );
}
