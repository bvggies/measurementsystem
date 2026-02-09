import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { ImportRow } from '../utils/importParser';
import { useTheme } from '../contexts/ThemeContext';

const ImportPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    try {
      // Convert file to base64 for Vercel serverless function
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = (e.target?.result as string).split(',')[1]; // Remove data:...;base64, prefix
          
          const response = await axios.post('/api/measurements/import', {
            fileData: base64Data,
            fileName: file.name,
            fileType: file.type,
            defaultUnit: 'cm',
          });

          setPreview(response.data);
        } catch (error: any) {
          alert(error.response?.data?.error || 'Upload failed');
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        alert('Failed to read file');
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Upload failed');
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!preview) return;

    setCommitting(true);
    try {
      const response = await axios.post('/api/measurements/import/commit', {
        importId: preview.importId,
        rows: preview.preview.rows.map((r: ImportRow) => r.data),
        columnMapping: preview.columnMapping,
        fileName: preview.fileName,
        defaultUnit: 'cm',
      });

      setResult(response.data);
      alert(`Import completed! ${response.data.successCount} successful, ${response.data.failedCount} failed.`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Commit failed');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className={`text-3xl font-bold ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>Import Measurements</h1>
      </motion.div>

      {/* File Upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        data-aos="fade-up"
        className={`rounded-xl shadow-md p-6 border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200'}`}
      >
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>Upload File</h2>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
              Select CSV or Excel file
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          {file && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">Selected: {file.name}</p>
              <p className="text-xs text-gray-500">Size: {(file.size / 1024).toFixed(2)} KB</p>
            </div>
          )}
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="px-6 py-2 bg-primary-navy text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Upload & Preview'}
          </button>
        </div>
      </motion.div>

      {/* Preview */}
      {preview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          data-aos="fade-up"
          className={`rounded-xl shadow-md p-6 border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>Preview</h2>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {preview.statistics.validRows} valid / {preview.statistics.totalRows} total
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={isDark ? 'bg-dark-border/50' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-4 py-2 text-left ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Row</th>
                  <th className={`px-4 py-2 text-left ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Status</th>
                  <th className={`px-4 py-2 text-left ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Customer</th>
                  <th className={`px-4 py-2 text-left ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Phone</th>
                  <th className={`px-4 py-2 text-left ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Errors</th>
                </tr>
              </thead>
              <tbody className={isDark ? 'divide-y divide-dark-border' : 'divide-y divide-gray-200'}>
                {preview.preview.rows.map((row: ImportRow) => (
                  <tr
                    key={row.rowNumber}
                    className={row.isValid ? (isDark ? 'bg-dark-bg' : 'bg-white') : (isDark ? 'bg-red-900/20' : 'bg-red-50')}
                  >
                    <td className={`px-4 py-2 ${isDark ? 'text-dark-text' : ''}`}>{row.rowNumber}</td>
                    <td className={`px-4 py-2 ${isDark ? 'text-dark-text' : ''}`}>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          row.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {row.isValid ? 'Valid' : 'Invalid'}
                      </span>
                    </td>
                    <td className={`px-4 py-2 ${isDark ? 'text-dark-text' : ''}`}>{row.data.client_name || 'N/A'}</td>
                    <td className={`px-4 py-2 ${isDark ? 'text-dark-text' : ''}`}>{row.data.client_phone || 'N/A'}</td>
                    <td className={`px-4 py-2 text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                      {row.errors.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={handleCommit}
              disabled={committing || preview.statistics.validRows === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {committing ? 'Committing...' : 'Commit Import'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-xl shadow-md p-6 border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200'}`}
        >
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>Import Result</h2>
          <div className={`space-y-2 ${isDark ? 'text-gray-300' : ''}`}>
            <p>Successfully imported: {result.successCount} rows</p>
            <p>Failed: {result.failedCount} rows</p>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-4">
                <h3 className={`font-medium mb-2 ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>Errors:</h3>
                <ul className={`list-disc list-inside text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  {result.errors.slice(0, 10).map((err: any, idx: number) => (
                    <li key={idx}>Row {err.rowNumber}: {err.errors?.join(', ') || err.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ImportPage;

