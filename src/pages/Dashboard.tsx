import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  totalCustomers: number;
  totalMeasurements: number;
  newEntries: number;
  pendingFittings: number;
  recentActivity: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/reports/summary');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Customers',
      value: stats?.totalCustomers || 0,
      icon: '👥',
      color: 'bg-blue-500',
      link: '/customers',
    },
    {
      title: 'Total Measurements',
      value: stats?.totalMeasurements || 0,
      icon: '📏',
      color: 'bg-green-500',
      link: '/measurements',
    },
    {
      title: 'New Entries (30d)',
      value: stats?.newEntries || 0,
      icon: '✨',
      color: 'bg-purple-500',
      link: '/measurements',
    },
    {
      title: 'Pending Fittings',
      value: stats?.pendingFittings || 0,
      icon: '📅',
      color: 'bg-orange-500',
      link: '/calendar',
    },
  ];

  const quickActions = [
    { name: 'New Measurement', href: '/measurements/new', icon: '➕', roles: ['admin', 'tailor'] },
    { name: 'Import Data', href: '/import', icon: '📥', roles: ['admin'] },
    { name: 'View Calendar', href: '/calendar', icon: '📅', roles: ['admin', 'tailor'] },
    { name: 'Manage Orders', href: '/orders', icon: '📦', roles: ['admin', 'tailor'] },
  ].filter((action) => user && action.roles.includes(user.role));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            data-aos="fade-up"
            data-aos-delay={index * 100}
          >
            <Link to={card.link}>
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  </div>
                  <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        data-aos="fade-up"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.name} to={action.href}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer text-center"
              >
                <div className="text-4xl mb-3">{action.icon}</div>
                <p className="font-medium text-gray-900">{action.name}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        data-aos="fade-up"
        className="bg-white rounded-xl shadow-md p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <p className="text-gray-600">
          {stats?.recentActivity || 0} new measurements in the last 7 days
        </p>
      </motion.div>
    </div>
  );
};

export default Dashboard;

