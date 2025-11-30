import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { format } from 'date-fns';
import PrintMeasurement from '../components/PrintMeasurement';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';

const MeasurementView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { theme } = useTheme();
  const [measurement, setMeasurement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMeasurement = useCallback(async () => {
    if (!id) {
      setError('Invalid measurement ID');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`/api/measurements/${id}`);
      if (response.data) {
        setMeasurement(response.data);
      } else {
        setError('Measurement data is empty');
      }
                  } catch (err: any) {
                    let errorMsg = 'Failed to load measurement';
                    if (err.response?.data) {
                      const data = err.response.data;
                      if (typeof data.error === 'string') {
                        errorMsg = data.error;
                      } else if (typeof data.message === 'string') {
                        errorMsg = data.message;
                      }
                    } else if (err.message && typeof err.message === 'string') {
                      errorMsg = err.message;
                    }
                    setError(errorMsg);
                    console.error('Failed to fetch measurement:', {
                      error: err,
                      response: err.response,
                      id,
                    });
                  } finally {
                    setLoading(false);
                  }
  }, [id]);

  useEffect(() => {
    fetchMeasurement();
  }, [fetchMeasurement]);

  const handlePrint = () => {
    if (!measurement) return;
    
    // Set document title for print - this will be used as the suggested filename when saving as PDF
    const systemName = settings.name || 'FitTrack';
    const customerName = measurement?.customer_name || 'Measurement';
    const entryId = measurement?.entry_id || '';
    const sanitizedCustomerName = customerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const sanitizedEntryId = entryId.replace(/[^a-z0-9]/gi, '_');
    const sanitizedSystemName = systemName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    const originalTitle = document.title;
    // Set title that will be used as PDF filename (browsers use document.title as default filename)
    document.title = `${sanitizedSystemName}_${sanitizedCustomerName}_${sanitizedEntryId}`;
    
    // Trigger print
    window.print();
    
    // Restore original title after print dialog
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 pb-32">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
          theme === 'dark' ? 'border-primary-gold' : 'border-primary-navy'
        }`}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 pb-32">
        <div className={`bg-crimson bg-opacity-10 border border-crimson rounded-lg p-4 text-crimson transition-colors duration-200 ${
          theme === 'dark' ? 'bg-crimson/20' : ''
        }`}>
          {error || 'Measurement not found'}
        </div>
        <Link to="/measurements" className={`hover:underline transition-colors duration-200 ${
          theme === 'dark' ? 'text-primary-gold' : 'text-primary-navy'
        }`}>
          ← Back to Measurements
        </Link>
      </div>
    );
  }

  if (!measurement) {
    return (
      <div className="flex items-center justify-center h-64 pb-32">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
          theme === 'dark' ? 'border-primary-gold' : 'border-primary-navy'
        }`}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      {/* Print Component - Hidden by default, only shows when printing */}
      <div className="hidden">
        <PrintMeasurement measurement={measurement} />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className={`text-3xl font-bold transition-colors duration-200 ${
            theme === 'dark' ? 'text-dark-text' : 'text-primary-navy'
          }`}>Measurement Details</h1>
          <p className={`mt-1 transition-colors duration-200 ${
            theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
          }`}>Entry ID: {measurement.entry_id}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-steel text-white rounded-lg hover:bg-opacity-90 transition"
          >
            🖨️ Print
          </button>
          {(user?.role === 'admin' || user?.role === 'manager' || (user?.role === 'tailor' && measurement.created_by === user.id)) && (
            <Link
              to={`/measurements/edit/${id}`}
              className="px-4 py-2 bg-primary-gold text-white rounded-lg hover:bg-opacity-90 transition"
            >
              ✏️ Edit
            </Link>
          )}
          {user?.role === 'admin' && (
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete this measurement? This action cannot be undone.')) {
                  try {
                    await axios.delete(`/api/measurements/${id}`);
                    navigate('/measurements');
                  } catch (err: any) {
                    let errorMsg = 'Failed to delete measurement';
                    if (err.response?.data) {
                      const data = err.response.data;
                      if (typeof data.error === 'string') {
                        errorMsg = data.error;
                      } else if (typeof data.message === 'string') {
                        errorMsg = data.message;
                      }
                    } else if (err.message && typeof err.message === 'string') {
                      errorMsg = err.message;
                    }
                    alert(errorMsg);
                  }
                }
              }}
              className="px-4 py-2 bg-crimson text-white rounded-lg hover:bg-opacity-90 transition"
            >
              🗑️ Delete
            </button>
          )}
          <Link
            to="/measurements"
            className="px-4 py-2 border border-steel text-steel rounded-lg hover:bg-soft-white transition"
          >
            ← Back
          </Link>
        </div>
      </motion.div>

      {/* Customer Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        data-aos="fade-up"
        className={`rounded-xl shadow-md p-6 transition-colors duration-200 ${
          theme === 'dark' ? 'bg-dark-surface' : 'bg-white'
        }`}
      >
        <h2 className={`text-xl font-bold mb-4 border-b pb-2 transition-colors duration-200 ${
          theme === 'dark' 
            ? 'text-dark-text border-dark-border' 
            : 'text-primary-navy border-steel-light'
        }`}>Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className={`text-sm transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>Name</p>
            <p className={`font-medium transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
            }`}>{measurement.customer_name || 'N/A'}</p>
          </div>
          <div>
            <p className={`text-sm transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>Phone</p>
            <p className={`font-medium transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
            }`}>{measurement.customer_phone || 'N/A'}</p>
          </div>
          <div>
            <p className={`text-sm transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>Email</p>
            <p className={`font-medium transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
            }`}>{measurement.customer_email || 'N/A'}</p>
          </div>
          <div>
            <p className={`text-sm transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>Address</p>
            <p className={`font-medium transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
            }`}>{measurement.customer_address || 'N/A'}</p>
          </div>
        </div>
      </motion.div>

      {/* Top Measurements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        data-aos="fade-up"
        className={`rounded-xl shadow-md p-6 transition-colors duration-200 ${
          theme === 'dark' ? 'bg-dark-surface' : 'bg-white'
        }`}
      >
        <h2 className={`text-xl font-bold mb-4 border-b pb-2 transition-colors duration-200 ${
          theme === 'dark' 
            ? 'text-dark-text border-dark-border' 
            : 'text-primary-navy border-steel-light'
        }`}>
          Top Measurements ({measurement.units})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className={`text-sm transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>Across Back</p>
            <p className={`text-2xl font-bold transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
            }`}>{measurement.across_back || '—'}</p>
          </div>
          <div>
            <p className={`text-sm transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>Chest</p>
            <p className={`text-2xl font-bold transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
            }`}>{measurement.chest || '—'}</p>
          </div>
          <div>
            <p className={`text-sm transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>Sleeve Length</p>
            <p className={`text-2xl font-bold transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
            }`}>{measurement.sleeve_length || '—'}</p>
          </div>
          <div>
            <p className={`text-sm transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>Around Arm</p>
            <p className={`text-2xl font-bold transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
            }`}>{measurement.around_arm || '—'}</p>
          </div>
          <div>
            <p className={`text-sm transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>Neck</p>
            <p className={`text-2xl font-bold transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
            }`}>{measurement.neck || '—'}</p>
          </div>
          <div>
            <p className={`text-sm transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>Top Length</p>
            <p className={`text-2xl font-bold transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
            }`}>{measurement.top_length || '—'}</p>
          </div>
          <div>
            <p className={`text-sm transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>Wrist</p>
            <p className={`text-2xl font-bold transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
            }`}>{measurement.wrist || '—'}</p>
          </div>
        </div>
      </motion.div>

      {/* Trouser Measurements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        data-aos="fade-up"
        className={`rounded-xl shadow-md p-6 transition-colors duration-200 ${
          theme === 'dark' ? 'bg-dark-surface' : 'bg-white'
        }`}
      >
        <h2 className={`text-xl font-bold mb-4 border-b pb-2 transition-colors duration-200 ${
          theme === 'dark' 
            ? 'text-dark-text border-dark-border' 
            : 'text-primary-navy border-steel-light'
        }`}>
          Trouser Measurements ({measurement.units})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className={`text-sm transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>Waist</p>
            <p className={`text-2xl font-bold transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
            }`}>{measurement.trouser_waist || '—'}</p>
          </div>
          <div>
            <p className={`text-sm transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>Thigh</p>
            <p className={`text-2xl font-bold transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
            }`}>{measurement.trouser_thigh || '—'}</p>
          </div>
          <div>
            <p className={`text-sm transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>Knee</p>
            <p className={`text-2xl font-bold transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
            }`}>{measurement.trouser_knee || '—'}</p>
          </div>
          <div>
            <p className={`text-sm transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>Trouser Length</p>
            <p className={`text-2xl font-bold transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
            }`}>{measurement.trouser_length || '—'}</p>
          </div>
          <div>
            <p className={`text-sm transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>Bars</p>
            <p className={`text-2xl font-bold transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
            }`}>{measurement.trouser_bars || '—'}</p>
          </div>
        </div>
      </motion.div>

      {/* Additional Information */}
      {measurement.additional_info && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          data-aos="fade-up"
          className={`rounded-xl shadow-md p-6 transition-colors duration-200 ${
            theme === 'dark' ? 'bg-dark-surface' : 'bg-white'
          }`}
        >
          <h2 className={`text-xl font-bold mb-4 border-b pb-2 transition-colors duration-200 ${
            theme === 'dark' 
              ? 'text-dark-text border-dark-border' 
              : 'text-primary-navy border-steel-light'
          }`}>Additional Information</h2>
          <p className={`whitespace-pre-wrap transition-colors duration-200 ${
            theme === 'dark' ? 'text-dark-text-secondary' : 'text-gray-700'
          }`}>{measurement.additional_info}</p>
        </motion.div>
      )}

      {/* Metadata */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        data-aos="fade-up"
        className={`rounded-xl shadow-md p-6 transition-colors duration-200 ${
          theme === 'dark' ? 'bg-dark-surface' : 'bg-soft-white'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className={`transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>Created</p>
            <p className={`font-medium transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
            }`}>
              {format(new Date(measurement.created_at), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
          {measurement.updated_at && (
            <div>
              <p className={`transition-colors duration-200 ${
                theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
              }`}>Last Updated</p>
              <p className={`font-medium transition-colors duration-200 ${
                theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
              }`}>
                {format(new Date(measurement.updated_at), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          )}
          <div>
            <p className={`transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>Created By</p>
            <p className={`font-medium transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
            }`}>{measurement.created_by_name || 'N/A'}</p>
          </div>
          {measurement.branch && (
            <div>
              <p className={`transition-colors duration-200 ${
                theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
              }`}>Branch</p>
              <p className={`font-medium transition-colors duration-200 ${
                theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
              }`}>{measurement.branch}</p>
            </div>
          )}
          <div>
            <p className={`transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text-secondary' : 'text-steel'
            }`}>Version</p>
            <p className={`font-medium transition-colors duration-200 ${
              theme === 'dark' ? 'text-dark-text' : 'text-gray-900'
            }`}>{measurement.version || 1}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MeasurementView;

