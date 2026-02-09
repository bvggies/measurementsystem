import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { SkeletonTable } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

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
  const { theme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllOnPage = () => {
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(customers.map((c) => c.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} customer(s)? This cannot be undone. Customers with measurements may not be deleted.`)) return;
    let done = 0;
    let failed = 0;
    for (const id of Array.from(selectedIds)) {
      try {
        await axios.delete(`/api/customers/${id}`);
        done++;
      } catch {
        failed++;
      }
    }
    setSelectedIds(new Set());
    await fetchCustomers();
    if (failed > 0) toast(`${done} deleted, ${failed} failed`, 'error');
    else toast(`${done} customer(s) deleted`, 'success');
  };

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

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page]);

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
        toast('Customer deleted successfully', 'success');
      } catch (err: any) {
        let errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to delete customer';
        if (errorMsg === '_t' || (typeof errorMsg === 'string' && !errorMsg.trim())) errorMsg = 'Failed to delete customer';
        toast(errorMsg, 'error');
        console.error('Delete error:', err);
      }
    }
  }, [fetchCustomers, toast]);

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
      toast(editingCustomer ? 'Customer updated' : 'Customer added', 'success');
    } catch (err: any) {
      let msg =
        (err.response?.data && (typeof err.response.data.error === 'string' ? err.response.data.error : err.response.data.message)) ||
        (typeof err.message === 'string' ? err.message : '');
      if (msg === '_t' || !msg?.trim()) msg = 'Failed to save customer';
      msg = msg || 'Failed to save customer';
      setError(msg);
      toast(msg, 'error');
      console.error('Save error:', err?.response?.data || err);
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
    <div className="space-y-4 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200 dark:border-dark-border"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-navy dark:text-dark-text">Customers</h1>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button
            type="button"
            onClick={() => {
              setEditingCustomer(null);
              setFormData({ name: '', phone: '', email: '', address: '' });
              setShowAddModal(true);
            }}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-3 sm:py-2 bg-primary-navy text-white rounded-xl hover:bg-primary-navy/90 transition font-medium"
          >
            + New Customer
          </button>
        )}
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-dark-surface rounded-xl shadow-md dark:border dark:border-dark-border p-4 sm:p-6"
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or email..."
              className="flex-1 min-w-0 px-4 py-3 sm:py-2 border border-steel-light dark:border-dark-border dark:bg-dark-bg dark:text-dark-text rounded-xl focus:ring-2 focus:ring-primary-gold text-base"
            />
            <button
              type="submit"
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-6 py-3 sm:py-2 bg-primary-navy text-white rounded-xl hover:bg-primary-navy/90 transition-colors font-medium"
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
        className="bg-white dark:bg-dark-surface rounded-xl shadow-md dark:border dark:border-dark-border overflow-hidden"
      >
        {loading ? (
          <SkeletonTable rows={6} cols={6} />
        ) : customers.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No customers yet"
            description="Add your first customer or they will appear when you create measurements."
            actionLabel="New Customer"
            onAction={() => setShowAddModal(true)}
          />
        ) : (
          <>
            {/* Bulk actions bar */}
            {selectedIds.size > 0 && (
              <div className={`flex flex-wrap items-center gap-3 px-4 py-3 border-b ${isDark ? 'border-dark-border bg-dark-border/30' : 'border-steel-light bg-soft-white'}`}>
                <span className={`font-medium ${isDark ? 'text-dark-text' : 'text-primary-navy'}`}>{selectedIds.size} selected</span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className={`text-sm text-steel transition ${isDark ? 'hover:text-primary-gold' : 'hover:text-primary-navy'}`}
                >
                  Clear
                </button>
                {user?.role === 'admin' && (
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    className="text-sm px-3 py-1.5 rounded-lg bg-crimson text-white hover:bg-crimson/90 transition"
                  >
                    Delete selected
                  </button>
                )}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className={isDark ? 'bg-dark-border/50' : 'bg-soft-white'}>
                  <tr>
                    <th className="w-10 px-2 py-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customers.length > 0 && selectedIds.size === customers.length}
                          ref={(el) => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < customers.length; }}
                          onChange={selectAllOnPage}
                          className="rounded border-gray-300 text-primary-gold focus:ring-primary-gold w-4 h-4"
                        />
                      </label>
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase cursor-pointer ${isDark ? 'text-gray-400 hover:bg-dark-border/50' : 'text-steel hover:bg-gray-100'}`}
                      onClick={() => handleSort('name')}
                    >
                      Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-steel'}`}>Phone</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-steel'}`}>Email</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-steel'}`}>Measurements</th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase cursor-pointer ${isDark ? 'text-gray-400 hover:bg-dark-border/50' : 'text-steel hover:bg-gray-100'}`}
                      onClick={() => handleSort('created_at')}
                    >
                      Created {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-steel'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-dark-border' : 'divide-steel-light'}`}>
                  {customers.map((customer, index) => (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      data-aos="fade-right"
                      className={`cursor-pointer transition-colors duration-150 ${isDark ? 'hover:bg-dark-border/30' : 'hover:bg-soft-white'}`}
                      onClick={() => navigate(`/customers/${customer.id}`)}
                      style={{ backgroundColor: selectedIds.has(customer.id) ? 'rgba(212, 175, 55, 0.1)' : undefined }}
                    >
                      <td className="w-10 px-2 py-4" onClick={(e) => e.stopPropagation()}>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(customer.id)}
                            onChange={() => toggleOne(customer.id)}
                            className="rounded border-gray-300 text-primary-gold focus:ring-primary-gold w-4 h-4"
                          />
                        </label>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${isDark ? 'text-dark-text' : 'text-primary-navy'}`}>{customer.name}</div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-steel'}`}>
                        {customer.phone || 'N/A'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-steel'}`}>
                        {customer.email || 'N/A'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-steel'}`}>
                        <span className="px-2 py-1 bg-primary-gold bg-opacity-20 text-primary-gold rounded-full text-xs font-medium">
                          {customer.measurement_count || 0}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-steel'}`}>
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
              <div className="px-4 sm:px-6 py-4 border-t border-steel-light dark:border-dark-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (page > 1) setPage(page - 1); }}
                  disabled={page === 1}
                  className="min-h-[44px] sm:min-h-0 px-4 py-3 sm:py-2 border border-steel-light dark:border-dark-border text-steel dark:text-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-soft-white dark:hover:bg-dark-surface transition-colors font-medium"
                >
                  ← Previous
                </button>
                <span className="text-sm text-steel dark:text-gray-300 text-center">Page {page} of {totalPages}</span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (page < totalPages) setPage(page + 1); }}
                  disabled={page === totalPages}
                  className="min-h-[44px] sm:min-h-0 px-4 py-3 sm:py-2 border border-steel-light dark:border-dark-border text-steel dark:text-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-soft-white dark:hover:bg-dark-surface transition-colors font-medium"
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
            className={`rounded-xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200'}`}
          >
            <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-dark-text' : 'text-primary-navy'}`}>
              {editingCustomer ? 'Edit Customer' : 'New Customer'}
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-crimson bg-opacity-10 border border-crimson rounded-lg text-crimson">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-steel'}`}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold ${isDark ? 'border-dark-border bg-dark-bg text-dark-text' : 'border-steel-light'}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-steel'}`}>Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold ${isDark ? 'border-dark-border bg-dark-bg text-dark-text' : 'border-steel-light'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-steel'}`}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold ${isDark ? 'border-dark-border bg-dark-bg text-dark-text' : 'border-steel-light'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-steel'}`}>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold ${isDark ? 'border-dark-border bg-dark-bg text-dark-text' : 'border-steel-light'}`}
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
                  className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${isDark ? 'border-dark-border text-gray-300 hover:bg-dark-border/50' : 'border-steel-light text-steel hover:bg-soft-white'}`}
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
