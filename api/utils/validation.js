/**
 * Validation utilities for measurement data - JavaScript version
 */

/**
 * Validate a measurement object
 */
function validateMeasurement(measurement, unit = 'cm') {
  const errors = [];

  // Validate required fields: at least client name or phone
  const clientName = measurement.client_name || measurement.name || '';
  const clientPhone = measurement.client_phone || measurement.phone || '';

  if (!clientName.trim() && !clientPhone.trim()) {
    errors.push({
      field: 'client_info',
      message: 'Either client name or phone number is required',
    });
  }

  // Allow submission without measurements - measurements are optional
  // Removed requirement for at least one measurement field
  
  // Validate each measurement field (but don't require any)
  const measurementFields = [
    'across_back',
    'chest',
    'sleeve_length',
    'around_arm',
    'neck',
    'top_length',
    'wrist',
    'trouser_waist',
    'trouser_thigh',
    'trouser_knee',
    'trouser_length',
    'trouser_bars',
  ];

  // Only validate fields that are provided - allow any positive number
  measurementFields.forEach((field) => {
    const value = measurement[field];
    if (value != null && value !== '') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      // Only check if it's a valid number and positive - no range restrictions
      if (typeof numValue !== 'number' || isNaN(numValue)) {
        errors.push({
          field,
          message: `${field} must be a valid number`,
        });
      } else if (numValue < 0) {
        errors.push({
          field,
          message: `${field} must be positive`,
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateMeasurement,
};
