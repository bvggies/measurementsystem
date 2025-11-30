import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';

const Footer: React.FC = () => {
  const { settings } = useSettings();
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`mt-auto border-t ${
      theme === 'dark' 
        ? 'bg-dark-surface border-dark-border text-gray-300' 
        : 'bg-white border-gray-200 text-steel'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img src={settings.logo || "/applogo.png"} alt={settings.name || "FitTrack"} className="h-10 w-10" />
              <h3 className="text-xl font-bold text-primary-navy dark:text-white">
                {settings.name || 'FitTrack'}
              </h3>
            </div>
            <p className="text-sm mb-4 text-steel dark:text-gray-400">
              {settings.tagline || 'Professional Tailoring Measurement & Order Management System'}
            </p>
            {settings.address && (
              <p className="text-sm text-steel dark:text-gray-400 mb-2">
                📍 {settings.address}
              </p>
            )}
            <div className="flex flex-col space-y-1 text-sm text-steel dark:text-gray-400">
              {settings.phone && (
                <p>📞 {settings.phone}</p>
              )}
              {settings.email && (
                <p>✉️ {settings.email}</p>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-primary-navy dark:text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/dashboard" className="hover:text-primary-gold dark:hover:text-primary-gold transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/measurements" className="hover:text-primary-gold dark:hover:text-primary-gold transition-colors">
                  Measurements
                </Link>
              </li>
              <li>
                <Link to="/customers" className="hover:text-primary-gold dark:hover:text-primary-gold transition-colors">
                  Customers
                </Link>
              </li>
              <li>
                <Link to="/calendar" className="hover:text-primary-gold dark:hover:text-primary-gold transition-colors">
                  Calendar
                </Link>
              </li>
              <li>
                <Link to="/settings" className="hover:text-primary-gold dark:hover:text-primary-gold transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-semibold text-primary-navy dark:text-white mb-4">Features</h4>
            <ul className="space-y-2 text-sm text-steel dark:text-gray-400">
              <li>📏 Measurement Management</li>
              <li>👥 Customer Database</li>
              <li>📅 Fitting Scheduling</li>
              <li>📊 Analytics & Reports</li>
              <li>📥 Import/Export</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`mt-8 pt-6 border-t ${
          theme === 'dark' ? 'border-dark-border' : 'border-gray-200'
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm text-steel dark:text-gray-400">
              © {currentYear} {settings.name || 'FitTrack'}. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <span className="text-steel dark:text-gray-400">Made with ❤️ for Tailors</span>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-emerald rounded-full animate-pulse"></span>
                <span className="text-emerald text-xs">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

