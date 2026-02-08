import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';

interface ShareableToken {
  token: string;
  shareUrl: string;
  expiresAt: string | null;
  created_at: string;
}

const AdminPanel: React.FC = () => {
  const { theme } = useTheme();
  const [tokens, setTokens] = useState<ShareableToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [newToken, setNewToken] = useState<ShareableToken | null>(null);
  const [expiresInDays, setExpiresInDays] = useState('30');

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/shareable-tokens');
      setTokens(response.data.tokens || []);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const createToken = async () => {
    try {
      setCreating(true);
      const response = await axios.post('/api/shareable-tokens', {
        expiresInDays: parseInt(expiresInDays) || null,
      });
      setNewToken(response.data);
      await fetchTokens();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create token';
      alert(typeof errorMessage === 'string' ? errorMessage : 'Failed to create token');
      console.error('Create token error:', error);
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleBackupExport = async () => {
    try {
      setExporting(true);
      const response = await axios.post('/api/backup/export', {}, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitrack-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message || 'Export failed';
      alert(typeof msg === 'string' ? msg : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-32">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <h1 className={`text-3xl font-bold transition-colors duration-200 ${
          theme === 'dark' ? 'text-dark-text' : 'text-primary-navy'
        }`}>Admin Panel</h1>
        <button
          type="button"
          onClick={handleBackupExport}
          disabled={exporting}
          className="px-4 py-2 rounded-xl bg-primary-gold text-primary-navy hover:bg-primary-gold/90 disabled:opacity-50 transition-colors"
        >
          {exporting ? 'Exporting…' : 'Export backup (JSON)'}
        </button>
      </motion.div>

      {/* Create Shareable Form Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        data-aos="fade-up"
        className={`rounded-xl shadow-md p-6 transition-colors duration-200 ${
          theme === 'dark' ? 'bg-dark-surface' : 'bg-white'
        }`}
      >
        <h2 className={`text-xl font-bold mb-4 transition-colors duration-200 ${
          theme === 'dark' ? 'text-dark-text' : 'text-primary-navy'
        }`}>Shareable Measurement Form</h2>
        <p className={`mb-4 transition-colors duration-200 ${
          theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
        }`}>
          Create a shareable link that customers can use to submit their measurements remotely.
        </p>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>
              Expires in (days, leave empty for no expiration)
            </label>
            <input
              type="number"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold transition-colors duration-200 ${
                theme === 'dark' ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-gray-300'
              }`}
              placeholder="30"
            />
          </div>
          <button
            onClick={createToken}
            disabled={creating}
            className="px-6 py-2 bg-primary-navy text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Link'}
          </button>
        </div>

        {newToken && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mt-4 p-4 border rounded-lg transition-colors duration-200 ${
              theme === 'dark'
                ? 'bg-emerald/20 border-emerald/50'
                : 'bg-emerald bg-opacity-10 border-emerald'
            }`}
          >
            <p className="text-sm font-medium text-emerald mb-2">✅ Shareable link created!</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newToken.shareUrl}
                readOnly
                className={`flex-1 px-4 py-2 border rounded-lg text-sm transition-colors duration-200 ${
                  theme === 'dark'
                    ? 'bg-dark-bg border-dark-border text-dark-text'
                    : 'bg-white border-gray-300'
                }`}
              />
              <button
                onClick={() => copyToClipboard(newToken.shareUrl)}
                className="px-4 py-2 bg-primary-gold text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Copy
              </button>
            </div>
            {newToken.expiresAt && (
              <p className={`text-xs mt-2 transition-colors duration-200 ${
                theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
              }`}>
                Expires: {new Date(newToken.expiresAt).toLocaleDateString()}
              </p>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Existing Tokens */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        data-aos="fade-up"
        className={`rounded-xl shadow-md p-6 transition-colors duration-200 ${
          theme === 'dark' ? 'bg-dark-surface' : 'bg-white'
        }`}
      >
        <h2 className={`text-xl font-bold mb-4 transition-colors duration-200 ${
          theme === 'dark' ? 'text-dark-text' : 'text-primary-navy'
        }`}>Existing Shareable Links</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto ${
              theme === 'dark' ? 'border-primary-gold' : 'border-primary-navy'
            }`}></div>
          </div>
        ) : tokens.length === 0 ? (
          <p className={`text-center py-8 transition-colors duration-200 ${
            theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
          }`}>No shareable links created yet</p>
        ) : (
          <div className="space-y-4">
            {tokens.map((token) => (
              <div
                key={token.token}
                className={`p-4 border rounded-lg transition-colors duration-200 ${
                  theme === 'dark'
                    ? 'border-dark-border hover:bg-dark-bg'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium transition-colors duration-200 ${
                      theme === 'dark' ? 'text-dark-text' : 'text-primary-navy'
                    }`}>
                      {window.location.origin}/form/{token.token.substring(0, 20)}...
                    </p>
                    <p className={`text-xs mt-1 transition-colors duration-200 ${
                      theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
                    }`}>
                      Created: {new Date(token.created_at).toLocaleDateString()}
                      {token.expiresAt && ` | Expires: ${new Date(token.expiresAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/form/${token.token}`)}
                    className="px-4 py-2 bg-primary-gold text-white rounded-lg hover:bg-opacity-90 text-sm transition-colors"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminPanel;
