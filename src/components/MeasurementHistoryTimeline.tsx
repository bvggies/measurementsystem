import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';

interface HistoryEntry {
  history_id: string;
  measurement_id: string;
  changed_by: string | null;
  changed_by_name: string | null;
  changed_at: string;
  change_diff: { old?: Record<string, unknown>; new?: Record<string, unknown> };
  version: number;
}

interface MeasurementHistoryTimelineProps {
  measurementId: string;
}

const MeasurementHistoryTimeline: React.FC<MeasurementHistoryTimelineProps> = ({ measurementId }) => {
  const { theme } = useTheme();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!measurementId) {
      setLoading(false);
      return;
    }
    axios
      .get(`/api/measurements/history/${measurementId}`)
      .then((res) => setHistory(res.data?.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [measurementId]);

  if (loading) {
    return (
      <div className="py-4 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-gold border-t-transparent" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        No change history yet.
      </p>
    );
  }

  const diffKeys = (entry: HistoryEntry): string[] => {
    const diff = entry.change_diff;
    if (!diff || typeof diff !== 'object') return [];
    const oldObj = diff.old && typeof diff.old === 'object' ? diff.old : {};
    const newObj = diff.new && typeof diff.new === 'object' ? diff.new : {};
    const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    return Array.from(keys).filter((k) => !['created_at', 'updated_at'].includes(k));
  };

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-primary-gold/30" aria-hidden />
      <ul className="space-y-4">
        {history.map((entry, index) => {
          const keys = diffKeys(entry);
          const isExpanded = expanded === entry.history_id;
          return (
            <motion.li
              key={entry.history_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative pl-10"
            >
              <div
                className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                  isDark ? 'bg-dark-surface border-primary-gold' : 'bg-white border-primary-gold'
                }`}
                aria-hidden
              />
              <div
                className={`rounded-xl border p-4 ${
                  isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>
                      Version {entry.version} · {entry.changed_by_name || 'System'}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {format(new Date(entry.changed_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  {keys.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpanded(isExpanded ? null : entry.history_id)}
                      className={`text-xs font-medium ${
                        isDark ? 'text-primary-gold hover:text-primary-gold/80' : 'text-primary-navy hover:underline'
                      }`}
                    >
                      {isExpanded ? 'Hide' : 'Show'} changes
                    </button>
                  )}
                </div>
                {isExpanded && keys.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-border">
                    <ul className="space-y-1 text-xs">
                      {keys.slice(0, 12).map((key) => {
                        const diff = entry.change_diff as { old?: Record<string, unknown>; new?: Record<string, unknown> };
                        const oldVal = diff.old?.[key];
                        const newVal = diff.new?.[key];
                        if (oldVal === newVal) return null;
                        const label = key.replace(/_/g, ' ');
                        return (
                          <li key={key} className={`flex gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            <span className="font-medium capitalize">{label}:</span>
                            <span className="line-through opacity-70">{String(oldVal ?? '—')}</span>
                            <span>→</span>
                            <span className="font-medium">{String(newVal ?? '—')}</span>
                          </li>
                        );
                      })}
                      {keys.length > 12 && (
                        <li className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                          +{keys.length - 12} more fields
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
};

export default MeasurementHistoryTimeline;
