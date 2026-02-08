import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { validateMeasurement, ValidationError } from '../utils/validation';
import { convertMeasurementUnits } from '../utils/unitConversion';
import PrintMeasurement from '../components/PrintMeasurement';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface MeasurementData {
  client_name: string;
  client_phone: string;
  client_email: string;
  client_address: string;
  units: 'cm' | 'in';
  fit_preference: 'slim' | 'regular' | 'loose' | 'custom' | '';
  template_id: string;
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

interface Template {
  id: string;
  name: string;
  template_type?: string;
  units: string;
  across_back?: number | null;
  chest?: number | null;
  sleeve_length?: number | null;
  around_arm?: number | null;
  neck?: number | null;
  top_length?: number | null;
  wrist?: number | null;
  trouser_waist?: number | null;
  trouser_thigh?: number | null;
  trouser_knee?: number | null;
  trouser_length?: number | null;
  trouser_bars?: number | null;
}

const MeasurementForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEdit = !!id && id !== 'new';
  const [measurementData, setMeasurementData] = useState<any>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<{ message: string; rule_type: string }[]>([]);
  const [data, setData] = useState<MeasurementData>({
    client_name: '',
    client_phone: '',
    client_email: '',
    client_address: '',
    units: 'cm',
    fit_preference: '',
    template_id: '',
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
      setLoading(true);
      const response = await axios.get(`/api/measurements/${id}`);
      const m = response.data;
      setMeasurementData(m);
      setData({
        client_name: m.customer_name || '',
        client_phone: m.customer_phone || '',
        client_email: m.customer_email || '',
        client_address: m.customer_address || '',
        units: m.units || 'cm',
        fit_preference: m.fit_preference || '',
        template_id: m.template_id || '',
        across_back: m.across_back ?? null,
        chest: m.chest ?? null,
        sleeve_length: m.sleeve_length ?? null,
        around_arm: m.around_arm ?? null,
        neck: m.neck ?? null,
        top_length: m.top_length ?? null,
        wrist: m.wrist ?? null,
        trouser_waist: m.trouser_waist ?? null,
        trouser_thigh: m.trouser_thigh ?? null,
        trouser_knee: m.trouser_knee ?? null,
        trouser_length: m.trouser_length ?? null,
        trouser_bars: m.trouser_bars ?? null,
        additional_info: m.additional_info || '',
        branch: m.branch || '',
      });
    } catch (error: any) {
      console.error('Failed to fetch measurement:', error);
      let errorMsg = 'Failed to load measurement';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data.error === 'string') {
          errorMsg = data.error;
        } else if (typeof data.message === 'string') {
          errorMsg = data.message;
        }
      } else if (error.message && typeof error.message === 'string') {
        errorMsg = error.message;
      }
      setErrors([{ field: 'general', message: errorMsg }]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit) {
      fetchMeasurement();
    }
  }, [isEdit, id, fetchMeasurement]);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await axios.get('/api/templates');
        setTemplates(res.data?.templates || []);
      } catch (_) {
        setTemplates([]);
      }
    };
    loadTemplates();
  }, []);

  const applyTemplate = (template: Template) => {
    if (!template) return;
    setData((prev) => ({
      ...prev,
      template_id: template.id,
      units: (template.units as 'cm' | 'in') || prev.units,
      across_back: template.across_back ?? prev.across_back,
      chest: template.chest ?? prev.chest,
      sleeve_length: template.sleeve_length ?? prev.sleeve_length,
      around_arm: template.around_arm ?? prev.around_arm,
      neck: template.neck ?? prev.neck,
      top_length: template.top_length ?? prev.top_length,
      wrist: template.wrist ?? prev.wrist,
      trouser_waist: template.trouser_waist ?? prev.trouser_waist,
      trouser_thigh: template.trouser_thigh ?? prev.trouser_thigh,
      trouser_knee: template.trouser_knee ?? prev.trouser_knee,
      trouser_length: template.trouser_length ?? prev.trouser_length,
      trouser_bars: template.trouser_bars ?? prev.trouser_bars,
    }));
  };

  const runValidationCheck = useCallback(async () => {
    try {
      const res = await axios.post('/api/validation/check', {
        measurement: {
          trouser_waist: data.trouser_waist,
          trouser_thigh: data.trouser_thigh,
          sleeve_length: data.sleeve_length,
          top_length: data.top_length,
          neck: data.neck,
          chest: data.chest,
        },
      });
      const warnings = (res.data?.warnings || []).map((w: { message: string; rule_type: string }) => ({ message: w.message, rule_type: w.rule_type }));
      setValidationWarnings(warnings);
    } catch (_) {
      setValidationWarnings([]);
    }
  }, [data.trouser_waist, data.trouser_thigh, data.sleeve_length, data.top_length, data.neck, data.chest]);

  useEffect(() => {
    const t = setTimeout(runValidationCheck, 500);
    return () => clearTimeout(t);
  }, [runValidationCheck]);

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
      toast(isEdit ? 'Measurement updated successfully' : 'Measurement created successfully', 'success');
      navigate('/measurements');
    } catch (error: any) {
      console.error('Save error:', error);
      let errorMessage = 'Failed to save measurement';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data.error === 'string') {
          errorMessage = data.error;
        } else if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          // Handle validation errors array
          const validationErrors = data.errors.map((err: any) => ({
            field: err.field || 'general',
            message: typeof err.message === 'string' ? err.message : 'Validation error',
          }));
          setErrors(validationErrors);
          return;
        } else if (data.message && typeof data.message === 'string') {
          errorMessage = data.message;
        }
      } else if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      }
      toast(errorMessage, 'error');
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

        {/* Template & Fit Preference */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          data-aos="fade-up"
          className="bg-white rounded-xl shadow-md p-6"
        >
          <h2 className="text-xl font-bold text-primary-navy mb-4 border-b border-steel-light pb-2">Template & Fit</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-steel mb-2">Predefined template</label>
              <select
                value={data.template_id}
                onChange={(e) => {
                  const id = e.target.value;
                  const t = templates.find((x) => x.id === id);
                  if (t) applyTemplate(t);
                  else setData((prev) => ({ ...prev, template_id: id }));
                }}
                className="w-full px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-primary-gold"
              >
                <option value="">None</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.template_type ? `(${t.template_type})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-steel mb-2">Fit preference</label>
              <select
                value={data.fit_preference}
                onChange={(e) => updateField('fit_preference', e.target.value as MeasurementData['fit_preference'])}
                className="w-full px-4 py-2 border border-steel-light rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-primary-gold"
              >
                <option value="">Not specified</option>
                <option value="slim">Slim</option>
                <option value="regular">Regular</option>
                <option value="loose">Loose</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
        </motion.div>

        {validationWarnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-primary-gold/15 border border-primary-gold/50 rounded-xl"
          >
            <p className="text-sm font-medium text-primary-navy mb-2">Auto-validation</p>
            <ul className="list-disc list-inside text-sm text-steel">
              {validationWarnings.map((w, i) => (
                <li key={i}>{w.message}</li>
              ))}
            </ul>
          </motion.div>
        )}

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

