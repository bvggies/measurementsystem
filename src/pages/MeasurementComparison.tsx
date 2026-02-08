import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';

interface ComparisonRow {
  id: string;
  entry_id: string;
  customer_name: string;
  units: string;
  fit_preference?: string;
  across_back?: number | null;
  chest?: number | null;
  sleeve_length?: number | null;
  around_arm?: number | null;
  neck?: number | null;
  top_length?: number | null;
  wrist?: number | null;
  trouser_waist?: number | null;
  trouser_thigh?: number | null;
  trouser_knee?: number | null;
  trouser_length?: number | null;
  trouser_bars?: number | null;
  created_at?: string;
  version?: number;
}

const FIELDS = [
  { key: 'entry_id', label: 'Entry ID' },
  { key: 'customer_name', label: 'Customer' },
  { key: 'units', label: 'Units' },
  { key: 'fit_preference', label: 'Fit' },
  { key: 'across_back', label: 'Across Back' },
  { key: 'chest', label: 'Chest' },
  { key: 'sleeve_length', label: 'Sleeve Length' },
  { key: 'around_arm', label: 'Around Arm' },
  { key: 'neck', label: 'Neck' },
  { key: 'top_length', label: 'Top Length' },
  { key: 'wrist', label: 'Wrist' },
  { key: 'trouser_waist', label: 'Trouser Waist' },
  { key: 'trouser_thigh', label: 'Trouser Thigh' },
  { key: 'trouser_knee', label: 'Trouser Knee' },
  { key: 'trouser_length', label: 'Trouser Length' },
  { key: 'trouser_bars', label: 'Trouser Bars' },
  { key: 'created_at', label: 'Created' },
  { key: 'version', label: 'Version' },
];

const MeasurementComparison: React.FC = () => {
  const [searchParams] = useSearchParams();
  const idsParam = searchParams.get('ids') || '';
  const { theme } = useTheme();
  const [comparison, setComparison] = useState<ComparisonRow[]>([]);
  const [loading, setLoading] = useState(!!idsParam);
  const [error, setError] = useState('');
  const [idInput, setIdInput] = useState(idsParam);

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200';

  useEffect(() => {
    if (!idsParam) {
      setLoading(false);
      return;
    }
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.length < 2) {
      setLoading(false);
      setError('Provide at least 2 measurement IDs (e.g. ?ids=uuid1,uuid2)');
      return;
    }
    setError('');
    setLoading(true);
    axios
      .get(`/api/measurements/compare?ids=${ids.join(',')}`)
      .then((res) => {
        setComparison(res.data?.comparison || []);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to load comparison');
        setComparison([]);
      })
      .finally(() => setLoading(false));
  }, [idsParam]);

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    const ids = idInput.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    if (ids.length < 2) {
      setError('Enter at least 2 measurement IDs separated by comma');
      return;
    }
    window.location.search = `?ids=${ids.join(',')}`;
  };

  const formatVal = (val: unknown, key: string): string => {
    if (val == null || val === '') return '—';
    if (key === 'created_at' && typeof val === 'string') {
      try {
        return new Date(val).toLocaleDateString();
      } catch {
        return String(val);
      }
    }
    return String(val);
  };

  return (
    <div className="space-y-6 pb-32">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <h1 className={`text-3xl font-bold ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>
          Measurement comparison
        </h1>
        <Link
          to="/measurements"
          className="text-primary-navy dark:text-primary-gold font-medium hover:underline"
        >
          ← Back to measurements
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`${cardBg} rounded-xl border p-6`}
      >
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>
          Compare two or more measurements
        </h2>
        <form onSubmit={handleCompare} className="flex flex-wrap gap-2">
          <input
            type="text"
            value={idInput}
            onChange={(e) => setIdInput(e.target.value)}
            placeholder="Measurement IDs (comma-separated)"
            className={`flex-1 min-w-[200px] px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-gold ${
              isDark ? 'border-dark-border bg-dark-bg text-dark-text' : 'border-gray-300'
            }`}
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-primary-navy text-white rounded-xl hover:bg-primary-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold"
          >
            Compare
          </button>
        </form>
        <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Open a measurement, copy its ID from the URL, then add another to compare side-by-side.
        </p>
      </motion.div>

      {error && (
        <div className="p-4 bg-crimson/10 border border-crimson/30 rounded-xl text-crimson">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-gold border-t-transparent" />
        </div>
      )}

      {!loading && comparison.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`${cardBg} rounded-xl border overflow-hidden`}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className={isDark ? 'bg-dark-border/50' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Field
                  </th>
                  {comparison.map((row, i) => (
                    <th key={row.id} className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Link to={`/measurements/view/${row.id}`} className="text-primary-navy dark:text-primary-gold hover:underline">
                        {row.entry_id || `#${i + 1}`}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-dark-border' : 'divide-gray-200'}`}>
                {FIELDS.map(({ key, label }) => {
                  const values = comparison.map((row) => (row as any)[key]);
                  const allSame = values.every((v) => v === values[0]);
                  return (
                    <tr key={key} className={isDark ? 'hover:bg-dark-border/30' : 'hover:bg-gray-50'}>
                      <td className={`px-4 py-3 text-sm font-medium ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>
                        {label}
                      </td>
                      {comparison.map((row, i) => (
                        <td
                          key={row.id}
                          className={`px-4 py-3 text-sm ${
                            allSame ? (isDark ? 'text-gray-400' : 'text-gray-600') : 'bg-primary-gold/10 font-medium'
                          }`}
                        >
                          {formatVal((row as any)[key], key)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MeasurementComparison;
