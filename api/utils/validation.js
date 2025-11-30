/**
 * Validation utilities for measurements (JavaScript version)
 */

const validateMeasurement = (data, units = 'cm') => {
  const errors = [];
  const isMetric = units === 'cm';

  // Required fields
  if (!data.client_name && !data.client_phone) {
    errors.push('Client name or phone is required');
  }

  // Numeric field validation with ranges
  const numericFields = [
    { key: 'across_back', min: isMetric ? 30 : 12, max: isMetric ? 60 : 24, label: 'Across Back' },
    { key: 'chest', min: isMetric ? 76 : 30, max: isMetric ? 178 : 70, label: 'Chest' },
    { key: 'sleeve_length', min: isMetric ? 40 : 16, max: isMetric ? 90 : 35, label: 'Sleeve Length' },
    { key: 'around_arm', min: isMetric ? 20 : 8, max: isMetric ? 50 : 20, label: 'Around Arm' },
    { key: 'neck', min: isMetric ? 30 : 12, max: isMetric ? 50 : 20, label: 'Neck' },
    { key: 'top_length', min: isMetric ? 50 : 20, max: isMetric ? 120 : 47, label: 'Top Length' },
    { key: 'wrist', min: isMetric ? 10 : 4, max: isMetric ? 25 : 10, label: 'Wrist' },
    { key: 'trouser_waist', min: isMetric ? 60 : 24, max: isMetric ? 150 : 59, label: 'Trouser Waist' },
    { key: 'trouser_thigh', min: isMetric ? 40 : 16, max: isMetric ? 90 : 35, label: 'Trouser Thigh' },
    { key: 'trouser_knee', min: isMetric ? 30 : 12, max: isMetric ? 60 : 24, label: 'Trouser Knee' },
    { key: 'trouser_length', min: isMetric ? 70 : 28, max: isMetric ? 130 : 51, label: 'Trouser Length' },
    { key: 'trouser_bars', min: 0, max: 10, label: 'Trouser Bars' },
  ];

  // Check if at least one measurement is provided
  const hasAnyMeasurement = numericFields.some(field => {
    const value = data[field.key];
    return value !== null && value !== undefined && value !== '';
  });

  if (!hasAnyMeasurement) {
    errors.push('At least one measurement value is required');
  }

  // Validate each numeric field if provided
  numericFields.forEach(field => {
    const value = data[field.key];
    if (value !== null && value !== undefined && value !== '') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        errors.push(`${field.label} must be a positive number`);
      } else if (numValue < field.min || numValue > field.max) {
        errors.push(`${field.label} must be between ${field.min} and ${field.max} ${units}`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateMeasurement,
};

