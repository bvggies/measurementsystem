import { validateMeasurement, parseNumeric, normalizePhone, validateEmail } from '../validation';

describe('Validation Utilities', () => {
  describe('parseNumeric', () => {
    it('should parse valid numbers', () => {
      expect(parseNumeric('10')).toBe(10);
      expect(parseNumeric('10.5')).toBe(10.5);
      expect(parseNumeric(10)).toBe(10);
    });

    it('should return null for invalid values', () => {
      expect(parseNumeric('')).toBeNull();
      expect(parseNumeric(null)).toBeNull();
      expect(parseNumeric(undefined)).toBeNull();
      expect(parseNumeric('abc')).toBeNull();
    });
  });

  describe('normalizePhone', () => {
    it('should normalize phone numbers', () => {
      expect(normalizePhone('+1234567890')).toBe('+1234567890');
      expect(normalizePhone('(123) 456-7890')).toBe('1234567890');
      expect(normalizePhone('123-456-7890')).toBe('1234567890');
    });

    it('should return null for empty values', () => {
      expect(normalizePhone('')).toBeNull();
      expect(normalizePhone(null)).toBeNull();
      expect(normalizePhone(undefined)).toBeNull();
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
    });

    it('should return true for empty/null (optional field)', () => {
      expect(validateEmail('')).toBe(true);
      expect(validateEmail(null)).toBe(true);
      expect(validateEmail(undefined)).toBe(true);
    });
  });

  describe('validateMeasurement', () => {
    it('should validate a complete measurement', () => {
      const measurement = {
        client_name: 'John Doe',
        client_phone: '1234567890',
        units: 'cm',
        chest: 100,
        sleeve_length: 60,
      };

      const result = validateMeasurement(measurement, 'cm');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require client name or phone', () => {
      const measurement = {
        units: 'cm',
        chest: 100,
      };

      const result = validateMeasurement(measurement, 'cm');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'client_info')).toBe(true);
    });

    it('should require at least one measurement field', () => {
      const measurement = {
        client_name: 'John Doe',
        units: 'cm',
      };

      const result = validateMeasurement(measurement, 'cm');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'measurements')).toBe(true);
    });

    it('should validate numeric ranges', () => {
      const measurement = {
        client_name: 'John Doe',
        units: 'cm',
        chest: 300, // Out of range
      };

      const result = validateMeasurement(measurement, 'cm');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should accept valid ranges', () => {
      const measurement = {
        client_name: 'John Doe',
        units: 'cm',
        chest: 100, // Valid range: 50-200
        sleeve_length: 60, // Valid range: 20-100
      };

      const result = validateMeasurement(measurement, 'cm');
      expect(result.isValid).toBe(true);
    });
  });
});

