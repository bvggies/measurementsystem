import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import GlobalSearch from './GlobalSearch';
import BottomNav from './BottomNav';
import InstallButton from './InstallButton';
import ThemeToggle from './ThemeToggle';
import NotificationsDropdown from './NotificationsDropdown';
import Footer from './Footer';

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
    { name: 'Approval Queue', href: '/approval', icon: '✅', roles: ['admin', 'manager', 'tailor'] },
    { name: 'Tasks', href: '/tasks', icon: '📌', roles: ['admin', 'manager', 'tailor'] },
    { name: 'Reminders', href: '/reminders', icon: '⏰', roles: ['admin', 'manager', 'tailor'] },
    { name: 'Expiry Rules', href: '/expiry-rules', icon: '📆', roles: ['admin', 'manager'] },
    { name: 'Compare', href: '/measurements/compare', icon: '↔️', roles: ['admin', 'manager', 'tailor'] },
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary-gold focus:text-primary-navy focus:rounded-lg font-medium"
      >
        Skip to main content
      </a>
      {/* Mobile sidebar */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        className={`fixed inset-y-0 left-0 z-50 w-64 shadow-lg lg:hidden ${
          theme === 'dark' ? 'bg-dark-surface' : 'bg-white'
        }`}
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
      <div className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64 lg:shadow-lg ${
        theme === 'dark' ? 'lg:bg-dark-surface' : 'lg:bg-white'
      }`}>
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
          <div className={`p-4 border-t ${theme === 'dark' ? 'border-dark-border' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`font-medium ${theme === 'dark' ? 'text-dark-text' : 'text-gray-900'}`}>{user?.name}</p>
                <p className={`text-sm capitalize ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-crimson rounded-xl hover:bg-crimson/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className={`sticky top-0 z-30 shadow-sm ${
          theme === 'dark' ? 'bg-dark-surface border-b border-dark-border' : 'bg-white'
        }`}>
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
            <div className="flex items-center space-x-3">
              <NotificationsDropdown />
              <div className="group relative">
                <ThemeToggle />
              </div>
              <InstallButton />
              <div className="hidden lg:block">
                <p className={`font-medium transition-colors duration-200 ${
                  theme === 'dark' ? 'text-dark-text' : 'text-primary-navy'
                }`}>{user?.name}</p>
                <p className={`text-sm capitalize transition-colors duration-200 ${
                  theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
                }`}>{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="lg:hidden px-4 py-2 text-sm font-medium text-white bg-crimson rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="p-4 lg:p-8 pb-32 sm:pb-36" tabIndex={-1}>
          <Outlet />
        </main>
        
        {/* Footer */}
        <Footer />
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

