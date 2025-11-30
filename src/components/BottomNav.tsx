import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { theme } = useTheme();

  const navItems = [
    { path: '/dashboard', icon: '📊', label: 'Home', roles: ['admin', 'manager', 'tailor', 'customer'] },
    { path: '/measurements', icon: '📏', label: 'Measure', roles: ['admin', 'manager', 'tailor'] },
    { path: '/customers', icon: '👥', label: 'Customers', roles: ['admin', 'manager', 'tailor'] },
    { path: '/orders', icon: '📦', label: 'Orders', roles: ['admin', 'manager', 'tailor'] },
    { path: '/calendar', icon: '📅', label: 'Calendar', roles: ['admin', 'manager', 'tailor'] },
    { path: '/import', icon: '📥', label: 'Import', roles: ['admin', 'manager'] },
    { path: '/activity-logs', icon: '📋', label: 'Activity', roles: ['admin', 'manager'] },
    { path: '/admin', icon: '🔐', label: 'Admin', roles: ['admin'] },
    { path: '/settings', icon: '⚙️', label: 'Settings', roles: ['admin', 'manager', 'tailor', 'customer'] },
  ].filter((item) => !item.roles || item.roles.includes(user?.role || ''));

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4"
    >
      <div
        className={`${
          theme === 'dark' 
            ? 'bg-dark-surface/90 border-dark-border' 
            : 'bg-white/90 border-white/20'
        } backdrop-blur-lg rounded-2xl shadow-2xl border w-full max-w-2xl`}
        style={{
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        }}
      >
        <div className="flex items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-2 sm:py-3 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex-shrink-0 min-w-[60px] sm:min-w-[70px]"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-2 sm:px-3 py-2 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-primary-navy text-white'
                      : theme === 'dark'
                      ? 'text-gray-300 hover:bg-dark-border/50'
                      : 'text-steel hover:bg-white/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                    <span className="text-base sm:text-lg">{item.icon}</span>
                    <span className="text-[9px] sm:text-[10px] font-medium truncate w-full text-center leading-tight">
                      {item.label}
                    </span>
                  </div>
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary-navy rounded-xl -z-10"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default BottomNav;

