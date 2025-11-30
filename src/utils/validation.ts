/**
 * Validation utilities for measurement data
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Measurement field ranges in cm
 */
const MEASUREMENT_RANGES_CM: Record<string, { min: number; max: number }> = {
  across_back: { min: 20, max: 80 },
  chest: { min: 50, max: 200 },
  sleeve_length: { min: 20, max: 100 },
  around_arm: { min: 15, max: 80 },
  neck: { min: 20, max: 60 },
  top_length: { min: 30, max: 150 },
  wrist: { min: 10, max: 40 },
  trouser_waist: { min: 50, max: 200 },
  trouser_thigh: { min: 30, max: 100 },
  trouser_knee: { min: 20, max: 80 },
  trouser_length: { min: 50, max: 150 },
  trouser_bars: { min: 5, max: 30 },
};

/**
 * Measurement field ranges in inches
 */
const MEASUREMENT_RANGES_IN: Record<string, { min: number; max: number }> = {
  across_back: { min: 8, max: 32 },
  chest: { min: 20, max: 80 },
  sleeve_length: { min: 8, max: 40 },
  around_arm: { min: 6, max: 32 },
  neck: { min: 8, max: 24 },
  top_length: { min: 12, max: 60 },
  wrist: { min: 4, max: 16 },
  trouser_waist: { min: 20, max: 80 },
  trouser_thigh: { min: 12, max: 40 },
  trouser_knee: { min: 8, max: 32 },
  trouser_length: { min: 20, max: 60 },
  trouser_bars: { min: 2, max: 12 },
};

/**
 * Validate a single numeric measurement field
 */
const validateMeasurementField = (
  field: string,
  value: number | null | undefined,
  unit: 'cm' | 'in'
): ValidationError | null => {
  if (value == null) {
    return null; // Optional fields can be null
  }

  if (typeof value !== 'number' || isNaN(value)) {
    return {
      field,
      message: `${field} must be a valid number`,
    };
  }

  // Allow any positive number - no range restrictions
  if (value < 0) {
    return {
      field,
      message: `${field} must be positive`,
    };
  }

  // Removed range validation to allow any number input
  return null;
};

/**
 * Validate a measurement object
 */
export const validateMeasurement = (
  measurement: Record<string, any>,
  unit: 'cm' | 'in' = 'cm'
): ValidationResult => {
  const errors: ValidationError[] = [];

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

  // Validate each measurement field
  measurementFields.forEach((field) => {
    const value = measurement[field];
    if (value != null && value !== '') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      const error = validateMeasurementField(field, numValue, unit);
      if (error) {
        errors.push(error);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Parse and validate a numeric value
 */
export const parseNumeric = (value: any): number | null => {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value.trim());
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

/**
 * Normalize phone number (remove non-digits, add country code if needed)
 */
export const normalizePhone = (phone: string | null | undefined): string | null => {
  if (!phone) {
    return null;
  }
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned || null;
};

/**
 * Validate email format
 */
export const validateEmail = (email: string | null | undefined): boolean => {
  if (!email) {
    return true; // Email is optional
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

