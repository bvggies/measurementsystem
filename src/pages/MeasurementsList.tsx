import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { SkeletonTable } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

interface Measurement {
  id: string;
  entry_id: string;
  customer_name: string;
  customer_phone: string;
  units: string;
  created_at: string;
  created_by_name: string;
  created_by?: string;
}

const MeasurementsList: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    branch: '',
    unit: '',
    tailor: '',
  });

  const fetchMeasurements = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(filters.branch && { branch: filters.branch }),
        ...(filters.unit && { unit: filters.unit }),
        ...(filters.tailor && { tailor: filters.tailor }),
      });

      const response = await axios.get(`/api/measurements?${params}`);
      setMeasurements(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch measurements:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => {
    fetchMeasurements();
  }, [fetchMeasurements]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMeasurements();
  };

  const cardBg = isDark ? 'bg-dark-surface border border-dark-border' : 'bg-white shadow-md';

  return (
    <div className="space-y-6 pb-32">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className={`text-3xl font-bold ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>Measurements</h1>
        <div className="flex gap-2">
          <Link
            to="/measurements/compare"
            className="px-4 py-2.5 border border-primary-navy dark:border-primary-gold text-primary-navy dark:text-primary-gold rounded-xl hover:bg-primary-navy/10 dark:hover:bg-primary-gold/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold transition"
          >
            Compare
          </Link>
          <Link
            to="/measurements/new"
            className="px-4 py-2.5 bg-primary-navy text-white rounded-xl hover:bg-primary-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg transition"
          >
            + New Measurement
          </Link>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        data-aos="fade-up"
        className={`${cardBg} rounded-xl p-6`}
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or entry ID..."
              className={`flex-1 px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-gold focus:border-transparent focus-visible:outline-none ${
                isDark ? 'border-dark-border bg-dark-bg text-dark-text' : 'border-gray-300'
              }`}
            />
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary-navy text-white rounded-xl hover:bg-primary-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 transition"
            >
              Search
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.unit}
              onChange={(e) => setFilters({ ...filters, unit: e.target.value })}
              className={`px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-gold ${
                isDark ? 'border-dark-border bg-dark-bg text-dark-text' : 'border-gray-300'
              }`}
            >
              <option value="">All Units</option>
              <option value="cm">Centimeters</option>
              <option value="in">Inches</option>
            </select>

            <input
              type="text"
              value={filters.branch}
              onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
              placeholder="Branch"
              className={`px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-gold ${
                isDark ? 'border-dark-border bg-dark-bg text-dark-text' : 'border-gray-300'
              }`}
            />
            <input
              type="text"
              value={filters.tailor}
              onChange={(e) => setFilters({ ...filters, tailor: e.target.value })}
              placeholder="Tailor ID"
              className={`px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-gold ${
                isDark ? 'border-dark-border bg-dark-bg text-dark-text' : 'border-gray-300'
              }`}
            />
          </div>
        </form>
      </motion.div>

      {/* Measurements Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        data-aos="fade-up"
        className={`${cardBg} rounded-xl overflow-hidden`}
      >
        {loading ? (
          <SkeletonTable rows={8} cols={7} />
        ) : measurements.length === 0 ? (
          <EmptyState
            icon="📏"
            title="No measurements yet"
            description="Create your first measurement or import from CSV/Excel."
            actionLabel="New Measurement"
            actionHref="/measurements/new"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDark ? 'bg-dark-border/50' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Entry ID</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Customer</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Phone</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Units</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Created By</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Date</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-dark-border' : 'divide-gray-200'}`}>
                  {measurements.map((measurement, index) => (
                    <motion.tr
                      key={measurement.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      data-aos="fade-right"
                      className={isDark ? 'hover:bg-dark-border/30' : 'hover:bg-gray-50'}
                      onClick={(e) => {
                        // Don't navigate if clicking on action buttons
                        if ((e.target as HTMLElement).closest('a, button')) {
                          return;
                        }
                        navigate(`/measurements/view/${measurement.id}`);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>
                        {measurement.entry_id}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>
                        {measurement.customer_name || 'N/A'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {measurement.customer_phone || 'N/A'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {measurement.units}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {measurement.created_by_name || 'N/A'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {format(new Date(measurement.created_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              navigate(`/measurements/view/${measurement.id}`);
                            }}
                            className="px-2 py-1 text-xs bg-primary-navy text-white rounded hover:bg-opacity-90 transition cursor-pointer z-10 relative"
                            title="View"
                          >
                            👁️ View
                          </button>
                          {(user?.role === 'admin' || user?.role === 'manager' || (user?.role === 'tailor' && measurement.created_by === user?.id)) && (
                            <Link
                              to={`/measurements/edit/${measurement.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="px-2 py-1 text-xs bg-primary-gold text-white rounded hover:bg-opacity-90 transition cursor-pointer z-10 relative"
                              title="Edit"
                            >
                              ✏️ Edit
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              navigate(`/measurements/view/${measurement.id}`);
                              // Wait for page to load before printing
                              setTimeout(() => {
                                window.print();
                              }, 1500);
                            }}
                            className="px-2 py-1 text-xs bg-steel text-white rounded hover:bg-opacity-90 transition cursor-pointer z-10 relative"
                            title="Print"
                          >
                            🖨️ Print
                          </button>
                          {user?.role === 'admin' && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (window.confirm(`Are you sure you want to delete measurement ${measurement.entry_id}? This action cannot be undone.`)) {
                                  try {
                                    const response = await axios.delete(`/api/measurements/${measurement.id}`);
                                    if (response.data?.message) {
                                      await fetchMeasurements();
                                      toast('Measurement deleted successfully', 'success');
                                    } else {
                                      throw new Error('Unexpected response from server');
                                    }
                                  } catch (err: any) {
                                    let errorMsg = 'Failed to delete measurement';
                                    if (err.response?.data) {
                                      const data = err.response.data;
                                      if (typeof data.error === 'string') errorMsg = data.error;
                                      else if (typeof data.message === 'string') errorMsg = data.message;
                                    } else if (err.message && typeof err.message === 'string') {
                                      errorMsg = err.message;
                                    }
                                    toast(errorMsg, 'error');
                                    console.error('Delete error:', err);
                                  }
                                }
                              }}
                              className="px-2 py-1 text-xs bg-crimson text-white rounded hover:bg-opacity-90 transition cursor-pointer z-10 relative"
                              title="Delete"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-steel-light dark:border-dark-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const newPage = Math.max(1, page - 1);
                    if (newPage !== page) {
                      setPage(newPage);
                    }
                  }}
                  disabled={page === 1}
                  className="px-4 py-2 border border-steel-light dark:border-dark-border text-steel dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-soft-white dark:hover:bg-dark-surface transition-colors"
                >
                  ← Previous
                </button>
                <span className="text-sm text-steel dark:text-gray-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const newPage = Math.min(totalPages, page + 1);
                    if (newPage !== page) {
                      setPage(newPage);
                    }
                  }}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-steel-light dark:border-dark-border text-steel dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-soft-white dark:hover:bg-dark-surface transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default MeasurementsList;

