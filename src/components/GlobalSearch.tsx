import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';

interface SearchResult {
  type: 'measurement' | 'customer' | 'order';
  id: string;
  title: string;
  subtitle: string;
  link: string;
}

const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        if (query.length >= 2) setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [query.length]);

  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/search?q=${encodeURIComponent(query)}`);
      setResults(response.data.results || []);
      setIsOpen(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (query.length >= 2) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [query, performSearch]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.link);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search customers, measurements, orders... (Ctrl+K)"
          className={`w-full px-4 py-2 pl-10 pr-20 rounded-xl focus:ring-2 focus:ring-primary-gold focus:border-transparent focus-visible:outline-none ${
            isDark ? 'border-dark-border bg-dark-bg text-dark-text placeholder-gray-500' : 'border-gray-300'
          }`}
        />
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-steel"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <kbd className="absolute right-10 top-2.5 hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-gray-100 dark:bg-dark-border text-xs text-gray-500 dark:text-gray-400">
          ⌘K
        </kbd>
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-gold"></div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute z-50 w-full mt-2 rounded-xl shadow-xl border max-h-96 overflow-y-auto ${
              isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200'
            }`}
          >
            {results.map((result) => (
              <div
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className={`px-4 py-3 cursor-pointer border-b last:border-b-0 ${
                  isDark ? 'hover:bg-dark-border/50 border-dark-border' : 'hover:bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className={`font-medium ${isDark ? 'text-dark-text' : 'text-primary-navy'}`}>{result.title}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-steel'}`}>{result.subtitle}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-dark-border text-gray-400' : 'bg-gray-100 text-steel'}`}>
                    {result.type}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearch;

