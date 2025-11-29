/**
 * Unit conversion utilities for measurements
 * Converts between centimeters (cm) and inches (in)
 */

/**
 * Convert centimeters to inches
 * @param cm - value in centimeters
 * @returns value in inches, rounded to 2 decimal places
 */
export const cmToIn = (cm: number): number => {
  if (typeof cm !== 'number' || isNaN(cm)) {
    return 0;
  }
  return Math.round((cm / 2.54) * 100) / 100;
};

/**
 * Convert inches to centimeters
 * @param inches - value in inches
 * @returns value in centimeters, rounded to 2 decimal places
 */
export const inToCm = (inches: number): number => {
  if (typeof inches !== 'number' || isNaN(inches)) {
    return 0;
  }
  return Math.round((inches * 2.54) * 100) / 100;
};

/**
 * Convert a measurement value from one unit to another
 * @param value - the measurement value
 * @param fromUnit - source unit ('cm' or 'in')
 * @param toUnit - target unit ('cm' or 'in')
 * @returns converted value
 */
export const convertUnit = (
  value: number,
  fromUnit: 'cm' | 'in',
  toUnit: 'cm' | 'in'
): number => {
  if (fromUnit === toUnit) {
    return value;
  }
  if (fromUnit === 'cm' && toUnit === 'in') {
    return cmToIn(value);
  }
  if (fromUnit === 'in' && toUnit === 'cm') {
    return inToCm(value);
  }
  return value;
};

/**
 * Convert all measurement fields in an object from one unit to another
 */
export const convertMeasurementUnits = (
  measurement: Record<string, any>,
  fromUnit: 'cm' | 'in',
  toUnit: 'cm' | 'in'
): Record<string, any> => {
  if (fromUnit === toUnit) {
    return measurement;
  }

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

  const converted = { ...measurement };
  measurementFields.forEach((field) => {
    if (converted[field] != null && typeof converted[field] === 'number') {
      converted[field] = convertUnit(converted[field], fromUnit, toUnit);
    }
  });

  return converted;
};

