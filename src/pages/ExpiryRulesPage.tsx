import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

interface ExpiryRule {
  id: string;
  name: string;
  days_since_created: number | null;
  days_since_updated: number | null;
  action: string;
  is_active: boolean;
  branch: string | null;
  created_at: string;
}

const ExpiryRulesPage: React.FC = () => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [rules, setRules] = useState<ExpiryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', days_since_created: '' as string | number, days_since_updated: '', action: 'mark_expired' });

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/expiry-rules');
      setRules(res.data?.rules || []);
    } catch (_) {
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const runCheck = async () => {
    try {
      setRunning(true);
      const res = await axios.post('/api/expiry-rules/run');
      const marked = res.data?.marked ?? 0;
      toast(res.data?.message || `Marked ${marked} as expired`, 'success');
      fetchRules();
    } catch (e: any) {
      toast(e.response?.data?.error || e.message || 'Failed to run expiry check', 'error');
    } finally {
      setRunning(false);
    }
  };

  const createRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast('Name is required', 'error');
      return;
    }
    try {
      setCreating(true);
      await axios.post('/api/expiry-rules', {
        name: form.name.trim(),
        days_since_created: form.days_since_created ? Number(form.days_since_created) : null,
        days_since_updated: form.days_since_updated ? Number(form.days_since_updated) : null,
        action: form.action,
      });
      toast('Rule created', 'success');
      setForm({ name: '', days_since_created: '', days_since_updated: '', action: 'mark_expired' });
      setShowForm(false);
      fetchRules();
    } catch (e: any) {
      toast(e.response?.data?.error || e.message || 'Failed to create rule', 'error');
    } finally {
      setCreating(false);
    }
  };

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-dark-surface border border-dark-border' : 'bg-white shadow-md';
  const textPrimary = isDark ? 'text-dark-text' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className="space-y-6 pb-32">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <h1 className={`text-3xl font-bold ${textPrimary}`}>Expiry Rules</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-xl bg-primary-navy text-white hover:bg-primary-navy/90 transition"
          >
            {showForm ? 'Cancel' : 'Add rule'}
          </button>
          <button
            type="button"
            onClick={runCheck}
            disabled={running}
            className="px-4 py-2 rounded-xl bg-primary-gold text-primary-navy hover:bg-primary-gold/90 disabled:opacity-50 transition"
          >
            {running ? 'Running…' : 'Run expiry check'}
          </button>
        </div>
      </motion.div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={`${cardBg} rounded-xl p-6`}
        >
          <h2 className={`text-lg font-bold mb-4 ${textPrimary}`}>New rule</h2>
          <form onSubmit={createRule} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-gray-300'}`}
                placeholder="e.g. Expire after 1 year"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Days since created</label>
                <input
                  type="number"
                  value={form.days_since_created}
                  onChange={(e) => setForm((f) => ({ ...f, days_since_created: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-gray-300'}`}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Days since updated</label>
                <input
                  type="number"
                  value={form.days_since_updated}
                  onChange={(e) => setForm((f) => ({ ...f, days_since_updated: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-gray-300'}`}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Action</label>
              <select
                value={form.action}
                onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-gray-300'}`}
              >
                <option value="mark_expired">Mark as expired</option>
                <option value="remind_only">Remind only</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-xl bg-emerald text-white hover:bg-emerald/90 disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </form>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${cardBg} rounded-xl p-6`}
      >
        <h2 className={`text-xl font-bold mb-4 ${textPrimary}`}>Rules</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDark ? 'border-primary-gold' : 'border-primary-navy'}`} />
          </div>
        ) : rules.length === 0 ? (
          <p className={textSecondary}>No expiry rules. Add one and run the check to mark old measurements as expired.</p>
        ) : (
          <ul className="space-y-3">
            {rules.map((r) => (
              <li
                key={r.id}
                className={`flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg ${isDark ? 'bg-dark-bg' : 'bg-gray-50'}`}
              >
                <div>
                  <span className={`font-medium ${textPrimary}`}>{r.name}</span>
                  <span className={`text-sm ml-2 ${textSecondary}`}>
                    {r.days_since_updated != null && `${r.days_since_updated}d since update`}
                    {r.days_since_updated != null && r.days_since_created != null && ' · '}
                    {r.days_since_created != null && `${r.days_since_created}d since created`}
                    {r.days_since_updated == null && r.days_since_created == null && '—'}
                    {' · '}{r.action}
                  </span>
                </div>
                {!r.is_active && <span className="text-xs text-gray-500">Inactive</span>}
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
};

export default ExpiryRulesPage;
