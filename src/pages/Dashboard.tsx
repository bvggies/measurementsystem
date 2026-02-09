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
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

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
    { title: 'Customers', value: stats?.totalCustomers ?? 0, icon: '👥', accent: 'primary-navy', link: '/customers' },
    { title: 'Measurements', value: stats?.totalMeasurements ?? 0, icon: '📏', accent: 'emerald', link: '/measurements' },
    { title: 'New (30d)', value: stats?.newEntries ?? 0, icon: '✨', accent: 'primary-gold', link: '/measurements' },
    { title: 'Pending fittings', value: stats?.pendingFittings ?? 0, icon: '📅', accent: 'steel', link: '/calendar' },
  ];

  const quickActions = [
    { name: 'New Measurement', href: '/measurements/new', icon: '➕', roles: ['admin', 'tailor'] },
    { name: 'Import Data', href: '/import', icon: '📥', roles: ['admin'] },
    { name: 'Calendar', href: '/calendar', icon: '📅', roles: ['admin', 'tailor'] },
    { name: 'Orders', href: '/orders', icon: '📦', roles: ['admin', 'tailor'] },
  ].filter((action) => user && action.roles.includes(user.role));

  const cardBg = isDark ? 'bg-dark-surface' : 'bg-white';
  const cardBorder = isDark ? 'border border-dark-border' : 'border border-gray-200/80';
  const textPrimary = isDark ? 'text-dark-text' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto" id="main-content">
        <div>
          <div className="h-8 w-32 bg-gray-200 dark:bg-dark-border rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-48 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div>
          <div className="h-6 w-28 bg-gray-200 dark:bg-dark-border rounded animate-pulse mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`${cardBg} ${cardBorder} rounded-2xl p-6`}>
                <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-dark-border animate-pulse mb-3" />
                <div className="h-4 w-20 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8 sm:space-y-10 max-w-6xl mx-auto"
      id="main-content"
      initial="hidden"
      animate="show"
      variants={container}
    >
      {/* Welcome strip */}
      <motion.div
        variants={item}
        className={`relative rounded-2xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-primary-navy/90 to-dark-surface' : 'bg-gradient-to-br from-primary-navy to-primary-navy/95'}`}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(212,166,67,0.3) 0%, transparent 50%)' }} />
        <div className="relative px-5 sm:px-8 py-6 sm:py-8">
          <div className="h-0.5 w-12 rounded-full bg-primary-gold mb-5" aria-hidden />
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-dark-text' : 'text-white'}`}>
            {getGreeting()}, {user?.name?.split(' ')[0] || user?.name || 'there'}
          </h1>
          <p className={`mt-1 text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-white/80'}`}>
            Here’s what’s happening with your measurements and fittings.
          </p>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5" variants={container}>
        {statCards.map((card) => (
          <motion.div key={card.title} variants={item}>
            <Link
              to={card.link}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-dark-bg rounded-2xl"
            >
              <div
                className={`${cardBg} ${cardBorder} rounded-2xl p-5 sm:p-6 h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 min-h-[120px] sm:min-h-0 flex flex-col`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs sm:text-sm font-medium uppercase tracking-wider ${textMuted}`}>
                      {card.title}
                    </p>
                    <p className={`text-2xl sm:text-3xl font-bold tabular-nums mt-1 ${textPrimary}`}>
                      {card.value.toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 bg-${card.accent}/10 border border-${card.accent}/20`}
                    style={
                      card.accent === 'primary-navy'
                        ? { backgroundColor: 'rgba(13, 33, 54, 0.12)', borderColor: 'rgba(13, 33, 54, 0.25)' }
                        : card.accent === 'primary-gold'
                        ? { backgroundColor: 'rgba(212, 166, 67, 0.15)', borderColor: 'rgba(212, 166, 67, 0.3)' }
                        : card.accent === 'emerald'
                        ? { backgroundColor: 'rgba(0, 166, 140, 0.12)', borderColor: 'rgba(0, 166, 140, 0.25)' }
                        : { backgroundColor: 'rgba(88, 101, 119, 0.12)', borderColor: 'rgba(88, 101, 119, 0.25)' }
                    }
                  >
                    {card.icon}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={item}>
        <h2 className={`text-lg font-semibold ${textPrimary} mb-3 sm:mb-4`}>Quick actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <motion.div key={action.name} variants={item}>
              <Link
                to={action.href}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 rounded-2xl"
              >
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className={`${cardBg} ${cardBorder} rounded-2xl p-4 sm:p-5 cursor-pointer text-center transition-all duration-200 hover:shadow-md hover:border-primary-gold/40 min-h-[100px] sm:min-h-[110px] flex flex-col items-center justify-center gap-2`}
                >
                  <span className="text-3xl sm:text-4xl" aria-hidden>{action.icon}</span>
                  <span className={`font-medium text-sm sm:text-base ${textPrimary} line-clamp-2`}>
                    {action.name}
                  </span>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent activity + Insights */}
      <div className={`grid gap-6 sm:gap-8 ${showInsights && (stats?.tailorStats?.length || stats?.customerGrowth || stats?.measurementTrends) ? 'lg:grid-cols-3' : ''}`}>
        <motion.div variants={item} className={showInsights && (stats?.tailorStats?.length || stats?.customerGrowth || stats?.measurementTrends) ? 'lg:col-span-2' : ''}>
          <div className={`${cardBg} ${cardBorder} rounded-2xl p-5 sm:p-6 h-full`}>
            <h2 className={`text-lg font-semibold ${textPrimary} mb-1`}>Recent activity</h2>
            <p className={`text-sm ${textMuted} mb-4`}>Last 7 days</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl sm:text-5xl font-bold tabular-nums ${textPrimary}`}>
                {stats?.recentActivity ?? 0}
              </span>
              <span className={`text-sm ${textMuted}`}>new measurements</span>
            </div>
            <div className="mt-4 h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-dark-border">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, (stats?.recentActivity ?? 0) * 12)}%`,
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-primary-gold"
              />
            </div>
          </div>
        </motion.div>

        {showInsights && (stats?.tailorStats?.length || stats?.customerGrowth || stats?.measurementTrends) && (
          <motion.div variants={item} className="space-y-4">
            <h2 className={`text-lg font-semibold ${textPrimary}`}>Insights</h2>
            <div className="space-y-4">
              {stats.customerGrowth && (
                <div className={`${cardBg} ${cardBorder} rounded-2xl p-4 sm:p-5 border-l-4 border-emerald`}>
                  <h3 className={`font-semibold text-sm ${textPrimary} mb-1`}>Customer growth (30d)</h3>
                  <p className={`text-sm ${textMuted}`}>
                    <span className="font-medium text-emerald">{stats.customerGrowth.newCustomersLast30Days}</span> new
                    · <span className="font-medium">{stats.customerGrowth.returningCustomersWithMeasurements}</span> returning with measurements
                  </p>
                </div>
              )}
              {stats.measurementTrends &&
                (stats.measurementTrends.avg_chest != null ||
                  stats.measurementTrends.avg_waist != null ||
                  stats.measurementTrends.avg_neck != null) && (
                  <div className={`${cardBg} ${cardBorder} rounded-2xl p-4 sm:p-5 border-l-4 border-primary-gold`}>
                    <h3 className={`font-semibold text-sm ${textPrimary} mb-1`}>Avg measurements (30d)</h3>
                    <p className={`text-sm ${textMuted}`}>
                      {stats.measurementTrends.avg_chest != null && (
                        <span>Chest {Number(stats.measurementTrends.avg_chest).toFixed(1)}</span>
                      )}
                      {stats.measurementTrends.avg_chest != null && stats.measurementTrends.avg_waist != null && ' · '}
                      {stats.measurementTrends.avg_waist != null && (
                        <span>Waist {Number(stats.measurementTrends.avg_waist).toFixed(1)}</span>
                      )}
                      {(stats.measurementTrends.avg_chest != null || stats.measurementTrends.avg_waist != null) &&
                        stats.measurementTrends.avg_neck != null &&
                        ' · '}
                      {stats.measurementTrends.avg_neck != null && (
                        <span>Neck {Number(stats.measurementTrends.avg_neck).toFixed(1)}</span>
                      )}
                    </p>
                  </div>
                )}
              {stats.tailorStats && stats.tailorStats.length > 0 && (
                <div className={`${cardBg} ${cardBorder} rounded-2xl p-4 sm:p-5 border-l-4 border-primary-navy dark:border-primary-gold`}>
                  <h3 className={`font-semibold text-sm ${textPrimary} mb-2`}>Tailor activity</h3>
                  <ul className="space-y-1.5 text-sm">
                    {stats.tailorStats.slice(0, 5).map((t) => (
                      <li key={t.id} className={textMuted}>
                        <span className={textPrimary}>{t.name}</span>: {t.measurements_count} measurements, {t.updates_count} updates
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Dashboard;
