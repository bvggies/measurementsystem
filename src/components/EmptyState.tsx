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
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📋',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
    >
      <div className="text-6xl mb-4 opacity-80" aria-hidden>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
          {description}
        </p>
      )}
      {(actionLabel && (actionHref || onAction)) && (
        <>
          {actionHref ? (
            <Link
              to={actionHref}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-navy text-white font-medium rounded-xl hover:bg-primary-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg transition"
            >
              {actionLabel}
              <span aria-hidden>→</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-navy text-white font-medium rounded-xl hover:bg-primary-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg transition"
            >
              {actionLabel}
              <span aria-hidden>→</span>
            </button>
          )}
        </>
      )}
    </motion.div>
  );
};

export default EmptyState;
