/**
 * CSV/Excel import parsing utilities
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { parseNumeric, normalizePhone, validateMeasurement, ValidationResult } from './validation';

export interface ImportRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: string[];
  isValid: boolean;
}

export interface ImportPreview {
  rows: ImportRow[];
  headers: string[];
  totalRows: number;
}

/**
 * Column mapping configuration
 * Maps various possible column names to our standard field names
 */
const COLUMN_MAPPINGS: Record<string, string> = {
  // Client info
  'client name': 'client_name',
  'name': 'client_name',
  'name (reference)': 'client_name',
  'client information (name (reference))': 'client_name',
  'client phone': 'client_phone',
  'phone': 'client_phone',
  'phone number': 'client_phone',
  'client information (phone number)': 'client_phone',
  'client email': 'client_email',
  'email': 'client_email',
  'client information (email)': 'client_email',
  'client address': 'client_address',
  'address': 'client_address',
  'client information (address)': 'client_address',
  
  // Entry info
  'entry id': 'entry_id',
  'entry date': 'entry_date',
  'date updated': 'date_updated',
  'created by': 'created_by',
  'created by (user id)': 'created_by',
  'branch': 'branch',
  'units': 'units',
  
  // Top measurements
  'across back': 'across_back',
  'chest': 'chest',
  'sleeve length': 'sleeve_length',
  'sleeve lenght': 'sleeve_length', // Common typo
  'around arm': 'around_arm',
  'neck': 'neck',
  'top length': 'top_length',
  'wrist': 'wrist',
  
  // Trouser measurements
  'trouser waist': 'trouser_waist',
  'waist': 'trouser_waist',
  'trouser thigh': 'trouser_thigh',
  'thigh': 'trouser_thigh',
  'trouser knee': 'trouser_knee',
  'knee': 'trouser_knee',
  'trouser length': 'trouser_length',
  'trouser bars': 'trouser_bars',
  'bars': 'trouser_bars',
  
  // Additional
  'additional info': 'additional_info',
  'additional information': 'additional_info',
};

/**
 * Normalize column name for mapping
 */
const normalizeColumnName = (name: string): string => {
  return name.toLowerCase().trim();
};

/**
 * Auto-map columns from import headers to our field names
 */
export const autoMapColumns = (headers: string[]): Record<string, string> => {
  const mapping: Record<string, string> = {};
  
  headers.forEach((header) => {
    const normalized = normalizeColumnName(header);
    const mappedField = COLUMN_MAPPINGS[normalized];
    if (mappedField) {
      mapping[header] = mappedField;
    }
  });
  
  return mapping;
};

/**
 * Parse CSV file
 */
export const parseCSV = async (file: File | Buffer): Promise<{ data: any[]; headers: string[] }> => {
  return new Promise((resolve, reject) => {
    const isBuffer = Buffer.isBuffer(file);
    const content = isBuffer ? file.toString('utf-8') : file;

    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error('Failed to parse CSV: ' + results.errors[0].message));
          return;
        }
        resolve({
          data: results.data,
          headers: results.meta.fields || [],
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

/**
 * Parse Excel file
 */
export const parseExcel = async (file: File | Buffer): Promise<{ data: any[]; headers: string[] }> => {
  const workbook = isBuffer ? XLSX.read(file, { type: 'buffer' }) : XLSX.read(file, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
  
  if (jsonData.length === 0) {
    return { data: [], headers: [] };
  }
  
  const headers = Object.keys(jsonData[0] as any);
  return { data: jsonData, headers };
};

/**
 * Map and validate import rows
 */
export const processImportRows = (
  rows: any[],
  columnMapping: Record<string, string>,
  defaultUnit: 'cm' | 'in' = 'cm'
): ImportRow[] => {
  return rows.map((row, index) => {
    const mappedRow: Record<string, any> = {};
    const errors: string[] = [];
    
    // Map columns
    Object.entries(columnMapping).forEach(([sourceCol, targetField]) => {
      if (row[sourceCol] != null && row[sourceCol] !== '') {
        mappedRow[targetField] = row[sourceCol];
      }
    });
    
    // Normalize units
    const units = (mappedRow.units || defaultUnit).toLowerCase();
    mappedRow.units = units === 'in' || units === 'inches' ? 'in' : 'cm';
    
    // Parse numeric fields
    const numericFields = [
      'across_back', 'chest', 'sleeve_length', 'around_arm', 'neck',
      'top_length', 'wrist', 'trouser_waist', 'trouser_thigh',
      'trouser_knee', 'trouser_length', 'trouser_bars',
    ];
    
    numericFields.forEach((field) => {
      if (mappedRow[field] != null) {
        const parsed = parseNumeric(mappedRow[field]);
        mappedRow[field] = parsed;
      }
    });
    
    // Normalize phone
    if (mappedRow.client_phone) {
      mappedRow.client_phone = normalizePhone(mappedRow.client_phone);
    }
    
    // Validate
    const validation = validateMeasurement(mappedRow, mappedRow.units as 'cm' | 'in');
    if (!validation.isValid) {
      errors.push(...validation.errors.map((e) => e.message));
    }
    
    return {
      rowNumber: index + 1,
      data: mappedRow,
      errors,
      isValid: errors.length === 0,
    };
  });
};

/**
 * Create import preview (first N rows)
 */
export const createImportPreview = (
  rows: ImportRow[],
  limit: number = 10
): ImportPreview => {
  return {
    rows: rows.slice(0, limit),
    headers: rows.length > 0 ? Object.keys(rows[0].data) : [],
    totalRows: rows.length,
  };
};

