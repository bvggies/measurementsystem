import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface Order {
  id: string;
  measurement_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  measurement_entry_id: string;
  fabric: string;
  status: 'raw' | 'in-progress' | 'ready' | 'delivered';
  delivery_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

const OrdersList: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState({
    measurement_id: '',
    customer_id: '',
    fabric: '',
    status: 'raw' as Order['status'],
    delivery_date: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(filters.status && { status: filters.status }),
      });

      const response = await axios.get(`/api/orders?${params}`);
      setOrders(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingOrder) {
        await axios.put(`/api/orders/${editingOrder.id}`, formData);
      } else {
        await axios.post('/api/orders', formData);
      }
      setShowAddModal(false);
      setEditingOrder(null);
      setFormData({
        measurement_id: '',
        customer_id: '',
        fabric: '',
        status: 'raw',
        delivery_date: '',
        notes: '',
      });
      await fetchOrders();
    } catch (err: any) {
      let errorMsg = 'Failed to save order';
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data.error === 'string') {
          errorMsg = data.error;
        } else if (typeof data.message === 'string') {
          errorMsg = data.message;
        }
      } else if (err.message && typeof err.message === 'string') {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    try {
      await axios.delete(`/api/orders/${orderId}`);
      await fetchOrders();
    } catch (err: any) {
      let errorMsg = 'Failed to delete order';
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data.error === 'string') {
          errorMsg = data.error;
        }
      }
      alert(errorMsg);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'raw':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-primary-gold bg-opacity-20 text-primary-gold';
      case 'ready':
        return 'bg-emerald bg-opacity-20 text-emerald';
      case 'delivered':
        return 'bg-primary-navy bg-opacity-20 text-primary-navy';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 pb-32">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className={`text-3xl font-bold transition-colors duration-200 ${
            theme === 'dark' ? 'text-dark-text' : 'text-primary-navy'
          }`}>Orders</h1>
          <p className={`mt-1 transition-colors duration-200 ${
            theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
          }`}>Manage customer orders and delivery schedules</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'tailor') && (
          <button
            onClick={() => {
              setEditingOrder(null);
              setFormData({
                measurement_id: '',
                customer_id: '',
                fabric: '',
                status: 'raw',
                delivery_date: '',
                notes: '',
              });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-primary-navy text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            + New Order
          </button>
        )}
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        data-aos="fade-up"
        className={`rounded-xl shadow-md p-6 transition-colors duration-200 ${
          theme === 'dark' ? 'bg-dark-surface' : 'bg-white'
        }`}
      >
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, entry ID..."
            className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold transition-colors duration-200 ${
              theme === 'dark' ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-steel-light'
            }`}
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold transition-colors duration-200 ${
              theme === 'dark' ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-steel-light'
            }`}
          >
            <option value="">All Statuses</option>
            <option value="raw">Raw</option>
            <option value="in-progress">In Progress</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-primary-navy text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Search
          </button>
        </form>
      </motion.div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        data-aos="fade-up"
        className={`rounded-xl shadow-md overflow-hidden transition-colors duration-200 ${
          theme === 'dark' ? 'bg-dark-surface' : 'bg-white'
        }`}
      >
        {loading ? (
          <div className="p-8 text-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto transition-colors duration-200 ${
              theme === 'dark' ? 'border-primary-gold' : 'border-primary-navy'
            }`}></div>
          </div>
        ) : orders.length === 0 ? (
          <div className={`p-8 text-center transition-colors duration-200 ${
            theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
          }`}>No orders found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`transition-colors duration-200 ${
                  theme === 'dark' ? 'bg-dark-bg' : 'bg-primary-navy'
                } text-white`}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Measurement</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Fabric</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Delivery Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors duration-200 ${
                  theme === 'dark' ? 'divide-dark-border' : 'divide-gray-200'
                }`}>
                  {orders.map((order, index) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`transition-colors duration-200 ${
                        theme === 'dark' ? 'hover:bg-dark-bg' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={`transition-colors duration-200 ${
                          theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
                        }`}>
                          {order.id.substring(0, 8)}...
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className={`text-sm font-medium transition-colors duration-200 ${
                            theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
                          }`}>
                            {order.customer_name || 'N/A'}
                          </p>
                          {order.customer_phone && (
                            <p className={`text-xs transition-colors duration-200 ${
                              theme === 'dark' ? 'text-dark-text-secondary' : 'text-gray-500'
                            }`}>
                              {order.customer_phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.measurement_entry_id ? (
                          <Link
                            to={`/measurements/view/${order.measurement_id}`}
                            className={`text-sm text-primary-gold hover:underline transition-colors duration-200 ${
                              theme === 'dark' ? 'text-primary-gold' : ''
                            }`}
                          >
                            {order.measurement_entry_id}
                          </Link>
                        ) : (
                          <span className={`text-sm transition-colors duration-200 ${
                            theme === 'dark' ? 'text-dark-text-secondary' : 'text-gray-500'
                          }`}>N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm transition-colors duration-200 ${
                          theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
                        }`}>
                          {order.fabric || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm transition-colors duration-200 ${
                          theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
                        }`}>
                          {order.delivery_date ? format(new Date(order.delivery_date), 'MMM dd, yyyy') : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm transition-colors duration-200 ${
                          theme === 'dark' ? 'text-dark-text-secondary' : 'text-gray-500'
                        }`}>
                          {format(new Date(order.created_at), 'MMM dd, yyyy')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingOrder(order);
                              setFormData({
                                measurement_id: order.measurement_id || '',
                                customer_id: order.customer_id || '',
                                fabric: order.fabric || '',
                                status: order.status,
                                delivery_date: order.delivery_date ? format(new Date(order.delivery_date), 'yyyy-MM-dd') : '',
                                notes: order.notes || '',
                              });
                              setShowAddModal(true);
                            }}
                            className="px-2 py-1 text-xs bg-primary-gold text-white rounded hover:bg-opacity-90 transition cursor-pointer z-10 relative"
                            title="Edit"
                          >
                            ✏️ Edit
                          </button>
                          {user?.role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleDelete(order.id)}
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
              <div className={`px-6 py-4 border-t flex items-center justify-between transition-colors duration-200 ${
                theme === 'dark' ? 'border-dark-border' : 'border-steel-light'
              }`}>
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
                  className={`px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-soft-white dark:hover:bg-dark-surface transition-colors duration-200 ${
                    theme === 'dark' 
                      ? 'border-dark-border text-gray-300' 
                      : 'border-steel-light text-steel'
                  }`}
                >
                  ← Previous
                </button>
                <span className={`text-sm transition-colors duration-200 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-steel'
                }`}>
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
                  className={`px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-soft-white dark:hover:bg-dark-surface transition-colors duration-200 ${
                    theme === 'dark' 
                      ? 'border-dark-border text-gray-300' 
                      : 'border-steel-light text-steel'
                  }`}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto transition-colors duration-200 ${
              theme === 'dark' ? 'bg-dark-surface' : 'bg-white'
            }`}
          >
            <h2 className={`text-2xl font-bold mb-4 transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-primary-navy'
            }`}>
              {editingOrder ? 'Edit Order' : 'New Order'}
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-crimson bg-opacity-10 border border-crimson rounded-lg text-crimson">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                  theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
                }`}>Measurement Entry ID</label>
                <input
                  type="text"
                  value={formData.measurement_id}
                  onChange={(e) => setFormData({ ...formData, measurement_id: e.target.value })}
                  placeholder="Search and select measurement"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold transition-colors duration-200 ${
                    theme === 'dark' ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-steel-light'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                  theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
                }`}>Fabric</label>
                <input
                  type="text"
                  value={formData.fabric}
                  onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold transition-colors duration-200 ${
                    theme === 'dark' ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-steel-light'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                  theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
                }`}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Order['status'] })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold transition-colors duration-200 ${
                    theme === 'dark' ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-steel-light'
                  }`}
                >
                  <option value="raw">Raw</option>
                  <option value="in-progress">In Progress</option>
                  <option value="ready">Ready</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                  theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
                }`}>Delivery Date</label>
                <input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold transition-colors duration-200 ${
                    theme === 'dark' ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-steel-light'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                  theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
                }`}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold transition-colors duration-200 ${
                    theme === 'dark' ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-steel-light'
                  }`}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingOrder(null);
                    setError('');
                  }}
                  className={`flex-1 px-4 py-2 border rounded-lg transition-colors duration-200 ${
                    theme === 'dark'
                      ? 'border-dark-border text-gray-300 hover:bg-dark-surface'
                      : 'border-steel-light text-steel hover:bg-soft-white'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary-navy text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : editingOrder ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OrdersList;
