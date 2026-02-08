import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

interface PendingItem {
  id: string;
  measurement_id: string;
  entry_id: string;
  customer_name: string;
  customer_phone: string;
  requested_at: string;
  requested_by_name: string | null;
}

const ApprovalQueue: React.FC = () => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200';

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/measurements/approval');
      setPending(res.data?.pending || []);
    } catch (err: any) {
      if (err.response?.status === 501) {
        setPending([]);
      } else {
        toast(err.response?.data?.error || 'Failed to load approval queue', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDecide = async (measurementId: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    try {
      await axios.post('/api/measurements/approval', {
        measurement_id: measurementId,
        status,
        rejection_reason: rejectionReason,
      });
      toast(status === 'approved' ? 'Measurement approved' : 'Measurement rejected', status === 'approved' ? 'success' : 'info');
      fetchPending();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Action failed', 'error');
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
          <h1 className={`text-3xl font-bold ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>
            Approval queue
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Customer-submitted measurements awaiting your approval
          </p>
        </div>
        <Link
          to="/measurements/compare"
          className="px-4 py-2.5 border border-primary-gold text-primary-gold rounded-xl hover:bg-primary-gold/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold transition"
        >
          Compare measurements
        </Link>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-gold border-t-transparent" />
        </div>
      ) : pending.length === 0 ? (
        <div className={`${cardBg} rounded-xl border p-8 text-center`}>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            No pending approvals.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((item) => (
            <motion.div
              key={item.measurement_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${cardBg} rounded-xl border p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}
            >
              <div>
                <p className={`font-medium ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>
                  {item.entry_id} · {item.customer_name || 'N/A'}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Requested by {item.requested_by_name || 'Customer'} on{' '}
                  {format(new Date(item.requested_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link
                  to={`/measurements/view/${item.measurement_id}`}
                  className="px-4 py-2 border border-steel text-steel rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => handleDecide(item.measurement_id, 'approved')}
                  className="px-4 py-2 bg-emerald text-white rounded-lg hover:bg-emerald/90 transition"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const reason = window.prompt('Rejection reason (optional):');
                    handleDecide(item.measurement_id, 'rejected', reason || undefined);
                  }}
                  className="px-4 py-2 bg-crimson text-white rounded-lg hover:bg-crimson/90 transition"
                >
                  Reject
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApprovalQueue;
