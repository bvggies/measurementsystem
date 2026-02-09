import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { format } from 'date-fns';
import PrintMeasurement from '../components/PrintMeasurement';
import MeasurementHistoryTimeline from '../components/MeasurementHistoryTimeline';
import GarmentFeedback from '../components/GarmentFeedback';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';

const MeasurementView: React.FC = () => {
  const { id: idFromUrl } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { theme } = useTheme();
  const [measurement, setMeasurement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMeasurement = useCallback(async () => {
    const id = (idFromUrl || '').trim();
    if (!id) {
      setError('Invalid measurement ID');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    setMeasurement(null);
    try {
      const response = await axios.get(`/api/get-measurement?id=${encodeURIComponent(id)}`);
      let body = response?.data;

      if (body != null && typeof body === 'string') {
        if (body.trim().startsWith('<')) {
          setError('Server returned a page instead of data. The measurement API may not be deployed correctly.');
          return;
        }
        try {
          body = JSON.parse(body);
        } catch (_) {
          setError('Invalid response format from server');
          return;
        }
      }

      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        setError(response?.status === 200 ? 'Server returned no data. Try again or check the measurement ID.' : 'Invalid response from server');
        return;
      }

      if (body.error && body.success === false) {
        setError(typeof body.error === 'string' ? body.error : 'Measurement not found');
        return;
      }

      const data = body.data ?? body.measurement;
      const record = data && typeof data === 'object' && !Array.isArray(data) ? data : null;

      if (record && (record.id != null || record.entry_id != null)) {
        setMeasurement(record);
        return;
      }

      setError(typeof body.error === 'string' ? body.error : 'Measurement data is empty or invalid');
    } catch (err: any) {
      const res = err.response;
      let errorMsg = 'Failed to load measurement';
      if (res && res.data && typeof res.data === 'object') {
        if (typeof res.data.error === 'string') errorMsg = res.data.error;
        else if (typeof res.data.message === 'string') errorMsg = res.data.message;
      } else if (err.message && typeof err.message === 'string') {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [idFromUrl]);

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

  const measurementId = measurement.id ?? idFromUrl;
  const isDark = theme === 'dark';
  const cardCls = isDark ? 'bg-dark-surface border border-dark-border' : 'bg-white border border-gray-200/80 shadow-sm';
  const headingCls = isDark ? 'text-dark-text border-dark-border' : 'text-primary-navy border-gray-200';
  const labelCls = isDark ? 'text-dark-text-secondary' : 'text-steel';
  const valueCls = isDark ? 'text-dark-text' : 'text-gray-900';

  return (
    <div className="min-w-0 max-w-4xl mx-auto pb-32 overflow-x-hidden">
      {/* Print: small card only (hidden on screen, shown when printing) */}
      <div className="hidden print:block" data-print-root>
        <PrintMeasurement measurement={measurement} />
      </div>

      {/* Sticky action bar: always visible, wraps on small screens, no horizontal scroll */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 mb-4 sm:mb-6 ${
          isDark ? 'bg-dark-bg/95 border-b border-dark-border backdrop-blur' : 'bg-gray-50/95 border-b border-gray-200 backdrop-blur'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            to="/measurements"
            className={`order-last sm:order-first min-h-[44px] flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              isDark
                ? 'border border-dark-border text-gray-300 hover:bg-dark-border/50'
                : 'border border-gray-300 text-steel hover:bg-gray-100'
            }`}
          >
            ← Back
          </Link>
          <button
            onClick={handlePrint}
            className="min-h-[44px] flex items-center justify-center px-4 py-2.5 bg-steel text-white rounded-xl hover:opacity-90 transition text-sm font-medium"
          >
            🖨️ Print
          </button>
          {(user?.role === 'admin' || user?.role === 'manager' || (user?.role === 'tailor' && measurement.created_by === user?.id)) && (
            <Link
              to={`/measurements/edit/${measurementId}`}
              className="min-h-[44px] flex items-center justify-center px-4 py-2.5 bg-primary-gold text-primary-navy rounded-xl hover:opacity-90 transition text-sm font-medium"
            >
              ✏️ Edit
            </Link>
          )}
          {user?.role === 'admin' && (
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete this measurement? This action cannot be undone.')) {
                  try {
                    await axios.delete(`/api/delete-measurement?id=${encodeURIComponent(measurementId)}`);
                    navigate('/measurements');
                  } catch (err: any) {
                    let errorMsg = 'Failed to delete measurement';
                    if (err.response?.data) {
                      const data = err.response.data;
                      if (typeof data.error === 'string') errorMsg = data.error;
                      else if (typeof data.message === 'string') errorMsg = data.message;
                    } else if (err.message && typeof err.message === 'string') errorMsg = err.message;
                    alert(errorMsg);
                  }
                }
              }}
              className="min-h-[44px] flex items-center justify-center px-4 py-2.5 bg-crimson text-white rounded-xl hover:opacity-90 transition text-sm font-medium"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </motion.div>

      {/* Title + summary card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${cardCls} rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6`}
      >
        <h1 className={`text-xl sm:text-2xl font-bold ${valueCls}`}>Measurement Details</h1>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className={labelCls}>Entry ID</span>
          <span className={`font-medium ${valueCls}`}>{measurement.entry_id}</span>
          <span className={labelCls}>Customer</span>
          <span className={`font-medium ${valueCls}`}>{measurement.customer_name || '—'}</span>
          <span className={labelCls}>Units</span>
          <span className={`font-medium ${valueCls}`}>{measurement.units || 'cm'}</span>
        </div>
      </motion.div>

      {/* Customer Information */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={`${cardCls} rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6`}
      >
        <h2 className={`text-base sm:text-lg font-semibold mb-3 border-b pb-2 ${headingCls}`}>Customer Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
          <div className="min-w-0">
            <p className={`text-xs sm:text-sm ${labelCls}`}>Name</p>
            <p className={`font-medium truncate ${valueCls}`}>{measurement.customer_name || 'N/A'}</p>
          </div>
          <div className="min-w-0">
            <p className={`text-xs sm:text-sm ${labelCls}`}>Phone</p>
            <p className={`font-medium truncate ${valueCls}`}>{measurement.customer_phone || 'N/A'}</p>
          </div>
          <div className="min-w-0 sm:col-span-2">
            <p className={`text-xs sm:text-sm ${labelCls}`}>Email</p>
            <p className={`font-medium break-all ${valueCls}`}>{measurement.customer_email || 'N/A'}</p>
          </div>
          <div className="min-w-0 sm:col-span-2">
            <p className={`text-xs sm:text-sm ${labelCls}`}>Address</p>
            <p className={`font-medium break-words ${valueCls}`}>{measurement.customer_address || 'N/A'}</p>
          </div>
        </div>
      </motion.div>

      {/* Top Measurements */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${cardCls} rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6`}
      >
        <h2 className={`text-base sm:text-lg font-semibold mb-3 border-b pb-2 ${headingCls}`}>
          Top Measurements ({measurement.units})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 min-w-0">
          {[
            { label: 'Across Back', key: 'across_back' },
            { label: 'Chest', key: 'chest' },
            { label: 'Sleeve Length', key: 'sleeve_length' },
            { label: 'Around Arm', key: 'around_arm' },
            { label: 'Neck', key: 'neck' },
            { label: 'Top Length', key: 'top_length' },
            { label: 'Wrist', key: 'wrist' },
          ].map(({ label, key }) => (
            <div key={key} className="min-w-0">
              <p className={`text-xs sm:text-sm ${labelCls}`}>{label}</p>
              <p className={`text-lg sm:text-xl font-bold tabular-nums ${valueCls}`}>{measurement[key] ?? '—'}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Trouser Measurements */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`${cardCls} rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6`}
      >
        <h2 className={`text-base sm:text-lg font-semibold mb-3 border-b pb-2 ${headingCls}`}>
          Trouser Measurements ({measurement.units})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 min-w-0">
          {[
            { label: 'Waist', key: 'trouser_waist' },
            { label: 'Thigh', key: 'trouser_thigh' },
            { label: 'Knee', key: 'trouser_knee' },
            { label: 'Trouser Length', key: 'trouser_length' },
            { label: 'Bars', key: 'trouser_bars' },
          ].map(({ label, key }) => (
            <div key={key} className="min-w-0">
              <p className={`text-xs sm:text-sm ${labelCls}`}>{label}</p>
              <p className={`text-lg sm:text-xl font-bold tabular-nums ${valueCls}`}>{measurement[key] ?? '—'}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Additional Information */}
      {measurement.additional_info && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${cardCls} rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6`}
        >
          <h2 className={`text-base sm:text-lg font-semibold mb-3 border-b pb-2 ${headingCls}`}>Additional Information</h2>
          <p className={`text-sm sm:text-base whitespace-pre-wrap break-words min-w-0 ${labelCls}`}>{measurement.additional_info}</p>
        </motion.div>
      )}

      {/* Metadata */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className={`${cardCls} rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6`}
      >
        <h2 className={`text-base sm:text-lg font-semibold mb-3 border-b pb-2 ${headingCls}`}>Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm min-w-0">
          <div className="min-w-0">
            <p className={labelCls}>Created</p>
            <p className={`font-medium ${valueCls}`}>{format(new Date(measurement.created_at), 'MMM dd, yyyy HH:mm')}</p>
          </div>
          {measurement.updated_at && (
            <div className="min-w-0">
              <p className={labelCls}>Last Updated</p>
              <p className={`font-medium ${valueCls}`}>{format(new Date(measurement.updated_at), 'MMM dd, yyyy HH:mm')}</p>
            </div>
          )}
          <div className="min-w-0">
            <p className={labelCls}>Created By</p>
            <p className={`font-medium truncate ${valueCls}`}>{measurement.created_by_name || 'N/A'}</p>
          </div>
          {measurement.branch && (
            <div className="min-w-0">
              <p className={labelCls}>Branch</p>
              <p className={`font-medium ${valueCls}`}>{measurement.branch}</p>
            </div>
          )}
          <div className="min-w-0">
            <p className={labelCls}>Version</p>
            <p className={`font-medium ${valueCls}`}>{measurement.version || 1}</p>
          </div>
        </div>
      </motion.div>

      {/* Measurement History Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`${cardCls} rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 min-w-0`}
      >
        <h2 className={`text-base sm:text-lg font-semibold mb-3 border-b pb-2 ${headingCls}`}>Change history</h2>
        <MeasurementHistoryTimeline measurementId={measurementId} />
      </motion.div>

      {/* Garment outcome feedback */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className={`${cardCls} rounded-2xl p-4 sm:p-6 min-w-0`}
      >
        <h2 className={`text-base sm:text-lg font-semibold mb-3 border-b pb-2 ${headingCls}`}>Garment fit feedback</h2>
        <GarmentFeedback measurementId={measurementId} />
      </motion.div>
    </div>
  );
};

export default MeasurementView;

