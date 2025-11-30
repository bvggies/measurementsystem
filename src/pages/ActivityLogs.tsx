import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    resource_type: '',
    user_id: '',
    fromDate: '',
    toDate: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(filters.action && { action: filters.action }),
        ...(filters.resource_type && { resource_type: filters.resource_type }),
        ...(filters.user_id && { user_id: filters.user_id }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
      });

      const response = await axios.get(`/api/activity-logs?${params}`);
      setLogs(response.data.data);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'bg-emerald bg-opacity-10 text-emerald';
      case 'update':
        return 'bg-primary-gold bg-opacity-10 text-primary-gold';
      case 'delete':
        return 'bg-crimson bg-opacity-10 text-crimson';
      case 'import':
        return 'bg-primary-navy bg-opacity-10 text-primary-navy';
      default:
        return 'bg-gray-100 text-steel';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold text-primary-navy">Activity Logs</h1>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        data-aos="fade-up"
        className="bg-white rounded-xl shadow-md p-6"
      >
        <h2 className="text-lg font-semibold text-primary-navy mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-gold"
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="import">Import</option>
            <option value="export">Export</option>
          </select>

          <select
            value={filters.resource_type}
            onChange={(e) => setFilters({ ...filters, resource_type: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-gold"
          >
            <option value="">All Resources</option>
            <option value="measurement">Measurement</option>
            <option value="customer">Customer</option>
            <option value="order">Order</option>
            <option value="import">Import</option>
          </select>

          <input
            type="text"
            value={filters.user_id}
            onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
            placeholder="User ID"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-gold"
          />

          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
            placeholder="From Date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-gold"
          />

          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
            placeholder="To Date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-gold"
          />
        </div>
      </motion.div>

      {/* Logs Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        data-aos="fade-up"
        className="bg-white rounded-xl shadow-md overflow-hidden"
      >
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-navy mx-auto"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-steel">No activity logs found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary-navy text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Date/Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Resource</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log, index) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-steel">
                        {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-steel">
                        {log.user_name || log.user_email || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-steel">
                        {log.resource_type}
                      </td>
                      <td className="px-6 py-4 text-sm text-steel max-w-xs truncate">
                        {JSON.stringify(log.details)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-steel">
                        {log.ip_address || 'N/A'}
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

export default ActivityLogs;

