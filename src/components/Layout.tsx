import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import GlobalSearch from './GlobalSearch';
import BottomNav from './BottomNav';
import InstallButton from './InstallButton';
import ThemeToggle from './ThemeToggle';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', roles: ['admin', 'manager', 'tailor', 'customer'] },
    { name: 'Measurements', href: '/measurements', icon: '📏', roles: ['admin', 'manager', 'tailor'] },
    { name: 'Import', href: '/import', icon: '📥', roles: ['admin', 'manager'] },
    { name: 'Customers', href: '/customers', icon: '👥', roles: ['admin', 'manager', 'tailor'] },
    { name: 'Orders', href: '/orders', icon: '📦', roles: ['admin', 'manager', 'tailor'] },
    { name: 'Calendar', href: '/calendar', icon: '📅', roles: ['admin', 'manager', 'tailor'] },
    { name: 'Activity Logs', href: '/activity-logs', icon: '📋', roles: ['admin', 'manager'] },
    { name: 'Settings', href: '/settings', icon: '⚙️', roles: ['admin', 'manager', 'tailor', 'customer'] },
    { name: 'Admin', href: '/admin', icon: '🔐', roles: ['admin'] },
  ].filter((item) => user && item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { theme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' ? 'bg-dark-bg text-dark-text' : 'bg-gray-50'
    }`}>
      {/* Mobile sidebar */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg lg:hidden"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <img src="/applogo.png" alt="FitTrack" className="h-8 w-8" />
              <h1 className="text-xl font-bold text-primary-navy">FitTrack</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.href
                    ? 'bg-primary-navy text-white'
                    : 'text-steel hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </motion.div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64 lg:bg-white lg:shadow-lg">
        <div className="flex flex-col h-full">
          <div className="flex items-center p-4 border-b">
            <div className="flex items-center space-x-2">
              <img src="/applogo.png" alt="FitTrack" className="h-8 w-8" />
              <h1 className="text-xl font-bold text-primary-navy">FitTrack</h1>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.href
                    ? 'bg-primary-navy text-white'
                    : 'text-steel hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-crimson rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              ☰
            </button>
            <div className="flex-1 max-w-2xl hidden md:block">
              <GlobalSearch />
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden lg:block">
                <p className="font-medium text-primary-navy">{user?.name}</p>
                <p className="text-sm text-steel capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="lg:hidden px-4 py-2 text-sm font-medium text-white bg-crimson rounded-lg hover:bg-opacity-90"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8 pb-32 sm:pb-36">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Floating Bottom Navigation */}
      <BottomNav />
      
      {/* PWA Install Button */}
      <InstallButton />
    </div>
  );
};

export default Layout;

