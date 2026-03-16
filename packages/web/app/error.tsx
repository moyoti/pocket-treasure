'use client';

import { useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      <div className="cartoon-card p-8 max-w-md w-full mx-4 text-center animate-bounce-in">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 border-4 border-red-300">
          <X size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">出错了</h2>
        <p className="text-gray-600 mb-6">{error.message || '发生了未知错误'}</p>
        <button
          onClick={() => reset()}
          className="cartoon-btn flex items-center justify-center gap-2 w-full"
        >
          <RefreshCw size={20} />
          重试
        </button>
      </div>
    </div>
  );
}