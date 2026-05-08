'use client';

import { motion } from 'framer-motion';

type LoadingSize = 'sm' | 'md' | 'lg';

interface LoadingProps {
  size?: LoadingSize;
  text?: string;
  fullScreen?: boolean;
}

const sizeValues: Record<LoadingSize, { spinner: number; container: string }> = {
  sm: { spinner: 24, container: 'gap-2' },
  md: { spinner: 40, container: 'gap-3' },
  lg: { spinner: 56, container: 'gap-4' },
};

function Loading({ size = 'md', text, fullScreen = false }: LoadingProps) {
  const { spinner, container } = sizeValues[size];

  const content = (
    <div className={`flex flex-col items-center justify-center ${container}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <svg
          width={spinner}
          height={spinner}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="20"
            cy="20"
            r="18"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="text-border"
          />
          <path
            d="M38 20C38 9.50659 29.4934 1 19 1"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="text-primary"
          />
        </svg>
      </motion.div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted font-medium"
          style={{ fontSize: size === 'sm' ? 12 : size === 'md' ? 14 : 16 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

function LoadingDots({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`bg-border rounded-xl ${className}`}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
}

export { Loading, LoadingDots, LoadingSkeleton };
export type { LoadingProps, LoadingSize };