import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeContext';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  createdAt: number;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (message: string, type?: ToastType, duration?: number) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;
function generateId() {
  return `toast-${Date.now()}-${++toastId}`;
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { theme } = useTheme();

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => setToasts([]), []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000): string => {
      const id = generateId();
      const toastEntry: Toast = {
        id,
        message,
        type,
        duration: type === 'loading' ? undefined : duration,
        createdAt: Date.now(),
      };
      setToasts((prev) => [...prev, toastEntry]);

      if (type !== 'loading' && duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} theme={theme} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  theme: 'light' | 'dark';
}

function ToastContainer({ toasts, onDismiss, theme }: ToastContainerProps) {
  const isDark = theme === 'dark';

  return (
    <div
      className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`pointer-events-auto rounded-xl shadow-lg border px-4 py-3 flex items-center gap-3 ${
              isDark
                ? 'bg-dark-surface border-dark-border'
                : 'bg-white border-gray-200'
            }`}
          >
            <ToastIcon type={t.type} />
            <p
              className={`flex-1 text-sm font-medium ${
                isDark ? 'text-dark-text' : 'text-gray-900'
              }`}
            >
              {t.message}
            </p>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className={`p-1 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-dark-border text-gray-400'
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'loading') {
    return (
      <div className="flex-shrink-0 w-6 h-6 border-2 border-primary-gold border-t-transparent rounded-full animate-spin" />
    );
  }
  if (type === 'success') {
    return (
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald/20 flex items-center justify-center">
        <svg className="w-5 h-5 text-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (type === 'error') {
    return (
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-crimson/20 flex items-center justify-center">
        <svg className="w-5 h-5 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-navy/20 flex items-center justify-center">
      <svg className="w-5 h-5 text-primary-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
