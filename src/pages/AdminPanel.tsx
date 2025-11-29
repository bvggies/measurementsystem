import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface ShareableToken {
  token: string;
  shareUrl: string;
  expiresAt: string | null;
  created_at: string;
}

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<ShareableToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
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
      alert(error.response?.data?.error || 'Failed to create token');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold text-primary-navy">Admin Panel</h1>
      </motion.div>

      {/* Create Shareable Form Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        data-aos="fade-up"
        className="bg-white rounded-xl shadow-md p-6"
      >
        <h2 className="text-xl font-bold text-primary-navy mb-4">Shareable Measurement Form</h2>
        <p className="text-steel mb-4">
          Create a shareable link that customers can use to submit their measurements remotely.
        </p>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-steel mb-2">
              Expires in (days, leave empty for no expiration)
            </label>
            <input
              type="number"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-gold"
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
            className="mt-4 p-4 bg-emerald bg-opacity-10 border border-emerald rounded-lg"
          >
            <p className="text-sm font-medium text-emerald mb-2">✅ Shareable link created!</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newToken.shareUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={() => copyToClipboard(newToken.shareUrl)}
                className="px-4 py-2 bg-primary-gold text-white rounded-lg hover:bg-opacity-90"
              >
                Copy
              </button>
            </div>
            {newToken.expiresAt && (
              <p className="text-xs text-steel mt-2">
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
        className="bg-white rounded-xl shadow-md p-6"
      >
        <h2 className="text-xl font-bold text-primary-navy mb-4">Existing Shareable Links</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-navy mx-auto"></div>
          </div>
        ) : tokens.length === 0 ? (
          <p className="text-steel text-center py-8">No shareable links created yet</p>
        ) : (
          <div className="space-y-4">
            {tokens.map((token) => (
              <div
                key={token.token}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary-navy">
                      {window.location.origin}/form/{token.token.substring(0, 20)}...
                    </p>
                    <p className="text-xs text-steel mt-1">
                      Created: {new Date(token.created_at).toLocaleDateString()}
                      {token.expiresAt && ` | Expires: ${new Date(token.expiresAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/form/${token.token}`)}
                    className="px-4 py-2 bg-primary-gold text-white rounded-lg hover:bg-opacity-90 text-sm"
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
