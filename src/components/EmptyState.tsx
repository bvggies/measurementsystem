import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  /** Wrap in a card-style container with border and padding */
  card?: boolean;
  /** Smaller padding and icon for inline use */
  size?: 'default' | 'compact';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📋',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = '',
  card = true,
  size = 'default',
}) => {
  const content = (
    <>
      <div
        className={`mb-4 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-dark-border/50 p-4 w-fit mx-auto ${size === 'compact' ? 'text-4xl' : 'text-6xl'}`}
        aria-hidden
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6 mx-auto">
          {description}
        </p>
      )}
      {(actionLabel && (actionHref || onAction)) && (
        <>
          {actionHref ? (
            <Link
              to={actionHref}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-navy text-white font-medium rounded-xl hover:bg-primary-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg transition active:scale-[0.98]"
            >
              {actionLabel}
              <span aria-hidden>→</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-navy text-white font-medium rounded-xl hover:bg-primary-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg transition active:scale-[0.98]"
            >
              {actionLabel}
              <span aria-hidden>→</span>
            </button>
          )}
        </>
      )}
    </>
  );

  const padding = size === 'compact' ? 'py-8 px-4' : 'py-12 px-6';
  const wrapperClass = card
    ? `rounded-2xl border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-surface/50 ${padding}`
    : padding;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col items-center justify-center text-center ${wrapperClass} ${className}`}
    >
      {content}
    </motion.div>
  );
};

export default EmptyState;
