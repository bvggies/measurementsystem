import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { SkeletonCard } from '../components/Skeleton';

interface TailorStat {
  id: string;
  name: string;
  email: string;
  measurements_count: string;
  updates_count: string;
}

interface DashboardStats {
  totalCustomers: number;
  totalMeasurements: number;
  newEntries: number;
  pendingFittings: number;
  recentActivity: number;
  tailorStats?: TailorStat[];
  customerGrowth?: { newCustomersLast30Days: number; returningCustomersWithMeasurements: number };
  measurementTrends?: { avg_chest: number | null; avg_waist: number | null; avg_neck: number | null };
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';
  const showInsights = user && (user.role === 'admin' || user.role === 'manager');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/reports/summary');
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      setStats({
        totalCustomers: 0,
        totalMeasurements: 0,
        newEntries: 0,
        pendingFittings: 0,
        recentActivity: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Customers', value: stats?.totalCustomers ?? 0, icon: '👥', color: 'bg-primary-navy', link: '/customers' },
    { title: 'Total Measurements', value: stats?.totalMeasurements ?? 0, icon: '📏', color: 'bg-emerald', link: '/measurements' },
    { title: 'New Entries (30d)', value: stats?.newEntries ?? 0, icon: '✨', color: 'bg-primary-gold', link: '/measurements' },
    { title: 'Pending Fittings', value: stats?.pendingFittings ?? 0, icon: '📅', color: 'bg-steel', link: '/calendar' },
  ];

  const quickActions = [
    { name: 'New Measurement', href: '/measurements/new', icon: '➕', roles: ['admin', 'tailor'] },
    { name: 'Import Data', href: '/import', icon: '📥', roles: ['admin'] },
    { name: 'View Calendar', href: '/calendar', icon: '📅', roles: ['admin', 'tailor'] },
    { name: 'Manage Orders', href: '/orders', icon: '📦', roles: ['admin', 'tailor'] },
  ].filter((action) => user && action.roles.includes(user.role));

  const cardBg = isDark ? 'bg-dark-surface border border-dark-border' : 'bg-white shadow-md';
  const cardHover = isDark ? 'hover:border-primary-gold/50' : 'hover:shadow-lg';
  const textPrimary = isDark ? 'text-dark-text' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';

  if (loading) {
    return (
      <div className="space-y-8" id="main-content">
        <div>
          <div className="h-9 w-48 bg-gray-200 dark:bg-dark-border rounded animate-pulse mb-2" />
          <div className="h-5 w-64 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div>
          <div className="h-8 w-40 bg-gray-200 dark:bg-dark-border rounded animate-pulse mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`${cardBg} rounded-xl p-6 ${cardHover}`}>
                <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-dark-border animate-pulse mx-auto mb-3" />
                <div className="h-5 w-24 bg-gray-200 dark:bg-dark-border rounded animate-pulse mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8"
      id="main-content"
      initial="hidden"
      animate="show"
      variants={container}
    >
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${textPrimary}`}>Dashboard</h1>
          <p className={`${textSecondary} mt-1`}>Welcome back, {user?.name}!</p>
        </div>
      </motion.div>

      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={container}>
        {statCards.map((card, index) => (
          <motion.div key={card.title} variants={item}>
            <Link to={card.link} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 rounded-xl">
              <div className={`${cardBg} rounded-xl p-6 ${cardHover} transition-all duration-200 cursor-pointer border border-transparent`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${textSecondary}`}>{card.title}</p>
                    <p className={`text-3xl font-bold ${textPrimary} mt-2`}>{card.value}</p>
                  </div>
                  <div className={`${card.color} w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item}>
        <h2 className={`text-2xl font-bold ${textPrimary} mb-4`}>Quick Actions</h2>
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" variants={container}>
          {quickActions.map((action) => (
            <motion.div key={action.name} variants={item}>
              <Link to={action.href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 rounded-xl">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`${cardBg} rounded-xl p-6 ${cardHover} transition-shadow cursor-pointer text-center border border-transparent`}
                >
                  <div className="text-4xl mb-3">{action.icon}</div>
                  <p className={`font-medium ${textPrimary}`}>{action.name}</p>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        variants={item}
        className={`${cardBg} rounded-xl p-6 border border-transparent`}
      >
        <h2 className={`text-2xl font-bold ${textPrimary} mb-4`}>Recent Activity</h2>
        <p className={textSecondary}>
          {stats?.recentActivity ?? 0} new measurements in the last 7 days
        </p>
      </motion.div>

      {showInsights && (stats?.tailorStats?.length || stats?.customerGrowth || stats?.measurementTrends) && (
        <motion.div variants={item} className="space-y-6">
          <h2 className={`text-2xl font-bold ${textPrimary}`}>Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.customerGrowth && (
              <div className={`${cardBg} rounded-xl p-6 border border-transparent`}>
                <h3 className={`font-bold ${textPrimary} mb-2`}>Customer growth (30d)</h3>
                <p className={textSecondary}>
                  New: {stats.customerGrowth.newCustomersLast30Days} · Returning with measurements: {stats.customerGrowth.returningCustomersWithMeasurements}
                </p>
              </div>
            )}
            {stats.measurementTrends && (stats.measurementTrends.avg_chest != null || stats.measurementTrends.avg_waist != null || stats.measurementTrends.avg_neck != null) && (
              <div className={`${cardBg} rounded-xl p-6 border border-transparent`}>
                <h3 className={`font-bold ${textPrimary} mb-2`}>Avg measurements (30d)</h3>
                <p className={textSecondary}>
                  {stats.measurementTrends.avg_chest != null && `Chest: ${Number(stats.measurementTrends.avg_chest).toFixed(1)} · `}
                  {stats.measurementTrends.avg_waist != null && `Waist: ${Number(stats.measurementTrends.avg_waist).toFixed(1)} · `}
                  {stats.measurementTrends.avg_neck != null && `Neck: ${Number(stats.measurementTrends.avg_neck).toFixed(1)}`}
                </p>
              </div>
            )}
            {stats.tailorStats && stats.tailorStats.length > 0 && (
              <div className={`${cardBg} rounded-xl p-6 border border-transparent md:col-span-2`}>
                <h3 className={`font-bold ${textPrimary} mb-2`}>Tailor activity</h3>
                <ul className="space-y-1">
                  {stats.tailorStats.slice(0, 5).map((t) => (
                    <li key={t.id} className={textSecondary}>
                      {t.name}: {t.measurements_count} measurements, {t.updates_count} updates
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Dashboard;
