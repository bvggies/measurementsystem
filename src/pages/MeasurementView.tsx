import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { format } from 'date-fns';
import PrintMeasurement from '../components/PrintMeasurement';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

const MeasurementView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
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
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load measurement';
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
    // Set document title for print
    const systemName = settings.name || 'FitTrack';
    const customerName = measurement?.customer_name || 'Measurement';
    const entryId = measurement?.entry_id || '';
    document.title = `${systemName} - ${customerName} - ${entryId}`;
    
    // Trigger print
    window.print();
    
    // After print, trigger download/save
    setTimeout(() => {
      // Generate filename
      const sanitizedCustomerName = (customerName || 'Measurement').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const sanitizedEntryId = (entryId || Date.now().toString()).replace(/[^a-z0-9]/gi, '_');
      const filename = `${systemName}_${sanitizedCustomerName}_${sanitizedEntryId}.pdf`;
      
      // Note: Actual PDF generation would require a library like jsPDF or html2pdf
      // For now, the browser's print dialog will allow saving as PDF
      console.log('Print completed. Suggested filename:', filename);
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-navy"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-crimson bg-opacity-10 border border-crimson rounded-lg p-4 text-crimson">
          {error || 'Measurement not found'}
        </div>
        <Link to="/measurements" className="text-primary-navy hover:underline">
          ← Back to Measurements
        </Link>
      </div>
    );
  }

  if (!measurement) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-navy"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Print Component */}
      <PrintMeasurement measurement={measurement} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-primary-navy">Measurement Details</h1>
          <p className="text-steel mt-1">Entry ID: {measurement.entry_id}</p>
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
                    alert(err.response?.data?.error || 'Failed to delete measurement');
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
        className="bg-white rounded-xl shadow-md p-6"
      >
        <h2 className="text-xl font-bold text-primary-navy mb-4 border-b pb-2">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-steel">Name</p>
            <p className="font-medium text-gray-900">{measurement.customer_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-steel">Phone</p>
            <p className="font-medium text-gray-900">{measurement.customer_phone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-steel">Email</p>
            <p className="font-medium text-gray-900">{measurement.customer_email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-steel">Address</p>
            <p className="font-medium text-gray-900">{measurement.customer_address || 'N/A'}</p>
          </div>
        </div>
      </motion.div>

      {/* Top Measurements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        data-aos="fade-up"
        className="bg-white rounded-xl shadow-md p-6"
      >
        <h2 className="text-xl font-bold text-primary-navy mb-4 border-b pb-2">
          Top Measurements ({measurement.units})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-steel">Across Back</p>
            <p className="text-2xl font-bold text-gray-900">{measurement.across_back || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-steel">Chest</p>
            <p className="text-2xl font-bold text-gray-900">{measurement.chest || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-steel">Sleeve Length</p>
            <p className="text-2xl font-bold text-gray-900">{measurement.sleeve_length || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-steel">Around Arm</p>
            <p className="text-2xl font-bold text-gray-900">{measurement.around_arm || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-steel">Neck</p>
            <p className="text-2xl font-bold text-gray-900">{measurement.neck || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-steel">Top Length</p>
            <p className="text-2xl font-bold text-gray-900">{measurement.top_length || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-steel">Wrist</p>
            <p className="text-2xl font-bold text-gray-900">{measurement.wrist || '—'}</p>
          </div>
        </div>
      </motion.div>

      {/* Trouser Measurements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        data-aos="fade-up"
        className="bg-white rounded-xl shadow-md p-6"
      >
        <h2 className="text-xl font-bold text-primary-navy mb-4 border-b pb-2">
          Trouser Measurements ({measurement.units})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-steel">Waist</p>
            <p className="text-2xl font-bold text-gray-900">{measurement.trouser_waist || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-steel">Thigh</p>
            <p className="text-2xl font-bold text-gray-900">{measurement.trouser_thigh || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-steel">Knee</p>
            <p className="text-2xl font-bold text-gray-900">{measurement.trouser_knee || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-steel">Trouser Length</p>
            <p className="text-2xl font-bold text-gray-900">{measurement.trouser_length || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-steel">Bars</p>
            <p className="text-2xl font-bold text-gray-900">{measurement.trouser_bars || '—'}</p>
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
          className="bg-white rounded-xl shadow-md p-6"
        >
          <h2 className="text-xl font-bold text-primary-navy mb-4 border-b pb-2">Additional Information</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{measurement.additional_info}</p>
        </motion.div>
      )}

      {/* Metadata */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        data-aos="fade-up"
        className="bg-soft-white rounded-xl shadow-md p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-steel">Created</p>
            <p className="font-medium text-gray-900">
              {format(new Date(measurement.created_at), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
          {measurement.updated_at && (
            <div>
              <p className="text-steel">Last Updated</p>
              <p className="font-medium text-gray-900">
                {format(new Date(measurement.updated_at), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          )}
          <div>
            <p className="text-steel">Created By</p>
            <p className="font-medium text-gray-900">{measurement.created_by_name || 'N/A'}</p>
          </div>
          {measurement.branch && (
            <div>
              <p className="text-steel">Branch</p>
              <p className="font-medium text-gray-900">{measurement.branch}</p>
            </div>
          )}
          <div>
            <p className="text-steel">Version</p>
            <p className="font-medium text-gray-900">{measurement.version || 1}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MeasurementView;

