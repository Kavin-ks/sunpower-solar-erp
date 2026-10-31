import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { DashboardMetrics } from '../types';
import {
  Users,
  Compass,
  FileCheck,
  ShoppingCart,
  Wrench,
  CircleDollarSign,
  Boxes,
  Headphones,
  Download,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard?period=${period}`);
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/dashboard/export-profitability-csv', '_blank');
  };

  const formatCurrency = (val: number | undefined) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899'];

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Director Dashboard</h1>
          <p className="text-sm text-slate-500">Live operational & financial performance metrics</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-white border border-slate-200 rounded-lg p-1 flex space-x-1 text-xs shadow-xs">
            {['today', 'this_week', 'this_month', 'all'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition cursor-pointer ${
                  period === p
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {p.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row 1: Pipeline & Customer Lifecycle */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Customer Leads</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics?.totalEnquiries || 0}</div>
          <p className="text-xs text-slate-500 mt-1">
            <span className="text-emerald-600 font-semibold">{metrics?.newEnquiries || 0} new</span> leads to qualify
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Site Surveys</span>
            <Compass className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics?.approvedSurveys || 0}</div>
          <p className="text-xs text-slate-500 mt-1">
            <span className="text-blue-600 font-semibold">{metrics?.pendingSurveys || 0} pending</span> technician inspection
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Confirmed Orders</span>
            <ShoppingCart className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics?.confirmedOrders || 0}</div>
          <p className="text-xs text-slate-500 mt-1">
            <span className="text-amber-600 font-semibold">{metrics?.pendingQuotations || 0} quotes</span> awaiting sign-off
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Installations</span>
            <Wrench className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics?.completedInstallations || 0}</div>
          <p className="text-xs text-slate-500 mt-1">
            <span className="text-purple-600 font-semibold">{metrics?.activeInstallations || 0} active</span> on rooftop sites
          </p>
        </div>
      </div>

      {/* KPI Cards Row 2: Financial Metrics & Cash Flow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Total Invoiced</div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(metrics?.totalInvoiced)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Contracted sales pipeline</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">Cash Collected</div>
          <div className="text-2xl font-bold text-emerald-700">{formatCurrency(metrics?.totalPaymentsReceived)}</div>
          <p className="text-[11px] text-emerald-600 mt-1">Bank verified customer receipts</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Outstanding Receivables</div>
          <div className="text-2xl font-bold text-rose-600">{formatCurrency(metrics?.totalOutstanding)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Remaining customer balances</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Net Operating Profit</div>
          <div className="text-2xl font-bold text-emerald-700">{formatCurrency(metrics?.netProfit)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Revenue minus all project & tech costs</p>
        </div>
      </div>

      {/* Charts Section: Monthly Financials & Capacity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Revenue, Cost & Profit Trend (₹ INR)</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Monthly Performance</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.revenueTrends || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="revenue" name="Revenue Received" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" name="Project Costs" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Net Profit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>System Capacity Mix</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">kW System Distribution</span>
          </div>
          <div className="h-64 flex flex-col justify-between">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={metrics?.capacityDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="capacity"
                >
                  {(metrics?.capacityDistribution || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
              {(metrics?.capacityDistribution || []).map((item, index) => (
                <div key={item.capacity} className="flex items-center space-x-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="truncate">{item.capacity}: <strong>{item.count}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Inventory & Support Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Warehouse Inventory Value</div>
              <p className="text-xs text-slate-500">
                {formatCurrency(metrics?.totalStockValue)} stored across bays
              </p>
            </div>
          </div>
          <div>
            {metrics?.lowStockCount ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{metrics.lowStockCount} Low Stock</span>
              </span>
            ) : (
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-medium">Healthy</span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">After-Sales Service Status</div>
              <p className="text-xs text-slate-500">Breakdown maintenance & warranty tickets</p>
            </div>
          </div>
          <div>
            <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
              {metrics?.openServiceTickets || 0} Open Tickets
            </span>
          </div>
        </div>
      </div>

      {/* Job-wise Profitability Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Job-Wise Profit & Loss Ledger</h2>
            <p className="text-xs text-slate-500">Breakdown of customer payments, hardware costs, technician payout, and profit margin per installation</p>
          </div>
          <button
            onClick={handleExportCsv}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center space-x-1"
          >
            <span>Download Full Report</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4 text-right">Order Value</th>
                <th className="py-3 px-4 text-right">Received</th>
                <th className="py-3 px-4 text-right">Hardware Cost</th>
                <th className="py-3 px-4 text-right">Labour/Tech</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-right">Net Profit</th>
                <th className="py-3 px-4 text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(metrics?.recentJobProfitability || []).map((job) => (
                <tr key={job.orderId} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">{job.orderNumber}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{job.customerName}</td>
                  <td className="py-3 px-4">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                      {job.capacityKw} kW {job.systemType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium">{formatCurrency(job.orderAmount)}</td>
                  <td className="py-3 px-4 text-right text-emerald-700 font-semibold">{formatCurrency(job.revenueReceived)}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(job.hardwareCost)}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(job.technicianCost)}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-800">{formatCurrency(job.totalCost)}</td>
                  <td className={`py-3 px-4 text-right font-bold ${job.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {formatCurrency(job.netProfit)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      job.profitMarginPercentage >= 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {job.profitMarginPercentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
