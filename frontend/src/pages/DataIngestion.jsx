import { useState, useCallback } from 'react';
import { ingestionApi } from '../services/api';
import { showToast } from '../components/Toast';

const TABS = [
  { id: 'customers', label: 'Customers', upload: ingestionApi.uploadCustomers },
  { id: 'products', label: 'Products', upload: ingestionApi.uploadProducts },
  { id: 'inventory', label: 'Inventory', upload: ingestionApi.uploadInventory },
  { id: 'sales', label: 'Sales', upload: ingestionApi.uploadSales },
];

export default function DataIngestion() {
  const [activeTab, setActiveTab] = useState('customers');
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [drag, setDrag] = useState(false);

  const upload = TABS.find((t) => t.id === activeTab)?.upload;

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDrag(false);
      const f = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
      if (f && f.name.endsWith('.csv')) {
        setFile(f);
        setResult(null);
      } else {
        showToast('Please select a CSV file', 'error');
      }
    },
    []
  );

  const onDragOver = (e) => {
    e.preventDefault();
    setDrag(true);
  };
  const onDragLeave = () => setDrag(false);

  const handleUpload = async () => {
    if (!file || !upload) return;
    setLoading(true);
    setResult(null);
    setProgress(0);
    try {
      const res = await upload(file);
      setResult(res.data);
      showToast('Upload completed', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Upload failed', 'error');
      setResult(err.response?.data || null);
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-surface-900">Data ingestion</h1>
        <p className="text-surface-500 mt-0.5">Upload CSV files for customers, inventory, or sales</p>
      </div>

      <div className="flex gap-2 border-b border-surface-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setActiveTab(t.id); setFile(null); setResult(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-250 ${
              activeTab === t.id ? 'bg-white border border-b-0 border-surface-200 text-surface-900 -mb-px' : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-surface-200 shadow-card p-6">
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors duration-250 ${
            drag ? 'border-primary-500 bg-primary-50' : 'border-surface-200 bg-surface-50'
          }`}
        >
          <input
            type="file"
            accept=".csv"
            className="hidden"
            id="csv-upload"
            onChange={(e) => onDrop(e)}
          />
          <label htmlFor="csv-upload" className="cursor-pointer block">
            <p className="text-surface-600 mb-1">Drag & drop a CSV file here, or click to browse</p>
            <p className="text-sm text-surface-400">Accepted: .csv only</p>
          </label>
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="text-sm text-surface-600 truncate">{file.name}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearFile}
                className="text-sm text-surface-500 hover:text-surface-700"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={loading}
                className="px-4 py-2 bg-surface-900 text-white text-sm font-medium rounded-lg hover:bg-surface-800 disabled:opacity-50"
              >
                {loading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-4 h-1.5 bg-surface-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}

        {result?.summary && (
          <div className="mt-6 p-4 bg-surface-50 rounded-lg border border-surface-200">
            <h3 className="text-sm font-semibold text-surface-900 mb-2">Ingestion summary</h3>
            <ul className="text-sm text-surface-600 space-y-1">
              <li>Processed: {result.summary.processed}</li>
              <li>Rejected: {result.summary.rejected}</li>
              {result.summary.cleaned != null && <li>Cleaned: {result.summary.cleaned}</li>}
              <li>Total rows: {result.summary.total}</li>
            </ul>
          </div>
        )}

        {result?.preview && Array.isArray(result.preview) && result.preview.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <h3 className="text-sm font-semibold text-surface-900 mb-2">Preview</h3>
            <table className="w-full text-sm border border-surface-200 rounded-lg overflow-hidden">
              <thead className="bg-surface-100">
                <tr>
                  {Object.keys(result.preview[0]).map((k) => (
                    <th key={k} className="text-left px-3 py-2 font-medium text-surface-700">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.preview.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t border-surface-200">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-3 py-2 text-surface-600">{String(v ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
