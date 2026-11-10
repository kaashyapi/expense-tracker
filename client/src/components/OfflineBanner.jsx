import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflineBanner({ onRetry, isChecking }) {
  return (
    <div className="w-full bg-[#181111] border-b border-[#3b1818] px-4 py-2.5 text-xs text-[#fca5a5] flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <WifiOff className="w-4 h-4 text-[#ef4444] shrink-0" />
        <span>
          <strong>You are offline:</strong> You won't be able to save or modify any expenses until connection is restored.
        </span>
      </div>
      <button
        onClick={onRetry}
        disabled={isChecking}
        className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#2c1414] hover:bg-[#3b1818] text-white transition-colors shrink-0 ml-2"
      >
        <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
        <span>Retry</span>
      </button>
    </div>
  );
}

