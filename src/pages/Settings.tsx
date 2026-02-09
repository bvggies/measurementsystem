import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Settings: React.FC = () => {
  const { settings, updateSettings, loading: settingsLoading } = useSettings();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [formData, setFormData] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState<string>(settings.logo);

  useEffect(() => {
    setFormData(settings);
    setLogoPreview(settings.logo);
  }, [settings]);

  const normalizeHex = (val: string): string => {
    let v = val.trim().replace(/^#/, '');
    if (/^[0-9A-Fa-f]{3}$/.test(v)) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
    if (/^[0-9A-Fa-f]{6}$/.test(v)) return '#' + v;
    return val;
  };

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('colors.')) {
      const colorKey = field.split('.')[1];
      const normalized = typeof value === 'string' && (value.startsWith('#') || /^[0-9A-Fa-f]{3,6}$/.test(value.trim())) ? normalizeHex(value) : value;
      setFormData({
        ...formData,
        colors: {
          ...(formData.colors || settings.colors),
          [colorKey]: normalized,
        },
      });
    } else {
      setFormData({
        ...formData,
        [field]: value,
      });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    try {
      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        handleChange('logo', base64String);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Ensure all required fields are present
      const settingsToSave = {
        ...formData,
        colors: (formData.colors && Object.keys(formData.colors).length > 0 ? formData.colors : settings.colors) || settings.colors,
      };
      await updateSettings(settingsToSave);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Settings save error:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to save settings';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const resetColors = () => {
    const defaultColors = {
      primaryNavy: '#0D2136',
      primaryGold: '#D4A643',
      steel: '#586577',
      softWhite: '#FAFAFA',
      emerald: '#00A68C',
      crimson: '#E43F52',
    };
    setFormData({
      ...formData,
      colors: defaultColors,
    });
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-navy"></div>
      </div>
    );
  }

  // Only admin can access system settings
  if (user?.role !== 'admin') {
    return (
      <div className="space-y-4">
        <div className="bg-crimson bg-opacity-10 border border-crimson rounded-lg p-4 text-crimson">
          Only administrators can access system settings.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-dark-text' : 'text-primary-navy'}`}>System Settings</h1>
          <p className="text-steel mt-1">Configure your system preferences</p>
        </div>
      </motion.div>

      {success && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-emerald bg-opacity-10 border border-emerald rounded-lg p-4 text-emerald"
        >
          {success}
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-crimson bg-opacity-10 border border-crimson rounded-lg p-4 text-crimson"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          data-aos="fade-up"
          className={`rounded-xl shadow-md p-6 border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200'}`}
        >
          <h2 className={`text-xl font-bold mb-4 border-b pb-2 ${isDark ? 'text-dark-text border-dark-border' : 'text-primary-navy border-steel-light'}`}>Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-steel'}`}>System Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold focus:outline-none ${isDark ? 'border-dark-border bg-dark-bg text-dark-text placeholder-gray-500' : 'border-gray-300'}`}
                placeholder="FitTrack"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-steel'}`}>Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold focus:outline-none ${isDark ? 'border-dark-border bg-dark-bg text-dark-text placeholder-gray-500' : 'border-gray-300'}`}
                placeholder="Tailoring Measurement System"
              />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-steel'}`}>Website Title</label>
              <input
                type="text"
                value={formData.websiteTitle}
                onChange={(e) => handleChange('websiteTitle', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold focus:outline-none ${isDark ? 'border-dark-border bg-dark-bg text-dark-text placeholder-gray-500' : 'border-gray-300'}`}
                placeholder="FitTrack - Tailoring Measurement System"
              />
            </div>
          </div>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          data-aos="fade-up"
          className={`rounded-xl shadow-md p-6 border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200'}`}
        >
          <h2 className={`text-xl font-bold mb-4 border-b pb-2 ${isDark ? 'text-dark-text border-dark-border' : 'text-primary-navy border-steel-light'}`}>Logo</h2>
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              <img
                src={logoPreview}
                alt="Logo Preview"
                className={`w-24 h-24 object-contain border rounded-lg p-2 ${isDark ? 'border-dark-border' : 'border-gray-300'}`}
                onError={() => setLogoPreview('/applogo.png')}
              />
            </div>
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-steel'}`}>Upload Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold focus:outline-none ${isDark ? 'border-dark-border bg-dark-bg text-dark-text' : 'border-gray-300'}`}
              />
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-steel'}`}>Recommended: 200x200px, PNG or SVG, max 2MB</p>
              <input
                type="text"
                value={formData.logo}
                onChange={(e) => {
                  handleChange('logo', e.target.value);
                  setLogoPreview(e.target.value);
                }}
                className={`w-full mt-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold focus:outline-none ${isDark ? 'border-dark-border bg-dark-bg text-dark-text placeholder-gray-500' : 'border-gray-300'}`}
                placeholder="Or enter logo URL"
              />
            </div>
          </div>
        </motion.div>

        {/* Color Scheme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          data-aos="fade-up"
          className={`rounded-xl shadow-md p-6 border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold border-b pb-2 flex-1 ${isDark ? 'text-dark-text border-dark-border' : 'text-primary-navy border-steel-light'}`}>Color Scheme</h2>
            <button
              type="button"
              onClick={resetColors}
              className="px-4 py-2 text-sm bg-steel text-white rounded-lg hover:bg-opacity-90"
            >
              Reset to Default
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(formData.colors || settings.colors).map(([key, value]) => (
              <div key={key}>
                <label className={`block text-sm font-medium mb-2 capitalize ${isDark ? 'text-gray-300' : 'text-steel'}`}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={/^#?[0-9A-Fa-f]{6}$/.test(String(value)) ? (String(value).startsWith('#') ? value : '#' + value) : '#0D2136'}
                    onChange={(e) => handleChange(`colors.${key}`, e.target.value)}
                    className="w-16 h-10 border border-gray-300 dark:border-dark-border rounded cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleChange(`colors.${key}`, e.target.value)}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold focus:outline-none ${isDark ? 'border-dark-border bg-dark-bg text-dark-text placeholder-gray-500' : 'border-gray-300'}`}
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          data-aos="fade-up"
          className={`rounded-xl shadow-md p-6 border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200'}`}
        >
          <h2 className={`text-xl font-bold mb-4 border-b pb-2 ${isDark ? 'text-dark-text border-dark-border' : 'text-primary-navy border-steel-light'}`}>Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-steel'}`}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold focus:outline-none ${isDark ? 'border-dark-border bg-dark-bg text-dark-text placeholder-gray-500' : 'border-gray-300'}`}
                placeholder="contact@example.com"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-steel'}`}>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold focus:outline-none ${isDark ? 'border-dark-border bg-dark-bg text-dark-text placeholder-gray-500' : 'border-gray-300'}`}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-steel'}`}>Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold focus:outline-none ${isDark ? 'border-dark-border bg-dark-bg text-dark-text placeholder-gray-500' : 'border-gray-300'}`}
                placeholder="123 Main St, City, State, ZIP"
              />
            </div>
          </div>
        </motion.div>

        {/* System Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          data-aos="fade-up"
          className={`rounded-xl shadow-md p-6 border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200'}`}
        >
          <h2 className={`text-xl font-bold mb-4 border-b pb-2 ${isDark ? 'text-dark-text border-dark-border' : 'text-primary-navy border-steel-light'}`}>System Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-steel'}`}>Default Unit</label>
              <select
                value={formData.defaultUnit}
                onChange={(e) => handleChange('defaultUnit', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold focus:outline-none ${isDark ? 'border-dark-border bg-dark-bg text-dark-text' : 'border-gray-300'}`}
              >
                <option value="cm">Centimeters (cm)</option>
                <option value="in">Inches (in)</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-steel'}`}>Currency</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold focus:outline-none ${isDark ? 'border-dark-border bg-dark-bg text-dark-text placeholder-gray-500' : 'border-gray-300'}`}
                placeholder="USD"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-steel'}`}>Timezone</label>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold focus:outline-none ${isDark ? 'border-dark-border bg-dark-bg text-dark-text placeholder-gray-500' : 'border-gray-300'}`}
                placeholder="UTC"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-steel'}`}>Date Format</label>
              <select
                value={formData.dateFormat}
                onChange={(e) => handleChange('dateFormat', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-gold focus:outline-none ${isDark ? 'border-dark-border bg-dark-bg text-dark-text' : 'border-gray-300'}`}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4 justify-end"
        >
          <button
            type="button"
            onClick={() => { setFormData(settings); setLogoPreview(settings.logo); setError(''); setSuccess(''); }}
            className={`px-6 py-3 border rounded-lg transition-colors ${isDark ? 'border-dark-border text-gray-300 hover:bg-dark-border/50' : 'border-gray-300 hover:bg-gray-50'}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-primary-navy text-white rounded-lg hover:bg-primary-navy/90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </motion.div>
      </form>
    </div>
  );
};

export default Settings;
