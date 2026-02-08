import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface Reminder {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string | null;
  measurement_entry_id: string | null;
  reminder_type: string;
  due_at: string;
  sent_at: string | null;
  status: string;
  channel: string | null;
  created_at: string;
}

const RemindersPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200';

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/reminders');
      setReminders(res.data?.reminders || []);
    } catch (err: any) {
      if (err.response?.status !== 501) toast(err.response?.data?.error || 'Failed to load reminders', 'error');
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const markSent = async (id: string) => {
    try {
      await axios.patch(`/api/reminders/${id}`, { status: 'sent' });
      toast('Reminder marked as sent', 'success');
      fetchReminders();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Update failed', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-32">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className={`text-3xl font-bold ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>Reminders</h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Measurement update and re-measure reminders
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-gold border-t-transparent" />
        </div>
      ) : reminders.length === 0 ? (
        <div className={`${cardBg} rounded-xl border p-8 text-center`}>
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No reminders.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reminders.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${cardBg} rounded-xl border p-6`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className={`font-medium ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>
                    {r.customer_name || 'Customer'} · {r.reminder_type}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Due {format(new Date(r.due_at), 'MMM dd, yyyy HH:mm')}
                    {r.sent_at && ` · Sent ${format(new Date(r.sent_at), 'MMM dd')}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-dark-border' : 'bg-gray-100'}`}>
                    {r.status}
                  </span>
                  {r.status === 'pending' && (user?.role === 'admin' || user?.role === 'manager') && (
                    <button
                      type="button"
                      onClick={() => markSent(r.id)}
                      className="px-3 py-1.5 bg-primary-navy text-white rounded-lg hover:bg-primary-navy/90 text-sm"
                    >
                      Mark sent
                    </button>
                  )}
                  <Link to={`/customers/${r.customer_id}`} className="px-3 py-1.5 border border-primary-gold text-primary-gold rounded-lg hover:bg-primary-gold/10 text-sm">
                    Customer
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RemindersPage;
