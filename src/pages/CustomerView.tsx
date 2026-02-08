import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

interface MeasurementProfile {
  id: string;
  customer_id: string;
  name: string;
  profile_type: string;
  notes: string | null;
  created_at: string;
  updated_at?: string;
}

const CustomerView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<any>(null);
  const [profiles, setProfiles] = useState<MeasurementProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', profile_type: 'custom', notes: '' });
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCustomer = useCallback(async () => {
    if (!id) {
      setError('Invalid customer ID');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`/api/customers/${id}`);
      if (response.data) {
        setCustomer(response.data);
      } else {
        setError('Customer data is empty');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load customer';
      setError(errorMsg);
      console.error('Failed to fetch customer:', {
        error: err,
        response: err.response,
        id,
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const fetchProfiles = useCallback(async () => {
    if (!id) return;
    try {
      setProfilesLoading(true);
      const res = await axios.get('/api/measurement-profiles', { params: { customer_id: id } });
      setProfiles(res.data?.profiles || []);
    } catch (_) {
      setProfiles([]);
    } finally {
      setProfilesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id && customer) fetchProfiles();
  }, [id, customer, fetchProfiles]);

  const createProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !profileForm.name.trim()) return;
    try {
      setCreatingProfile(true);
      await axios.post('/api/measurement-profiles', {
        customer_id: id,
        name: profileForm.name.trim(),
        profile_type: profileForm.profile_type,
        notes: profileForm.notes.trim() || null,
      });
      setProfileForm({ name: '', profile_type: 'custom', notes: '' });
      setShowProfileForm(false);
      fetchProfiles();
    } catch (_) {}
    finally {
      setCreatingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-navy"></div>
        <p className="ml-4 text-steel">Loading customer...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-4 pb-32">
        <div className="bg-crimson bg-opacity-10 border border-crimson rounded-lg p-4 text-crimson">
          <p className="font-semibold">Error loading customer</p>
          <p className="mt-2">{error || 'Customer not found'}</p>
        </div>
        <Link
          to="/customers"
          className="inline-block px-4 py-2 bg-primary-navy text-white rounded-lg hover:bg-opacity-90 transition"
        >
          ← Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 className="text-3xl font-bold text-primary-navy">Customer Details</h1>
        <div className="flex gap-2">
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Link
              to={`/customers/edit/${customer.id}`}
              className="px-4 py-2 bg-primary-gold text-white rounded-lg hover:bg-primary-gold-dark transition-colors"
            >
              ✏️ Edit
            </Link>
          )}
        </div>
      </motion.div>

      {/* Customer Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        data-aos="fade-up"
        className="bg-white rounded-xl shadow-md p-6"
      >
        <h2 className="text-xl font-bold text-primary-navy mb-4 border-b pb-2">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-steel">Name:</p>
            <p className="font-medium text-primary-navy text-lg">{customer.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-steel">Phone:</p>
            <p className="font-medium text-primary-navy">{customer.phone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-steel">Email:</p>
            <p className="font-medium text-primary-navy">{customer.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-steel">Address:</p>
            <p className="font-medium text-primary-navy">{customer.address || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-steel">Total Measurements:</p>
            <p className="font-medium text-primary-navy">{customer.measurement_count || 0}</p>
          </div>
          <div>
            <p className="text-sm text-steel">Total Orders:</p>
            <p className="font-medium text-primary-navy">{customer.order_count || 0}</p>
          </div>
        </div>
      </motion.div>

      {/* Recent Measurements */}
      {customer.measurements && customer.measurements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          data-aos="fade-up"
          className="bg-white rounded-xl shadow-md p-6"
        >
          <h2 className="text-xl font-bold text-primary-navy mb-4 border-b pb-2">Recent Measurements</h2>
          <div className="space-y-2">
            {customer.measurements.map((measurement: any) => (
              <Link
                key={measurement.id}
                to={`/measurements/view/${measurement.id}`}
                className="block p-4 border border-steel-light rounded-lg hover:bg-soft-white transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary-navy">Entry ID: {measurement.entry_id}</p>
                    <p className="text-sm text-steel">
                      {format(new Date(measurement.created_at), 'MMM dd, yyyy')} • {measurement.units}
                    </p>
                  </div>
                  <span className="text-primary-gold">→</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Measurement profiles (versions: wedding, weight change, etc.) */}
      {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'tailor') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          data-aos="fade-up"
          className="bg-white rounded-xl shadow-md p-6 dark:bg-dark-surface dark:border dark:border-dark-border"
        >
          <h2 className="text-xl font-bold text-primary-navy dark:text-dark-text mb-4 border-b pb-2 dark:border-dark-border">Measurement profiles</h2>
          {profilesLoading ? (
            <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-gold" /></div>
          ) : profiles.length === 0 && !showProfileForm ? (
            <p className="text-steel dark:text-gray-400 text-sm">No profiles yet. Add one (e.g. wedding, weight change).</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {profiles.map((p) => (
                <li key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-dark-bg">
                  <div>
                    <span className="font-medium text-primary-navy dark:text-dark-text">{p.name}</span>
                    <span className="text-sm text-steel dark:text-gray-400 ml-2">({p.profile_type})</span>
                  </div>
                  <span className="text-xs text-steel dark:text-gray-500">{format(new Date(p.created_at), 'MMM dd, yyyy')}</span>
                </li>
              ))}
            </ul>
          )}
          {showProfileForm ? (
            <form onSubmit={createProfile} className="space-y-3 p-4 rounded-lg border border-gray-200 dark:border-dark-border">
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Profile name (e.g. Wedding, Post weight loss)"
                className="w-full px-4 py-2 border rounded-lg dark:bg-dark-bg dark:border-dark-border dark:text-dark-text"
                required
              />
              <select
                value={profileForm.profile_type}
                onChange={(e) => setProfileForm((f) => ({ ...f, profile_type: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg dark:bg-dark-bg dark:border-dark-border dark:text-dark-text"
              >
                <option value="custom">Custom</option>
                <option value="wedding">Wedding</option>
                <option value="weight_change">Weight change</option>
                <option value="seasonal">Seasonal</option>
              </select>
              <textarea
                value={profileForm.notes}
                onChange={(e) => setProfileForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Notes (optional)"
                className="w-full px-4 py-2 border rounded-lg dark:bg-dark-bg dark:border-dark-border dark:text-dark-text"
                rows={2}
              />
              <div className="flex gap-2">
                <button type="submit" disabled={creatingProfile} className="px-4 py-2 bg-primary-gold text-primary-navy rounded-lg hover:bg-primary-gold/90 disabled:opacity-50">Save</button>
                <button type="button" onClick={() => setShowProfileForm(false)} className="px-4 py-2 border rounded-lg dark:border-dark-border dark:text-dark-text">Cancel</button>
              </div>
            </form>
          ) : (
            <button type="button" onClick={() => setShowProfileForm(true)} className="px-4 py-2 bg-primary-navy text-white rounded-lg hover:bg-primary-navy/90 text-sm">Add profile</button>
          )}
        </motion.div>
      )}

      {/* Upcoming Fittings */}
      {customer.fittings && customer.fittings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          data-aos="fade-up"
          className="bg-white rounded-xl shadow-md p-6"
        >
          <h2 className="text-xl font-bold text-primary-navy mb-4 border-b pb-2">Upcoming Fittings</h2>
          <div className="space-y-2">
            {customer.fittings.map((fitting: any) => (
              <div
                key={fitting.id}
                className="p-4 border border-steel-light rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary-navy">
                      {format(new Date(fitting.scheduled_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                    {fitting.tailor_name && (
                      <p className="text-sm text-steel">Tailor: {fitting.tailor_name}</p>
                    )}
                    {fitting.notes && (
                      <p className="text-sm text-steel mt-1">{fitting.notes}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    fitting.status === 'scheduled' ? 'bg-primary-gold bg-opacity-20 text-primary-gold' :
                    fitting.status === 'completed' ? 'bg-emerald bg-opacity-20 text-emerald' :
                    'bg-crimson bg-opacity-20 text-crimson'
                  }`}>
                    {fitting.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Audit Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        data-aos="fade-up"
        className="bg-white rounded-xl shadow-md p-6 text-sm text-steel"
      >
        <p><strong>Created:</strong> {format(new Date(customer.created_at), 'MMM dd, yyyy HH:mm')}</p>
        {customer.updated_at && (
          <p><strong>Last Updated:</strong> {format(new Date(customer.updated_at), 'MMM dd, yyyy HH:mm')}</p>
        )}
      </motion.div>
    </div>
  );
};

export default CustomerView;

