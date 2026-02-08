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
    <div className="space-y-4 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>Measurements</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/measurements/compare"
            className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center px-4 py-2.5 border border-primary-navy dark:border-primary-gold text-primary-navy dark:text-primary-gold rounded-xl hover:bg-primary-navy/10 dark:hover:bg-primary-gold/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold transition text-sm font-medium"
          >
            Compare
          </Link>
          <Link
            to="/measurements/new"
            className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center px-4 py-2.5 bg-primary-navy text-white rounded-xl hover:bg-primary-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg transition text-sm font-medium"
          >
            + New
          </Link>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`${cardBg} rounded-xl p-4 sm:p-6`}
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or entry ID..."
              className={`flex-1 min-w-0 px-4 py-3 sm:py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-gold focus:border-transparent focus-visible:outline-none text-base ${
                isDark ? 'border-dark-border bg-dark-bg text-dark-text' : 'border-gray-300'
              }`}
            />
            <button
              type="submit"
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-6 py-3 sm:py-2.5 bg-primary-navy text-white rounded-xl hover:bg-primary-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 transition font-medium"
            >
              Search
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
            {/* Mobile: card list */}
            <div className="md:hidden space-y-3">
              {measurements.map((measurement, index) => (
                <motion.div
                  key={measurement.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => navigate(`/measurements/view/${measurement.id}`)}
                  className={`${isDark ? 'bg-dark-bg border-dark-border hover:bg-dark-border/30' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} border rounded-xl p-4 active:scale-[0.99] transition cursor-pointer`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-sm truncate ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>
                        {measurement.customer_name || measurement.entry_id}
                      </p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {measurement.entry_id} · {measurement.units}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {format(new Date(measurement.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate(`/measurements/view/${measurement.id}`); }}
                        className="touch-ignore px-3 py-1.5 text-xs font-medium bg-primary-navy text-white rounded-lg"
                      >
                        View
                      </button>
                      {(user?.role === 'admin' || user?.role === 'manager' || (user?.role === 'tailor' && measurement.created_by === user?.id)) && (
                        <Link
                          to={`/measurements/edit/${measurement.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="touch-ignore px-3 py-1.5 text-xs font-medium bg-primary-gold text-primary-navy rounded-lg text-center"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className={isDark ? 'bg-dark-border/50' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Entry ID</th>
                    <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Customer</th>
                    <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Phone</th>
                    <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Units</th>
                    <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Created By</th>
                    <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Date</th>
                    <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-dark-border' : 'divide-gray-200'}`}>
                  {measurements.map((measurement, index) => (
                    <motion.tr
                      key={measurement.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={isDark ? 'hover:bg-dark-border/30' : 'hover:bg-gray-50'}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('a, button')) return;
                        navigate(`/measurements/view/${measurement.id}`);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className={`px-4 lg:px-6 py-3 whitespace-nowrap text-sm font-medium ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>
                        {measurement.entry_id}
                      </td>
                      <td className={`px-4 lg:px-6 py-3 whitespace-nowrap text-sm ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>
                        {measurement.customer_name || 'N/A'}
                      </td>
                      <td className={`px-4 lg:px-6 py-3 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {measurement.customer_phone || 'N/A'}
                      </td>
                      <td className={`px-4 lg:px-6 py-3 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {measurement.units}
                      </td>
                      <td className={`px-4 lg:px-6 py-3 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {measurement.created_by_name || 'N/A'}
                      </td>
                      <td className={`px-4 lg:px-6 py-3 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {format(new Date(measurement.created_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 lg:px-6 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); navigate(`/measurements/view/${measurement.id}`); }}
                            className="touch-ignore px-2 py-1 text-xs bg-primary-navy text-white rounded hover:bg-opacity-90 transition z-10 relative"
                            title="View"
                          >
                            👁️ View
                          </button>
                          {(user?.role === 'admin' || user?.role === 'manager' || (user?.role === 'tailor' && measurement.created_by === user?.id)) && (
                            <Link
                              to={`/measurements/edit/${measurement.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="touch-ignore px-2 py-1 text-xs bg-primary-gold text-white rounded hover:bg-opacity-90 transition z-10 relative"
                              title="Edit"
                            >
                              ✏️ Edit
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/measurements/view/${measurement.id}`);
                              setTimeout(() => window.print(), 1500);
                            }}
                            className="touch-ignore px-2 py-1 text-xs bg-steel text-white rounded hover:bg-opacity-90 transition z-10 relative"
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
                              className="touch-ignore px-2 py-1 text-xs bg-crimson text-white rounded hover:bg-opacity-90 transition z-10 relative"
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
              <div className="px-4 sm:px-6 py-4 border-t border-steel-light dark:border-dark-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (page > 1) setPage(page - 1);
                  }}
                  disabled={page === 1}
                  className="min-h-[44px] sm:min-h-0 order-2 sm:order-1 px-4 py-3 sm:py-2 border border-steel-light dark:border-dark-border text-steel dark:text-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-soft-white dark:hover:bg-dark-surface transition-colors font-medium"
                >
                  ← Previous
                </button>
                <span className="text-sm text-steel dark:text-gray-300 order-1 sm:order-2 text-center">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (page < totalPages) setPage(page + 1);
                  }}
                  disabled={page === totalPages}
                  className="min-h-[44px] sm:min-h-0 order-3 px-4 py-3 sm:py-2 border border-steel-light dark:border-dark-border text-steel dark:text-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-soft-white dark:hover:bg-dark-surface transition-colors font-medium"
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

