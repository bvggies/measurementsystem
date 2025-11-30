import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`relative p-2.5 rounded-lg transition-all duration-200 ${
        theme === 'dark'
          ? 'bg-primary-gold/20 hover:bg-primary-gold/30 text-primary-gold'
          : 'bg-primary-navy/10 hover:bg-primary-navy/20 text-primary-navy'
      }`}
      aria-label="Toggle theme"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.3 }}
        className="text-xl"
      >
        {theme === 'dark' ? '🌙' : '☀️'}
      </motion.div>
      <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        {theme === 'dark' ? 'Light' : 'Dark'}
      </span>
    </motion.button>
  );
};

export default ThemeToggle;

