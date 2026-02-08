import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      let errorMessage = 'Login failed';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.message) {
        errorMessage = String(err.message);
      } else if (err?.toString && typeof err.toString === 'function') {
        errorMessage = err.toString();
      } else {
        errorMessage = JSON.stringify(err);
      }
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-200 ${
        isDark ? 'bg-dark-bg' : 'bg-gradient-to-br from-soft-white to-gray-100'
      }`}
    >
      <a
        href="#login-form"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-gold focus:text-primary-navy focus:rounded-lg"
      >
        Skip to login form
      </a>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`w-full max-w-md rounded-2xl shadow-xl p-8 border ${
          isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-100'
        }`}
      >
        <div className="text-center mb-8">
          <img src="/applogo.png" alt="FitTrack" className="h-16 w-16 mx-auto mb-4" />
          <h1 className={`text-3xl font-bold ${isDark ? 'text-dark-text' : 'text-primary-navy'} mb-2`}>
            FitTrack
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-steel'}>Sign in to your account</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 p-4 bg-crimson/10 border border-crimson/30 rounded-xl text-crimson text-sm"
          >
            {error}
          </motion.div>
        )}

        <form id="login-form" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary-gold focus:border-transparent focus-visible:outline-none transition ${
                isDark ? 'border-dark-border bg-dark-bg text-dark-text' : 'border-gray-300'
              }`}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary-gold focus:border-transparent focus-visible:outline-none transition ${
                isDark ? 'border-dark-border bg-dark-bg text-dark-text' : 'border-gray-300'
              }`}
              placeholder="••••••••"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3.5 px-4 bg-primary-navy text-white font-medium rounded-xl hover:bg-primary-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </motion.button>
        </form>

        <p className={`mt-6 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
          Demo: admin@example.com / admin123
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
