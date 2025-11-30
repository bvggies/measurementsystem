import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  measurement_count: number;
  last_measurement_date: string | null;
  created_at: string;
  updated_at: string;
}

const CustomersList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
        ...(search && { search }),
      });

      const response = await axios.get(`/api/customers?${params}`);
      setCustomers(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleDelete = useCallback(async (e: React.MouseEvent, customerId: string, customerName: string) => {
    e.stopPropagation();
    e.preventDefault();

    if (window.confirm(`Are you sure you want to delete customer "${customerName}"? This action cannot be undone.`)) {
      try {
        await axios.delete(`/api/customers/${customerId}`);
        await fetchCustomers();
      } catch (err: any) {
        const errorMsg = err.response?.data?.error || 'Failed to delete customer';
        alert(errorMsg);
        console.error('Delete error:', err);
      }
    }
  }, [fetchCustomers]);

  const handleEdit = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (editingCustomer) {
        await axios.put(`/api/customers/${editingCustomer.id}`, formData);
      } else {
        await axios.post('/api/customers', formData);
      }
      setShowAddModal(false);
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', email: '', address: '' });
      await fetchCustomers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save customer');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-navy"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold text-primary-navy">Customers</h1>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button
            onClick={() => {
              setEditingCustomer(null);
              setFormData({ name: '', phone: '', email: '', address: '' });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-primary-navy text-white rounded-lg hover:bg-opacity-90 transition"
          >
            + New Customer
          </button>
        )}
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
              placeholder="Search by name, phone, or email..."
              className="flex-1 px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-primary-navy text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </motion.div>

      {/* Customers Table */}
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
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-steel">No customers found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-soft-white">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-steel uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-steel uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-steel uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-steel uppercase">Measurements</th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-steel uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('created_at')}
                    >
                      Created {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-steel uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-light">
                  {customers.map((customer, index) => (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      data-aos="fade-right"
                      className="hover:bg-soft-white cursor-pointer"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-primary-navy">{customer.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-steel">
                        {customer.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-steel">
                        {customer.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-steel">
                        <span className="px-2 py-1 bg-primary-gold bg-opacity-20 text-primary-gold rounded-full text-xs font-medium">
                          {customer.measurement_count || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-steel">
                        {format(new Date(customer.created_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2 flex-wrap relative z-10">
                          <button
                            type="button"
                            onClick={(e) => handleEdit(e, customer)}
                            className="px-2 py-1 text-xs bg-primary-gold text-white rounded hover:bg-opacity-90 transition cursor-pointer"
                            title="Edit"
                          >
                            ✏️ Edit
                          </button>
                          {user?.role === 'admin' && (
                            <button
                              type="button"
                              onClick={(e) => handleDelete(e, customer.id, customer.name)}
                              className="px-2 py-1 text-xs bg-crimson text-white rounded hover:bg-opacity-90 transition cursor-pointer"
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-primary-navy mb-4">
              {editingCustomer ? 'Edit Customer' : 'New Customer'}
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-crimson bg-opacity-10 border border-crimson rounded-lg text-crimson">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-steel mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-steel mb-2">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-steel mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-steel mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCustomer(null);
                    setFormData({ name: '', phone: '', email: '', address: '' });
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-steel-light text-steel rounded-lg hover:bg-soft-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary-navy text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : editingCustomer ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CustomersList;
