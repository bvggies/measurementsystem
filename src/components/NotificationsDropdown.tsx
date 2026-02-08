import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/api';
import { format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  resource_type: string | null;
  resource_id: string | null;
  read_at: string | null;
  created_at: string;
}

const NotificationsDropdown: React.FC = () => {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/notifications');
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount ?? 0);
    } catch (_) {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markRead = async (id: string) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  const markAllRead = async () => {
    try {
      await axios.post('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
    } catch (_) {}
  };

  const linkFor = (n: Notification) => {
    if (n.resource_type === 'measurement' && n.resource_id) return `/measurements/view/${n.resource_id}`;
    return '#';
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition"
        aria-label="Notifications"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-crimson text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`absolute right-0 top-full mt-2 w-80 max-h-96 overflow-auto rounded-xl shadow-xl border z-50 ${
              isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200'
            }`}
          >
            <div className={`p-3 border-b flex items-center justify-between ${isDark ? 'border-dark-border' : 'border-gray-200'}`}>
              <span className={`font-medium ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>Notifications</span>
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead} className="text-xs text-primary-gold hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-dark-border">
                {notifications.slice(0, 20).map((n) => (
                  <li key={n.id}>
                    <Link
                      to={linkFor(n)}
                      onClick={() => { setOpen(false); if (!n.read_at) markRead(n.id); }}
                      className={`block p-3 hover:bg-gray-50 dark:hover:bg-dark-border/50 ${!n.read_at ? (isDark ? 'bg-dark-border/30' : 'bg-primary-gold/5') : ''}`}
                    >
                      <p className={`text-sm font-medium ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>{n.title}</p>
                      {n.body && <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{n.body}</p>}
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{format(new Date(n.created_at), 'MMM dd HH:mm')}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsDropdown;
