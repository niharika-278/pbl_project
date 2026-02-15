import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { analyticsApi } from '../services/api';

const KPI_CARDS = [
  { key: 'totalRevenue', label: 'Total Revenue', format: (v) => `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
  { key: 'totalOrders', label: 'Total Orders', format: (v) => String(v) },
  { key: 'activeCustomers', label: 'Active Customers', format: (v) => String(v) },
  { key: 'lowStockItems', label: 'Low Stock Items', format: (v) => String(v) },
  { key: 'expiredOrNearExpiry', label: 'Expired / Near Expiry', format: (v) => String(v) },
];

const COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#64748b'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    analyticsApi
      .getDashboard()
      .then((res) => {
        if (!cancelled) setData(res.data.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-surface-300 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">
        {error}
      </div>
    );
  }

  const { kpis, popularCategories, salesByDay, revenueTrend } = data || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-surface-900">Dashboard</h1>
        <p className="text-surface-500 mt-0.5">Analytics overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {KPI_CARDS.map(({ key, label, format }) => (
          <div
            key={key}
            className="bg-white rounded-xl border border-surface-200 shadow-card p-5 transition-shadow duration-250 hover:shadow-md"
          >
            <p className="text-sm font-medium text-surface-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-surface-900">
              {format(kpis?.[key] ?? 0)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Popular categories</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={popularCategories || []}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, total }) => `${name}: ₹${Number(total).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                >
                  {(popularCategories || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Sales by day (last 30 days)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByDay || []} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Amount']} labelFormatter={(v) => `Date: ${v}`} />
                <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
        <h2 className="text-lg font-semibold text-surface-900 mb-4">Revenue trend (last 90 days)</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueTrend || []} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} labelFormatter={(v) => `Date: ${v}`} />
              <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
