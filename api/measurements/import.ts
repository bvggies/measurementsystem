/**
 * POST /api/measurements/import
 * Upload and parse CSV/Excel file, return preview with validation
 */

// Vercel serverless function types
interface VercelRequest {
  method?: string;
  body?: any;
  query?: any;
  headers?: any;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
}

import { parseCSV, parseExcel, autoMapColumns, processImportRows, createImportPreview } from '../../src/utils/importParser';
import { requireRole } from '../../src/utils/auth';

// For Vercel, we'll handle file uploads differently
// In production, use Vercel's built-in multipart handling or a service like Cloudinary

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = requireRole(['admin'])(req);

    // Handle file upload - for Vercel, expect base64 or buffer in body
    // In production, consider using a file upload service or Vercel Blob Storage
    const { fileData, fileName, fileType } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: 'No file data provided' });
    }

    // Convert base64 to buffer if needed
    let fileBuffer: Buffer;
    if (typeof fileData === 'string') {
      // Assume base64 encoded
      fileBuffer = Buffer.from(fileData, 'base64');
    } else {
      fileBuffer = Buffer.from(fileData);
    }

    const fileExt = (fileName || 'import.csv').split('.').pop()?.toLowerCase();

    // Parse file based on extension
    let parsedData: { data: any[]; headers: string[] };
    if (fileExt === 'xlsx' || fileExt === 'xls') {
      parsedData = await parseExcel(fileBuffer);
    } else {
      parsedData = await parseCSV(fileBuffer);
    }

    if (parsedData.data.length === 0) {
      return res.status(400).json({ error: 'File is empty or could not be parsed' });
    }

    // Auto-map columns
    const columnMapping = autoMapColumns(parsedData.headers);
    const defaultUnit = req.body.defaultUnit || 'cm';

    // Process and validate rows
    const processedRows = processImportRows(parsedData.data, columnMapping, defaultUnit as 'cm' | 'in');

    // Create preview (first 10 rows)
    const preview = createImportPreview(processedRows, 10);

    // Calculate statistics
    const totalRows = processedRows.length;
    const validRows = processedRows.filter((r) => r.isValid).length;
    const invalidRows = totalRows - validRows;

    // Store import session (in production, use Redis or database)
    const importId = `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return res.status(200).json({
      importId,
      fileName,
      preview,
      statistics: {
        totalRows,
        validRows,
        invalidRows,
      },
      columnMapping,
      headers: parsedData.headers,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions') {
      return res.status(403).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

