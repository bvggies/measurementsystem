import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import GlobalSearch from './GlobalSearch';
import BottomNav from './BottomNav';
import InstallButton from './InstallButton';
import ThemeToggle from './ThemeToggle';
import NotificationsDropdown from './NotificationsDropdown';
import Footer from './Footer';
import TailoringBackground from './TailoringBackground';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Scroll to top when navigating to a new page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
  const { settings } = useSettings();
  const appName = settings.name || 'FitTrack';
  const appLogo = settings.logo || '/applogo.png';

  return (
    <div className={`min-h-screen transition-colors duration-200 relative ${
      theme === 'dark' ? 'bg-dark-bg text-dark-text' : 'bg-gray-50'
    }`}>
      <TailoringBackground />
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
          <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-dark-border' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-2">
              <img src={appLogo} alt={appName} className="h-8 w-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = '/applogo.png'; }} />
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-dark-text' : 'text-primary-navy'}`}>{appName}</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-dark-border text-gray-300' : 'hover:bg-gray-100'}`}
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
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-[0.98] ${
                  location.pathname === item.href
                    ? 'bg-primary-navy text-white dark:bg-primary-gold dark:text-primary-navy'
                    : theme === 'dark'
                    ? 'text-gray-300 hover:bg-dark-border/50'
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

      {/* Desktop sidebar - modernized, visible only on lg+ */}
      <aside
        className={`hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64 lg:flex-col lg:border-r ${
          theme === 'dark' ? 'lg:bg-dark-surface lg:border-dark-border' : 'lg:bg-white lg:border-gray-200'
        }`}
        aria-label="Main navigation"
      >
        <div className={`flex items-center p-4 border-b shrink-0 ${theme === 'dark' ? 'border-dark-border' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <img src={appLogo} alt={appName} className="h-8 w-8 shrink-0 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = '/applogo.png'; }} />
            <span className="text-lg font-bold text-primary-navy dark:text-dark-text truncate">{appName}</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                  isActive
                    ? 'bg-primary-navy text-white dark:bg-primary-gold dark:text-primary-navy'
                    : theme === 'dark'
                    ? 'text-gray-300 hover:bg-dark-border/50'
                    : 'text-steel hover:bg-gray-100'
                } ${isActive ? 'ring-2 ring-primary-gold/30' : ''}`}
              >
                <span className="text-lg shrink-0">{item.icon}</span>
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className={`p-4 border-t shrink-0 ${theme === 'dark' ? 'border-dark-border' : 'border-gray-200'}`}>
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
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen relative z-10">
        {/* Top bar - compact on mobile with safe area */}
        <header
          className={`sticky top-0 z-30 shadow-sm ${
            theme === 'dark' ? 'bg-dark-surface border-b border-dark-border' : 'bg-white'
          }`}
          style={{ paddingTop: 'var(--safe-area-inset-top)' }}
        >
          <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 -ml-1 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-border touch-ignore min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Open menu"
            >
              <span className="text-xl">☰</span>
            </button>
            <div className="flex-1 min-w-0 max-w-2xl hidden md:block md:mx-4">
              <GlobalSearch />
            </div>
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              <NotificationsDropdown />
              <div className="group relative">
                <ThemeToggle />
              </div>
              <div className="hidden sm:block">
                <InstallButton />
              </div>
              <div className="hidden lg:block">
                <p className={`font-medium text-sm truncate max-w-[120px] transition-colors duration-200 ${
                  theme === 'dark' ? 'text-dark-text' : 'text-primary-navy'
                }`}>{user?.name}</p>
                <p className={`text-xs capitalize truncate transition-colors duration-200 ${
                  theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
                }`}>{user?.role}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="lg:hidden px-3 py-2.5 text-sm font-medium text-white bg-crimson rounded-xl hover:bg-crimson/90 transition-colors min-h-[44px]"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content - large bottom padding on mobile so content scrolls above bottom nav; desktop uses sidebar so less padding */}
        <main
          id="main-content"
          className="flex-1 p-4 sm:p-6 lg:p-8 tabIndex={-1} overflow-x-hidden main-content-padding"
        >
          <Outlet />
        </main>

        {/* Footer - hidden on small screens to maximize content */}
        <div className="hidden md:block">
          <Footer />
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          role="button"
          tabIndex={0}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}

      {/* Floating Bottom Navigation (mobile/tablet) */}
      <BottomNav />
    </div>
  );
};

export default Layout;

