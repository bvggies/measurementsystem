import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

interface Fitting {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string | null;
  measurement_id: string | null;
  measurement_entry_id: string | null;
  tailor_id: string;
  tailor_name: string;
  scheduled_at: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string | null;
  branch: string | null;
}

const Calendar: React.FC = () => {
  const { user } = useAuth();
  const [fittings, setFittings] = useState<Fitting[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');
  const [selectedFitting, setSelectedFitting] = useState<Fitting | null>(null);
  const [showFittingModal, setShowFittingModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    measurement_id: '',
    tailor_id: user?.role === 'tailor' ? user.id : '',
    scheduled_at: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
    notes: '',
    branch: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [tailors, setTailors] = useState<any[]>([]);

  const fetchFittings = useCallback(async () => {
    try {
      setLoading(true);
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const params = new URLSearchParams({
        fromDate: monthStart.toISOString(),
        toDate: monthEnd.toISOString(),
        limit: '1000',
      });

      const response = await axios.get(`/api/fittings?${params}`);
      setFittings(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch fittings:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchFittings();
  }, [fetchFittings]);

  useEffect(() => {
    // Fetch customers and tailors for dropdowns
    const fetchDropdownData = async () => {
      try {
        const [customersRes, measurementsRes, tailorsRes] = await Promise.all([
          axios.get('/api/customers?limit=1000'),
          axios.get('/api/measurements?limit=1000'),
          user?.role === 'admin' || user?.role === 'manager' ? axios.get('/api/users?role=tailor').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        ]);
        setCustomers(customersRes.data.data || []);
        setMeasurements(measurementsRes.data.data || []);
        setTailors(tailorsRes.data || []);
      } catch (error) {
        console.error('Failed to fetch dropdown data:', error);
      }
    };
    fetchDropdownData();
  }, [user]);

  const getFittingsForDate = (date: Date) => {
    return fittings.filter((fitting) => {
      const fittingDate = new Date(fitting.scheduled_at);
      return isSameDay(fittingDate, date);
    });
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleDateClick = (date: Date) => {
    const dateFittings = getFittingsForDate(date);
    if (dateFittings.length > 0) {
      setSelectedFitting(dateFittings[0]);
      setShowFittingModal(true);
    } else {
      // Open add modal with pre-filled date
      setFormData({
        ...formData,
        scheduled_at: format(date, "yyyy-MM-dd'T'HH:mm"),
      });
      setShowAddModal(true);
    }
  };

  const handleFittingClick = (fitting: Fitting) => {
    setSelectedFitting(fitting);
    setShowFittingModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (selectedFitting) {
        await axios.put(`/api/fittings/${selectedFitting.id}`, formData);
      } else {
        await axios.post('/api/fittings', formData);
      }
      setShowAddModal(false);
      setShowFittingModal(false);
      setSelectedFitting(null);
      setFormData({
        customer_id: '',
        measurement_id: '',
        tailor_id: user?.role === 'tailor' ? user.id || '' : '',
        scheduled_at: '',
        status: 'scheduled',
        notes: '',
        branch: '',
      });
      await fetchFittings();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save fitting');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFitting) return;
    if (!window.confirm('Are you sure you want to delete this fitting?')) return;

    try {
      await axios.delete(`/api/fittings/${selectedFitting.id}`);
      setShowFittingModal(false);
      setSelectedFitting(null);
      await fetchFittings();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete fitting');
    }
  };

  const handleStatusChange = async (fittingId: string, newStatus: string) => {
    try {
      await axios.put(`/api/fittings/${fittingId}`, { status: newStatus });
      await fetchFittings();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-primary-gold bg-opacity-20 text-primary-gold';
      case 'completed':
        return 'bg-emerald bg-opacity-20 text-emerald';
      case 'cancelled':
        return 'bg-crimson bg-opacity-20 text-crimson';
      default:
        return 'bg-steel bg-opacity-20 text-steel';
    }
  };

  const upcomingFittings = fittings
    .filter((f) => new Date(f.scheduled_at) >= new Date() && f.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6 pb-32">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <h1 className="text-3xl font-bold text-primary-navy">Calendar & Fittings</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'month' ? 'list' : 'month')}
            className="px-4 py-2 border border-steel-light text-steel rounded-lg hover:bg-soft-white transition"
          >
            {viewMode === 'month' ? '📋 List View' : '📅 Month View'}
          </button>
          {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'tailor') && (
            <button
              onClick={() => {
                setSelectedFitting(null);
                setFormData({
                  customer_id: '',
                  measurement_id: '',
                  tailor_id: user?.role === 'tailor' ? user.id || '' : '',
                  scheduled_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                  status: 'scheduled',
                  notes: '',
                  branch: '',
                });
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-primary-navy text-white rounded-lg hover:bg-opacity-90 transition"
            >
              + New Fitting
            </button>
          )}
        </div>
      </motion.div>

      {viewMode === 'month' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              ←
            </button>
            <h2 className="text-2xl font-bold text-primary-navy">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-steel py-2">
                {day}
              </div>
            ))}
            {calendarDays.map((day, index) => {
              const dayFittings = getFittingsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 }}
                  onClick={() => handleDateClick(day)}
                  className={`min-h-[100px] p-2 border border-steel-light rounded-lg cursor-pointer hover:bg-soft-white transition ${
                    !isCurrentMonth ? 'opacity-30' : ''
                  } ${isToday ? 'ring-2 ring-primary-gold' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary-gold' : 'text-steel'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayFittings.slice(0, 3).map((fitting) => (
                      <div
                        key={fitting.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFittingClick(fitting);
                        }}
                        className={`text-xs p-1 rounded ${getStatusColor(fitting.status)} truncate`}
                        title={`${fitting.customer_name} - ${format(new Date(fitting.scheduled_at), 'HH:mm')}`}
                      >
                        {format(new Date(fitting.scheduled_at), 'HH:mm')} - {fitting.customer_name}
                      </div>
                    ))}
                    {dayFittings.length > 3 && (
                      <div className="text-xs text-steel">+{dayFittings.length - 3} more</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-primary-navy">Upcoming Fittings</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-navy mx-auto"></div>
            </div>
          ) : upcomingFittings.length === 0 ? (
            <div className="p-8 text-center text-steel">No upcoming fittings</div>
          ) : (
            <div className="divide-y divide-steel-light">
              {upcomingFittings.map((fitting) => (
                <div
                  key={fitting.id}
                  onClick={() => handleFittingClick(fitting)}
                  className="p-4 hover:bg-soft-white cursor-pointer transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-primary-navy">{fitting.customer_name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fitting.status)}`}>
                          {fitting.status}
                        </span>
                      </div>
                      <p className="text-sm text-steel mt-1">
                        {format(new Date(fitting.scheduled_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                      {fitting.tailor_name && (
                        <p className="text-sm text-steel">Tailor: {fitting.tailor_name}</p>
                      )}
                      {fitting.notes && (
                        <p className="text-sm text-steel mt-1">{fitting.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={fitting.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(fitting.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1 border border-steel-light rounded-lg text-sm"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Fitting Detail Modal */}
      {showFittingModal && selectedFitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-primary-navy mb-4">Fitting Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-steel mb-1">Customer</label>
                <p className="text-primary-navy font-medium">{selectedFitting.customer_name}</p>
                {selectedFitting.customer_phone && (
                  <p className="text-sm text-steel">{selectedFitting.customer_phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-steel mb-1">Scheduled At</label>
                <p className="text-primary-navy">
                  {format(new Date(selectedFitting.scheduled_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-steel mb-1">Status</label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedFitting.status)}`}>
                  {selectedFitting.status}
                </span>
              </div>

              {selectedFitting.tailor_name && (
                <div>
                  <label className="block text-sm font-medium text-steel mb-1">Tailor</label>
                  <p className="text-primary-navy">{selectedFitting.tailor_name}</p>
                </div>
              )}

              {selectedFitting.notes && (
                <div>
                  <label className="block text-sm font-medium text-steel mb-1">Notes</label>
                  <p className="text-steel">{selectedFitting.notes}</p>
                </div>
              )}

              {selectedFitting.measurement_entry_id && selectedFitting.measurement_id && (
                <div>
                  <Link
                    to={`/measurements/view/${selectedFitting.measurement_id}`}
                    className="text-primary-gold hover:underline"
                    onClick={(e) => {
                      if (!selectedFitting.measurement_id) {
                        e.preventDefault();
                        alert('Measurement ID is missing');
                      }
                    }}
                  >
                    View Measurement: {selectedFitting.measurement_entry_id}
                  </Link>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6 mt-6 border-t">
              {(user?.role === 'admin' || user?.role === 'manager' || (user?.role === 'tailor' && selectedFitting.tailor_id === user.id)) && (
                <>
                  <button
                    onClick={() => {
                      setFormData({
                        customer_id: selectedFitting.customer_id,
                        measurement_id: selectedFitting.measurement_id || '',
                        tailor_id: selectedFitting.tailor_id,
                        scheduled_at: format(new Date(selectedFitting.scheduled_at), "yyyy-MM-dd'T'HH:mm"),
                        status: selectedFitting.status,
                        notes: selectedFitting.notes || '',
                        branch: selectedFitting.branch || '',
                      });
                      setShowFittingModal(false);
                      setShowAddModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-primary-gold text-white rounded-lg hover:bg-opacity-90 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 bg-crimson text-white rounded-lg hover:bg-opacity-90 transition"
                  >
                    Delete
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setShowFittingModal(false);
                  setSelectedFitting(null);
                }}
                className="flex-1 px-4 py-2 border border-steel-light text-steel rounded-lg hover:bg-soft-white transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add/Edit Fitting Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-primary-navy mb-4">
              {selectedFitting ? 'Edit Fitting' : 'New Fitting'}
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-crimson bg-opacity-10 border border-crimson rounded-lg text-crimson">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-steel mb-2">Customer *</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold"
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.phone && `(${customer.phone})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-steel mb-2">Measurement (Optional)</label>
                <select
                  value={formData.measurement_id}
                  onChange={(e) => setFormData({ ...formData, measurement_id: e.target.value })}
                  className="w-full px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold"
                >
                  <option value="">Select measurement</option>
                  {measurements
                    .filter((m) => !formData.customer_id || m.customer_id === formData.customer_id)
                    .map((measurement) => (
                      <option key={measurement.id} value={measurement.id}>
                        {measurement.entry_id} - {measurement.customer_name}
                      </option>
                    ))}
                </select>
              </div>

              {(user?.role === 'admin' || user?.role === 'manager') && (
                <div>
                  <label className="block text-sm font-medium text-steel mb-2">Tailor *</label>
                  <select
                    value={formData.tailor_id}
                    onChange={(e) => setFormData({ ...formData, tailor_id: e.target.value })}
                    className="w-full px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold"
                    required
                  >
                    <option value="">Select tailor</option>
                    {tailors.map((tailor) => (
                      <option key={tailor.id} value={tailor.id}>
                        {tailor.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-steel mb-2">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  className="w-full px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-steel mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-steel mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedFitting(null);
                    setFormData({
                      customer_id: '',
                      measurement_id: '',
                      tailor_id: user?.role === 'tailor' ? user.id || '' : '',
                      scheduled_at: '',
                      status: 'scheduled',
                      notes: '',
                      branch: '',
                    });
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
                  {saving ? 'Saving...' : selectedFitting ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
