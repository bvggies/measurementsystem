import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { validateMeasurement, ValidationError } from '../utils/validation';

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
}

const ShareableForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [success, setSuccess] = useState(false);
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccess(false);

    const validation = validateMeasurement(data, data.units);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/measurements/shareable', {
        ...data,
        shareToken: token,
      });
      setSuccess(true);
      setTimeout(() => {
        setData({
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
        });
        setSuccess(false);
      }, 3000);
    } catch (error: any) {
      setErrors([{ field: 'general', message: error.response?.data?.error || 'Failed to submit' }]);
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: keyof MeasurementData, value: any) => {
    setData({ ...data, [field]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-white to-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <div className="text-center mb-8">
            <img src="/applogo.png" alt="FitTrack" className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-primary-navy mb-2">FitTrack</h1>
            <p className="text-steel">Measurement Form</p>
          </div>

          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 bg-emerald bg-opacity-10 border border-emerald rounded-lg text-emerald"
            >
              ✅ Measurement submitted successfully! Thank you.
            </motion.div>
          )}

          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 bg-crimson bg-opacity-10 border border-crimson rounded-lg"
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
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-primary-navy border-b pb-2">Client Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-steel mb-2">Name *</label>
                  <input
                    type="text"
                    value={data.client_name}
                    onChange={(e) => updateField('client_name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-steel mb-2">Phone *</label>
                  <input
                    type="text"
                    value={data.client_phone}
                    onChange={(e) => updateField('client_phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-steel mb-2">Email</label>
                  <input
                    type="email"
                    value={data.client_email}
                    onChange={(e) => updateField('client_email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-steel mb-2">Address</label>
                  <input
                    type="text"
                    value={data.client_address}
                    onChange={(e) => updateField('client_address', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Units Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-bold text-primary-navy">Units</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateField('units', 'cm')}
                  className={`px-4 py-2 rounded-lg ${
                    data.units === 'cm' ? 'bg-primary-navy text-white' : 'bg-gray-200 text-steel'
                  }`}
                >
                  Centimeters
                </button>
                <button
                  type="button"
                  onClick={() => updateField('units', 'in')}
                  className={`px-4 py-2 rounded-lg ${
                    data.units === 'in' ? 'bg-primary-navy text-white' : 'bg-gray-200 text-steel'
                  }`}
                >
                  Inches
                </button>
              </div>
            </div>

            {/* Top Measurements */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-primary-navy border-b pb-2">Top Measurements</h2>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-gold"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Trouser Measurements */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-primary-navy border-b pb-2">Trouser Measurements</h2>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-gold"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <h2 className="text-xl font-bold text-primary-navy border-b pb-2 mb-4">Additional Information</h2>
              <textarea
                value={data.additional_info}
                onChange={(e) => updateField('additional_info', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-gold"
                placeholder="Any additional notes or preferences..."
              />
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 bg-primary-navy text-white font-medium rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition"
            >
              {submitting ? 'Submitting...' : 'Submit Measurement'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ShareableForm;

