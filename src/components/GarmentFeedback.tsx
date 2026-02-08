import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface FeedbackEntry {
  id: string;
  garment_type: string | null;
  fit_feedback: string;
  notes: string | null;
  created_by_name: string | null;
  created_at: string;
}

const FIT_LABELS: Record<string, string> = {
  too_tight: 'Too tight',
  slightly_tight: 'Slightly tight',
  perfect: 'Perfect',
  slightly_loose: 'Slightly loose',
  too_loose: 'Too loose',
};

interface GarmentFeedbackProps {
  measurementId: string;
}

const GarmentFeedback: React.FC<GarmentFeedbackProps> = ({ measurementId }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ garment_type: '', fit_feedback: 'perfect', notes: '' });
  const isDark = theme === 'dark';
  const canAdd = user?.role && ['admin', 'manager', 'tailor'].includes(user.role);

  useEffect(() => {
    if (!measurementId) return;
    axios
      .get(`/api/garment-feedback?measurement_id=${measurementId}`)
      .then((res) => setFeedback(res.data?.feedback || []))
      .catch(() => setFeedback([]))
      .finally(() => setLoading(false));
  }, [measurementId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fit_feedback) return;
    setSubmitting(true);
    axios
      .post('/api/garment-feedback', {
        measurement_id: measurementId,
        garment_type: form.garment_type || null,
        fit_feedback: form.fit_feedback,
        notes: form.notes || null,
      })
      .then(() => {
        toast('Feedback saved', 'success');
        setForm({ garment_type: '', fit_feedback: 'perfect', notes: '' });
        return axios.get(`/api/garment-feedback?measurement_id=${measurementId}`);
      })
      .then((res) => setFeedback(res.data?.feedback || []))
      .catch((err) => toast(err.response?.data?.error || 'Failed to save', 'error'))
      .finally(() => setSubmitting(false));
  };

  if (loading) return <div className="py-2 text-sm text-gray-500">Loading feedback…</div>;

  return (
    <div className="space-y-4">
      {feedback.length > 0 && (
        <ul className="space-y-2">
          {feedback.map((f) => (
            <li
              key={f.id}
              className={`flex items-center justify-between gap-2 py-2 border-b last:border-b-0 ${isDark ? 'border-dark-border' : 'border-gray-200'}`}
            >
              <div>
                <span className={`font-medium ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>
                  {f.garment_type || 'Garment'} · {FIT_LABELS[f.fit_feedback] || f.fit_feedback}
                </span>
                {f.notes && (
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{f.notes}</p>
                )}
              </div>
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {f.created_by_name} · {format(new Date(f.created_at), 'MMM dd')}
              </span>
            </li>
          ))}
        </ul>
      )}
      {canAdd && (
        <motion.form onSubmit={handleSubmit} className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h4 className={`text-sm font-medium ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>Add fit feedback</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={form.garment_type}
              onChange={(e) => setForm((p) => ({ ...p, garment_type: e.target.value }))}
              placeholder="Garment type (e.g. Shirt)"
              className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'border-dark-border bg-dark-bg text-dark-text' : 'border-gray-300'}`}
            />
            <select
              value={form.fit_feedback}
              onChange={(e) => setForm((p) => ({ ...p, fit_feedback: e.target.value }))}
              className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'border-dark-border bg-dark-bg text-dark-text' : 'border-gray-300'}`}
            >
              {Object.entries(FIT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Notes (optional)"
            className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'border-dark-border bg-dark-bg text-dark-text' : 'border-gray-300'}`}
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-primary-gold text-primary-navy font-medium rounded-lg hover:bg-primary-gold/90 disabled:opacity-50 text-sm"
          >
            {submitting ? 'Saving…' : 'Save feedback'}
          </button>
        </motion.form>
      )}
    </div>
  );
};

export default GarmentFeedback;
