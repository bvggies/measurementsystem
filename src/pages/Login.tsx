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

  const inputBase = `w-full px-4 py-3.5 rounded-xl text-base transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-primary-gold/60 focus:ring-offset-2
    placeholder:text-gray-400 dark:placeholder:text-gray-500
    disabled:opacity-60 disabled:cursor-not-allowed`;
  const inputLight = 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-primary-gold';
  const inputDark = 'bg-dark-bg border border-dark-border text-dark-text focus:border-primary-gold';

  return (
    <div
      className={`min-h-screen flex transition-colors duration-300 ${
        isDark
          ? 'bg-dark-bg'
          : 'bg-gradient-to-br from-slate-50 via-white to-amber-50/30'
      }`}
      style={{
        paddingLeft: 'max(1rem, var(--safe-area-inset-left))',
        paddingRight: 'max(1rem, var(--safe-area-inset-right))',
        paddingTop: 'max(1rem, var(--safe-area-inset-top))',
        paddingBottom: 'max(1rem, var(--safe-area-inset-bottom))',
      }}
    >
      <a
        href="#login-form"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-gold focus:text-primary-navy focus:rounded-lg font-medium"
      >
        Skip to login form
      </a>

      {/* Left panel - branding (visible on lg+) */}
      <div
        className={`hidden lg:flex lg:w-[48%] xl:w-[52%] flex-col justify-center px-12 xl:px-20 ${
          isDark ? 'bg-gradient-to-br from-primary-navy to-slate-900' : 'bg-gradient-to-br from-primary-navy to-[#1a2d45]'
        }`}
      >
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative"
        >
          <div className="absolute -top-20 -left-10 w-72 h-72 bg-primary-gold/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <img src="/applogo.png" alt="" className="h-20 w-20 mb-8 opacity-95" />
            <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight mb-4">
              FitTrack
            </h1>
            <p className="text-lg text-white/80 max-w-sm leading-relaxed">
              Tailoring measurement system — manage customers, measurements, and fittings in one place.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/applogo.png" alt="FitTrack" className="h-14 w-14 mx-auto mb-3 opacity-90" />
            <h1 className={`text-2xl font-bold ${isDark ? 'text-dark-text' : 'text-primary-navy'}`}>
              FitTrack
            </h1>
          </div>

          <div
            className={`rounded-2xl sm:rounded-3xl shadow-xl border overflow-hidden ${
              isDark
                ? 'bg-dark-surface/95 border-dark-border backdrop-blur'
                : 'bg-white/95 border-gray-200/80 backdrop-blur'
            }`}
          >
            <div className="p-8 sm:p-10">
              <div className="mb-8">
                <h2 className={`text-xl sm:text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Welcome back
                </h2>
                <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Sign in to your account to continue
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl bg-crimson/10 border border-crimson/20 text-crimson text-sm flex items-start gap-3"
                >
                  <span className="shrink-0 mt-0.5" aria-hidden>⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}

              <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <label
                    htmlFor="email"
                    className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className={`${inputBase} ${isDark ? inputDark : inputLight}`}
                    placeholder="you@example.com"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label
                    htmlFor="password"
                    className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className={`${inputBase} ${isDark ? inputDark : inputLight}`}
                    placeholder="••••••••"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full py-3.5 px-4 font-semibold rounded-xl transition-all duration-200
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${isDark
                        ? 'bg-primary-gold text-primary-navy hover:bg-primary-gold/90 shadow-lg shadow-primary-gold/20'
                        : 'bg-primary-navy text-white hover:bg-primary-navy/90 shadow-lg shadow-primary-navy/20'
                      }`}
                  >
                    {loading ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      'Sign in'
                    )}
                  </motion.button>
                </motion.div>
              </form>

              <p
                className={`mt-6 text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
              >
                Demo: admin@example.com / admin123
              </p>
            </div>
          </div>

          <p className={`mt-6 text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            © FitTrack — Tailoring Measurement System
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
