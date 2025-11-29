import { cmToIn, inToCm, convertUnit, convertMeasurementUnits } from '../unitConversion';

describe('Unit Conversion Utilities', () => {
  describe('cmToIn', () => {
    it('should convert centimeters to inches correctly', () => {
      expect(cmToIn(2.54)).toBeCloseTo(1, 2);
      expect(cmToIn(5.08)).toBeCloseTo(2, 2);
      expect(cmToIn(0)).toBe(0);
    });

    it('should handle invalid inputs', () => {
      expect(cmToIn(NaN)).toBe(0);
      expect(cmToIn(null as any)).toBe(0);
    });
  });

  describe('inToCm', () => {
    it('should convert inches to centimeters correctly', () => {
      expect(inToCm(1)).toBeCloseTo(2.54, 2);
      expect(inToCm(2)).toBeCloseTo(5.08, 2);
      expect(inToCm(0)).toBe(0);
    });

    it('should handle invalid inputs', () => {
      expect(inToCm(NaN)).toBe(0);
      expect(inToCm(null as any)).toBe(0);
    });
  });

  describe('convertUnit', () => {
    it('should convert from cm to in', () => {
      expect(convertUnit(2.54, 'cm', 'in')).toBeCloseTo(1, 2);
    });

    it('should convert from in to cm', () => {
      expect(convertUnit(1, 'in', 'cm')).toBeCloseTo(2.54, 2);
    });

    it('should return same value if units are the same', () => {
      expect(convertUnit(10, 'cm', 'cm')).toBe(10);
      expect(convertUnit(10, 'in', 'in')).toBe(10);
    });
  });

  describe('convertMeasurementUnits', () => {
    it('should convert all measurement fields', () => {
      const measurement = {
        units: 'cm',
        across_back: 50,
        chest: 100,
        sleeve_length: 60,
        trouser_waist: 80,
        additional_info: 'test',
      };

      const converted = convertMeasurementUnits(measurement, 'cm', 'in');
      
      expect(converted.units).toBe('in');
      expect(converted.across_back).toBeCloseTo(19.69, 1);
      expect(converted.chest).toBeCloseTo(39.37, 1);
      expect(converted.additional_info).toBe('test'); // Non-numeric fields unchanged
    });

    it('should handle null values', () => {
      const measurement = {
        units: 'cm',
        across_back: null,
        chest: 100,
      };

      const converted = convertMeasurementUnits(measurement, 'cm', 'in');
      expect(converted.across_back).toBeNull();
      expect(converted.chest).toBeCloseTo(39.37, 1);
    });
  });
});

