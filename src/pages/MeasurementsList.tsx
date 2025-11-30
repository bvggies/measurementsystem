import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

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

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold text-gray-900">Measurements</h1>
        <Link
          to="/measurements/new"
          className="px-4 py-2 bg-primary-navy text-white rounded-lg hover:bg-opacity-90 transition"
        >
          + New Measurement
        </Link>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        data-aos="fade-up"
        className="bg-white rounded-xl shadow-md p-6"
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or entry ID..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-primary-navy text-white rounded-lg hover:bg-opacity-90"
            >
              Search
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.unit}
              onChange={(e) => setFilters({ ...filters, unit: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />

            <input
              type="text"
              value={filters.tailor}
              onChange={(e) => setFilters({ ...filters, tailor: e.target.value })}
              placeholder="Tailor ID"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </form>
      </motion.div>

      {/* Measurements Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        data-aos="fade-up"
        className="bg-white rounded-xl shadow-md overflow-hidden"
      >
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : measurements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No measurements found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Units</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {measurements.map((measurement, index) => (
                    <motion.tr
                      key={measurement.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      data-aos="fade-right"
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {measurement.entry_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {measurement.customer_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {measurement.customer_phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {measurement.units}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {measurement.created_by_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(measurement.created_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/measurements/view/${measurement.id}`}
                            className="px-2 py-1 text-xs bg-primary-navy text-white rounded hover:bg-opacity-90 transition"
                            title="View"
                          >
                            👁️ View
                          </Link>
                          {(user?.role === 'admin' || user?.role === 'manager' || (user?.role === 'tailor' && measurement.created_by === user?.id)) && (
                            <Link
                              to={`/measurements/edit/${measurement.id}`}
                              className="px-2 py-1 text-xs bg-primary-gold text-white rounded hover:bg-opacity-90 transition"
                              title="Edit"
                            >
                              ✏️ Edit
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              navigate(`/measurements/view/${measurement.id}`);
                              setTimeout(() => {
                                window.print();
                              }, 1000);
                            }}
                            className="px-2 py-1 text-xs bg-steel text-white rounded hover:bg-opacity-90 transition"
                            title="Print"
                          >
                            🖨️ Print
                          </button>
                          {user?.role === 'admin' && (
                            <button
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to delete measurement ${measurement.entry_id}? This action cannot be undone.`)) {
                                  try {
                                    await axios.delete(`/api/measurements/${measurement.id}`);
                                    fetchMeasurements(); // Refresh the list
                                  } catch (err: any) {
                                    alert(err.response?.data?.error || 'Failed to delete measurement');
                                  }
                                }
                              }}
                              className="px-2 py-1 text-xs bg-crimson text-white rounded hover:bg-opacity-90 transition"
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
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Next
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

