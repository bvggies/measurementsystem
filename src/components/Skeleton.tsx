import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
}) => {
  const base = 'bg-gray-200 dark:bg-dark-border animate-pulse';
  const variants = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-xl',
  };

  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      className={`${base} ${variants[variant]} ${className}`}
      aria-hidden
    />
  );
};

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" variant="text" />
            <Skeleton className="h-8 w-16" variant="text" />
          </div>
          <Skeleton className="h-12 w-12 rounded-lg" variant="rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-dark-border">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-20" variant="text" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <Skeleton
                    className={colIndex === 0 ? 'h-4 w-24' : 'h-4 w-16'}
                    variant="text"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-dark-border">
          <Skeleton className="h-10 w-10 rounded-full" variant="circular" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" variant="text" />
            <Skeleton className="h-3 w-24" variant="text" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
