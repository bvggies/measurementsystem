import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from '../utils/api';

interface SystemSettings {
  name: string;
  tagline: string;
  websiteTitle: string;
  logo: string;
  colors: {
    primaryNavy: string;
    primaryGold: string;
    steel: string;
    softWhite: string;
    emerald: string;
    crimson: string;
  };
  email: string;
  phone: string;
  address: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  defaultUnit: 'cm' | 'in';
}

interface SettingsContextType {
  settings: SystemSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: SystemSettings = {
  name: 'FitTrack',
  tagline: 'Tailoring Measurement System',
  websiteTitle: 'FitTrack - Tailoring Measurement System',
  logo: '/applogo.png',
  colors: {
    primaryNavy: '#0D2136',
    primaryGold: '#D4A643',
    steel: '#586577',
    softWhite: '#FAFAFA',
    emerald: '#00A68C',
    crimson: '#E43F52',
  },
  email: '',
  phone: '',
  address: '',
  currency: 'USD',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  defaultUnit: 'cm',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings');
      if (response.data) {
        setSettings({ ...defaultSettings, ...response.data });
      }
    } catch (error: any) {
      console.error('Failed to fetch settings:', error);
      console.error('Error details:', error.response?.data);
      // Use default settings if API fails
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      const response = await axios.put('/api/settings', updated);
      // Use response data if available, otherwise use updated
      const finalSettings = response.data?.settings || updated;
      setSettings(finalSettings);
      
      // Update document title
      if (newSettings.websiteTitle) {
        document.title = newSettings.websiteTitle;
      }
      
      // Update CSS variables for colors
      if (newSettings.colors) {
        const root = document.documentElement;
        root.style.setProperty('--color-primary-navy', newSettings.colors.primaryNavy);
        root.style.setProperty('--color-primary-gold', newSettings.colors.primaryGold);
        root.style.setProperty('--color-steel', newSettings.colors.steel);
        root.style.setProperty('--color-soft-white', newSettings.colors.softWhite);
        root.style.setProperty('--color-emerald', newSettings.colors.emerald);
        root.style.setProperty('--color-crimson', newSettings.colors.crimson);
      }
    } catch (error: any) {
      console.error('Failed to update settings:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update settings';
      throw new Error(errorMessage);
    }
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

