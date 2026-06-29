import React, { useState } from 'react';

export default function ModernTerminalDashboard() {
  const [copied, setCopied] = useState(false);
  const command = "claude mcp add cortex -- npx -y cortex-kb";

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl rounded-xl bg-black/60 backdrop-blur-xl border border-zinc-800 overflow-hidden shadow-2xl animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-white/5">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[10px_0_0_#f59e0b,20px_0_0_#10b981]"></div>
        </div>
        <div className="text-xs font-mono text-zinc-500 absolute left-1/2 -translate-x-1/2">terminal</div>
        <button 
          onClick={handleCopy}
          className="text-xs font-medium bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 hover:text-white px-3 py-1 rounded-md transition-colors border border-zinc-700/50 cursor-pointer"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="p-8 font-mono text-[0.95rem] leading-relaxed text-left">
        <div className="flex gap-3 mb-2">
          <span className="text-zinc-500">$</span>
          <span className="text-white">{command}</span>
        </div>
        <div className="text-zinc-400">MCP Server 'cortex' installed.</div>
        <div className="text-zinc-400">Initializing SQLite Vector Database... [OK]</div>
        <div className="text-zinc-400">Ready for Claude queries.</div>
      </div>
    </div>
  );
}
