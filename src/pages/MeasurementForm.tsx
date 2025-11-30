import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { validateMeasurement, ValidationError } from '../utils/validation';
import { convertMeasurementUnits } from '../utils/unitConversion';
import PrintMeasurement from '../components/PrintMeasurement';
import { useAuth } from '../contexts/AuthContext';

interface MeasurementData {
  client_name: string;
  client_phone: string;
  client_email: string;
  client_address: string;
  units: 'cm' | 'in';
  across_back: number | null;
  chest: number | null;
  sleeve_length: number | null;
  around_arm: number | null;
  neck: number | null;
  top_length: number | null;
  wrist: number | null;
  trouser_waist: number | null;
  trouser_thigh: number | null;
  trouser_knee: number | null;
  trouser_length: number | null;
  trouser_bars: number | null;
  additional_info: string;
  branch: string;
}

const MeasurementForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id && id !== 'new';
  const [measurementData, setMeasurementData] = useState<any>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [data, setData] = useState<MeasurementData>({
    client_name: '',
    client_phone: '',
    client_email: '',
    client_address: '',
    units: 'cm',
    across_back: null,
    chest: null,
    sleeve_length: null,
    around_arm: null,
    neck: null,
    top_length: null,
    wrist: null,
    trouser_waist: null,
    trouser_thigh: null,
    trouser_knee: null,
    trouser_length: null,
    trouser_bars: null,
    additional_info: '',
    branch: '',
  });

  const fetchMeasurement = useCallback(async () => {
    try {
      const response = await axios.get(`/api/measurements/${id}`);
      const m = response.data;
      setMeasurementData(m);
      setData({
        client_name: m.customer_name || '',
        client_phone: m.customer_phone || '',
        client_email: m.customer_email || '',
        client_address: m.customer_address || '',
        units: m.units || 'cm',
        across_back: m.across_back,
        chest: m.chest,
        sleeve_length: m.sleeve_length,
        around_arm: m.around_arm,
        neck: m.neck,
        top_length: m.top_length,
        wrist: m.wrist,
        trouser_waist: m.trouser_waist,
        trouser_thigh: m.trouser_thigh,
        trouser_knee: m.trouser_knee,
        trouser_length: m.trouser_length,
        trouser_bars: m.trouser_bars,
        additional_info: m.additional_info || '',
        branch: m.branch || '',
      });
    } catch (error) {
      console.error('Failed to fetch measurement:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit) {
      fetchMeasurement();
    }
  }, [isEdit, id, fetchMeasurement]);

  const handleUnitChange = (newUnit: 'cm' | 'in') => {
    if (newUnit === data.units) return;

    const converted = convertMeasurementUnits(data, data.units, newUnit);
    setData({ ...data, ...converted, units: newUnit } as MeasurementData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrors([]);

    // Basic validation - only check for required client info
    if (!data.client_name?.trim() && !data.client_phone?.trim()) {
      setErrors([{ field: 'client_info', message: 'Either client name or phone number is required' }]);
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await axios.put(`/api/measurements/${id}`, data);
      } else {
        await axios.post('/api/measurements', data);
      }
      navigate('/measurements');
    } catch (error: any) {
      console.error('Save error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save measurement';
      setErrors([{ field: 'general', message: errorMessage }]);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof MeasurementData, value: any) => {
    setData({ ...data, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-navy"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold text-primary-navy">
          {isEdit ? 'Edit Measurement' : 'New Measurement'}
        </h1>
      </motion.div>

      {errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-crimson bg-opacity-10 border border-crimson rounded-lg"
        >
          <ul className="list-disc list-inside text-crimson">
            {errors.map((err, idx) => (
              <li key={idx}>{err.message}</li>
            ))}
          </ul>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Client Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          data-aos="fade-up"
          className="bg-white rounded-xl shadow-md p-6"
        >
          <h2 className="text-xl font-bold text-primary-navy mb-4 border-b border-steel-light pb-2">Client Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-steel mb-2">Name</label>
              <input
                type="text"
                value={data.client_name}
                onChange={(e) => updateField('client_name', e.target.value)}
                className="w-full px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-primary-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-steel mb-2">Phone</label>
              <input
                type="text"
                value={data.client_phone}
                onChange={(e) => updateField('client_phone', e.target.value)}
                className="w-full px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-primary-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-steel mb-2">Email</label>
              <input
                type="email"
                value={data.client_email}
                onChange={(e) => updateField('client_email', e.target.value)}
                className="w-full px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-primary-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-steel mb-2">Address</label>
              <input
                type="text"
                value={data.client_address}
                onChange={(e) => updateField('client_address', e.target.value)}
                className="w-full px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-primary-gold"
              />
            </div>
          </div>
        </motion.div>

        {/* Units Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          data-aos="fade-up"
          className="bg-white rounded-xl shadow-md p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary-navy border-b border-steel-light pb-2 flex-1">Units</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleUnitChange('cm')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  data.units === 'cm' ? 'bg-primary-navy text-white' : 'bg-soft-white text-steel hover:bg-steel-light'
                }`}
              >
                Centimeters
              </button>
              <button
                type="button"
                onClick={() => handleUnitChange('in')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  data.units === 'in' ? 'bg-primary-navy text-white' : 'bg-soft-white text-steel hover:bg-steel-light'
                }`}
              >
                Inches
              </button>
            </div>
          </div>
        </motion.div>

        {/* Top Measurements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          data-aos="fade-up"
          className="bg-white rounded-xl shadow-md p-6"
        >
          <h2 className="text-xl font-bold text-primary-navy mb-4 border-b border-steel-light pb-2">Top Measurements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'across_back', label: 'Across Back' },
              { key: 'chest', label: 'Chest' },
              { key: 'sleeve_length', label: 'Sleeve Length' },
              { key: 'around_arm', label: 'Around Arm' },
              { key: 'neck', label: 'Neck' },
              { key: 'top_length', label: 'Top Length' },
              { key: 'wrist', label: 'Wrist' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-steel mb-2">{field.label}</label>
                <input
                  type="number"
                  step="0.01"
                  value={data[field.key as keyof MeasurementData] || ''}
                  onChange={(e) => updateField(field.key as keyof MeasurementData, e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-primary-gold"
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trouser Measurements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          data-aos="fade-up"
          className="bg-white rounded-xl shadow-md p-6"
        >
          <h2 className="text-xl font-bold text-primary-navy mb-4 border-b border-steel-light pb-2">Trouser Measurements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'trouser_waist', label: 'Waist' },
              { key: 'trouser_thigh', label: 'Thigh' },
              { key: 'trouser_knee', label: 'Knee' },
              { key: 'trouser_length', label: 'Trouser Length' },
              { key: 'trouser_bars', label: 'Bars' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-steel mb-2">{field.label}</label>
                <input
                  type="number"
                  step="0.01"
                  value={data[field.key as keyof MeasurementData] || ''}
                  onChange={(e) => updateField(field.key as keyof MeasurementData, e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-primary-gold"
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          data-aos="fade-up"
          className="bg-white rounded-xl shadow-md p-6"
        >
          <h2 className="text-xl font-bold text-primary-navy mb-4 border-b border-steel-light pb-2">Additional Information</h2>
          <textarea
            value={data.additional_info}
            onChange={(e) => updateField('additional_info', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-primary-gold"
            placeholder="Any additional notes or preferences..."
          />
        </motion.div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/measurements')}
            className="px-6 py-3 border border-steel-light rounded-lg hover:bg-soft-white text-steel transition-colors"
          >
            Cancel
          </button>
          {isEdit && measurementData && (user?.role === 'admin' || user?.role === 'manager') && (
            <button
              type="button"
              onClick={() => window.print()}
              className="px-6 py-3 bg-primary-gold text-white rounded-lg hover:bg-opacity-90"
            >
              🖨️ Print
            </button>
          )}
          <motion.button
            type="submit"
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-primary-navy text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </motion.button>
        </div>
      </form>

      {/* Print Component */}
      {isEdit && measurementData && <PrintMeasurement measurement={measurementData} />}
    </div>
  );
};

export default MeasurementForm;

