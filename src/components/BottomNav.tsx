import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard', roles: ['admin', 'manager', 'tailor'] },
    { path: '/measurements', icon: '📏', label: 'Measurements', roles: ['admin', 'manager', 'tailor'] },
    { path: '/customers', icon: '👥', label: 'Customers', roles: ['admin', 'manager', 'tailor'] },
    { path: '/calendar', icon: '📅', label: 'Calendar', roles: ['admin', 'manager', 'tailor'] },
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
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4"
    >
      <div
        className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 mx-auto"
        style={{
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        }}
      >
        <div className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex-1 min-w-0"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-2 sm:px-3 md:px-4 py-2 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-primary-navy text-white'
                      : 'text-steel hover:bg-white/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                    <span className="text-lg sm:text-xl">{item.icon}</span>
                    <span className="text-[10px] sm:text-xs font-medium truncate w-full text-center">
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

