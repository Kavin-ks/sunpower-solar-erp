import React, { useState, useEffect } from 'react';
import {
  CircleDollarSign,
  FileText,
  Receipt,
  Award,
  Plus,
  Search,
  Printer,
  Download,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Briefcase,
  X,
  FileCheck,
  Building,
  RotateCcw,
  CheckCircle,
  Clock,
  Filter,
  DollarSign,
  UserCheck,
  ChevronRight,
  ShieldAlert,
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
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  JobProfitability,
  Invoice,
  Expense,
  SubsidyApplication,
  SalesOrder,
  Payment,
  TechnicianPayment,
  Technician,
  Installation,
  ExpenseCategory,
  SubsidyStatus,
  PaymentMethod,
  PaymentType,
  FinanceDashboard,
} from '../types';
import { StatusBadge } from '../components/ui/Badge';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

export const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'payments' | 'profitability' | 'invoices' | 'payouts' | 'subsidies' | 'expenses'
  >('dashboard');

  const [dashboardData, setDashboardData] = useState<FinanceDashboard | null>(null);
  const [profitability, setProfitability] = useState<JobProfitability[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subsidies, setSubsidies] = useState<SubsidyApplication[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payouts, setPayouts] = useState<TechnicianPayment[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [profitFilter, setProfitFilter] = useState<'ALL' | 'PROFITABLE' | 'LOW_MARGIN' | 'LOSS_MAKING'>('ALL');
  const [period, setPeriod] = useState('THIS_MONTH');

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isSubsidyModalOpen, setIsSubsidyModalOpen] = useState(false);
  const [isReversePaymentModalOpen, setIsReversePaymentModalOpen] = useState(false);
  const [isCancelInvoiceModalOpen, setIsCancelInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedSubsidy, setSelectedSubsidy] = useState<SubsidyApplication | null>(null);
  const [selectedPaymentForReversal, setSelectedPaymentForReversal] = useState<Payment | null>(null);
  const [selectedInvoiceForCancel, setSelectedInvoiceForCancel] = useState<Invoice | null>(null);

  // Forms
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'TRANSPORT' as ExpenseCategory,
    amount: '',
    paidTo: '',
    paymentMethod: 'Bank Transfer',
    description: '',
    salesOrderId: '',
    expenseDate: new Date().toISOString().slice(0, 10),
  });

  const [paymentForm, setPaymentForm] = useState({
    salesOrderId: '',
    amount: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    method: 'BANK_TRANSFER' as PaymentMethod,
    type: 'ADVANCE' as PaymentType,
    referenceNumber: '',
    notes: '',
  });

  const [payoutForm, setPayoutForm] = useState({
    technicianId: '',
    installationId: '',
    hoursCounted: '',
    applicableRate: '250',
    amountPaid: '',
    paymentMethod: 'Bank Transfer',
    referenceNumber: '',
    notes: '',
  });

  const [subsidyForm, setSubsidyForm] = useState({
    status: 'SUBMITTED' as SubsidyStatus,
    nationalPortalRegNumber: '',
    subsidyAmountApproved: '',
    sanctionDate: '',
    amountReceived: '',
    actualReceiptDate: '',
    notes: '',
  });

  const [reversalReason, setReversalReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, profRes, invRes, expRes, subRes, payRes, payoRes, ordRes, techRes, instRes] = await Promise.all([
        api.get(`/api/finance/dashboard?period=${period}`),
        api.get('/api/finance/job-profitability'),
        api.get('/api/finance/invoices'),
        api.get('/api/finance/expenses'),
        api.get('/api/finance/subsidies'),
        api.get('/api/payments'),
        api.get('/api/finance/technician-payouts'),
        api.get('/api/orders'),
        api.get('/api/technicians'),
        api.get('/api/installations'),
      ]);

      if (dashRes?.data) setDashboardData(dashRes.data);
      setProfitability(profRes?.data || []);
      setInvoices(invRes?.data || []);
      setExpenses(expRes?.data || []);
      setSubsidies(subRes?.data || []);
      setPayments(payRes?.data || []);
      setPayouts(payoRes?.data || []);
      setOrders(ordRes?.data || []);
      setTechnicians(techRes?.data || []);
      setInstallations(instRes?.data || []);
    } catch (err: any) {
      console.error('Failed to load finance data', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to connect to backend Finance APIs. Please ensure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  // Form Handlers
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/finance/expenses', {
        title: expenseForm.title.trim(),
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        paidTo: expenseForm.paidTo,
        paymentMethod: expenseForm.paymentMethod,
        description: expenseForm.description,
        expenseDate: expenseForm.expenseDate,
        salesOrderId: expenseForm.salesOrderId ? Number(expenseForm.salesOrderId) : undefined,
      });
      setIsExpenseModalOpen(false);
      setExpenseForm({
        title: '',
        category: 'TRANSPORT',
        amount: '',
        paidTo: '',
        paymentMethod: 'Bank Transfer',
        description: '',
        salesOrderId: '',
        expenseDate: new Date().toISOString().slice(0, 10),
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record expense');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.salesOrderId) {
      alert('Please select an order');
      return;
    }
    try {
      await api.post('/api/payments', {
        salesOrderId: Number(paymentForm.salesOrderId),
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        method: paymentForm.method,
        type: paymentForm.type,
        referenceNumber: paymentForm.referenceNumber.trim(),
        notes: paymentForm.notes,
      });
      setIsPaymentModalOpen(false);
      setPaymentForm({
        salesOrderId: '',
        amount: '',
        paymentDate: new Date().toISOString().slice(0, 10),
        method: 'BANK_TRANSFER',
        type: 'ADVANCE',
        referenceNumber: '',
        notes: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleReversePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForReversal) return;
    if (!reversalReason.trim()) {
      alert('Please provide an audit reason for the reversal.');
      return;
    }
    try {
      await api.post(`/api/payments/${selectedPaymentForReversal.id}/reverse`, {
        reason: reversalReason.trim(),
      });
      setIsReversePaymentModalOpen(false);
      setSelectedPaymentForReversal(null);
      setReversalReason('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reverse payment');
    }
  };

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutForm.technicianId) {
      alert('Please select a technician');
      return;
    }
    try {
      await api.post('/api/finance/technician-payouts', {
        technicianId: Number(payoutForm.technicianId),
        installationId: payoutForm.installationId ? Number(payoutForm.installationId) : undefined,
        hoursCounted: Number(payoutForm.hoursCounted),
        applicableRate: Number(payoutForm.applicableRate),
        amountPaid: Number(payoutForm.amountPaid),
        paymentMethod: payoutForm.paymentMethod,
        referenceNumber: payoutForm.referenceNumber.trim() || undefined,
        notes: payoutForm.notes || undefined,
      });
      setIsPayoutModalOpen(false);
      setPayoutForm({
        technicianId: '',
        installationId: '',
        hoursCounted: '',
        applicableRate: '250',
        amountPaid: '',
        paymentMethod: 'Bank Transfer',
        referenceNumber: '',
        notes: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record technician payout');
    }
  };

  const handleUpdateSubsidy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubsidy) return;
    try {
      await api.patch(`/api/finance/subsidies/${selectedSubsidy.id}/status`, {
        status: subsidyForm.status,
        nationalPortalRegNumber: subsidyForm.nationalPortalRegNumber.trim() || undefined,
        subsidyAmountApproved: subsidyForm.subsidyAmountApproved
          ? Number(subsidyForm.subsidyAmountApproved)
          : undefined,
        sanctionDate: subsidyForm.sanctionDate || undefined,
        amountReceived: subsidyForm.amountReceived ? Number(subsidyForm.amountReceived) : undefined,
        actualReceiptDate: subsidyForm.actualReceiptDate || undefined,
        notes: subsidyForm.notes || undefined,
      });
      setIsSubsidyModalOpen(false);
      setSelectedSubsidy(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update subsidy status');
    }
  };

  const handleCancelInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForCancel) return;
    if (!cancelReason.trim()) {
      alert('Please specify the reason for cancellation.');
      return;
    }
    try {
      await api.post(`/api/finance/invoices/${selectedInvoiceForCancel.id}/cancel`, {
        reason: cancelReason.trim(),
        cancelledBy: 'Finance Controller',
      });
      setIsCancelInvoiceModalOpen(false);
      setSelectedInvoiceForCancel(null);
      setCancelReason('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel invoice');
    }
  };

  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');

  const downloadCsv = async (endpoint: string, filename: string) => {
    try {
      const response = await api.get(endpoint, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download CSV', err);
    }
  };

  const exportJobProfitabilityCsv = () => {
    downloadCsv('/api/finance/export/job-profitability', `SunPower_Job_Profitability_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Filtering Profitability
  const filteredProfitability = profitability.filter((job) => {
    const matchesSearch =
      job.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (profitFilter === 'PROFITABLE') {
      return (job.profitabilityStatus === 'PROFITABLE' || job.profitMarginPercentage >= 25);
    }
    if (profitFilter === 'LOW_MARGIN') {
      return (
        job.profitabilityStatus === 'LOW_MARGIN' ||
        (job.profitMarginPercentage > 0 && job.profitMarginPercentage < 25)
      );
    }
    if (profitFilter === 'LOSS_MAKING') {
      return job.profitabilityStatus === 'LOSS_MAKING' || job.netProfit < 0;
    }
    return true;
  });

  // Aggregates
  const totalRevenueRecognized = profitability.reduce(
    (sum, j) => sum + (j.recognizedRevenue ?? j.orderAmount ?? 0),
    0
  );
  const totalCashReceived = profitability.reduce((sum, j) => sum + (j.revenueReceived || 0), 0);
  const totalOutstanding = profitability.reduce((sum, j) => sum + (j.outstandingBalance || 0), 0);
  const totalCost = profitability.reduce((sum, j) => sum + (j.totalCost || 0), 0);
  const totalProfit = profitability.reduce((sum, j) => sum + (j.netProfit || 0), 0);
  const averageMargin =
    profitability.length > 0
      ? (
          profitability.reduce((sum, j) => sum + (j.profitMarginPercentage || 0), 0) /
          profitability.length
        ).toFixed(1)
      : '0';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CircleDollarSign className="w-7 h-7 text-emerald-600" />
            Financial Management & Project Profitability
          </h1>
          <p className="text-sm text-slate-500 mt-1">
Real-time project gross margins, GST invoices, customer collections, technician payroll, & national solar subsidies.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2 rounded-lg bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition shadow-xs"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Record Customer Payment
          </button>
          <button
            onClick={() => setIsPayoutModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition shadow-xs"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Disburse Technician Payout
          </button>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 transition shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Direct Expense
          </button>
          <button
            onClick={exportJobProfitabilityCsv}
            className="inline-flex items-center px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition shadow-xs"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-500" />
            Export P&L
          </button>
        </div>
      </div>

      {/* Connection / API Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-sm text-rose-800">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <div className="font-semibold text-rose-900">Financial Service Connection Error</div>
              <div className="text-xs text-rose-700 mt-0.5">{error}</div>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Aggregate Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Recognized Revenue</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            ₹{totalRevenueRecognized.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Excl. GST Component</span>
            <span className="text-emerald-600 font-medium">₹{totalCashReceived.toLocaleString('en-IN')} Cash</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Receivables Due</div>
          <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1">Pending from Customers</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Project Costs (BOM + Labor)</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            ₹{totalCost.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1">Hardware + Crew + Transport</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Net Accounting Profit</div>
          <div
            className={`text-2xl font-bold mt-1 font-mono ${
              totalProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            ₹{totalProfit.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1">True Project Operating Margin</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Average Gross Margin</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">{averageMargin}%</div>
          <div className="text-xs text-emerald-700 mt-1 font-medium">Standard Target &ge; 25.0%</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
            activeTab === 'dashboard'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Finance Dashboard
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
            activeTab === 'payments'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Customer Payments ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('profitability')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
            activeTab === 'profitability'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Job-Wise Profitability ({profitability.length})
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
            activeTab === 'invoices'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          GST Tax Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
            activeTab === 'payouts'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Technician Payouts ({payouts.length})
        </button>
        <button
          onClick={() => setActiveTab('subsidies')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
            activeTab === 'subsidies'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          PM Surya Ghar Subsidies ({subsidies.length})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
            activeTab === 'expenses'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Direct Expenses ({expenses.length})
        </button>
      </div>

      {/* TAB 1: FINANCE DASHBOARD & KPI TRENDS */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Executive Financial Insights</h3>
              <p className="text-xs text-slate-500">Live operational cash flows, expense breakdown, and subsidy reconciliation</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Reporting Window:</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="THIS_MONTH">Current Month</option>
                <option value="THIS_QUARTER">Current Quarter</option>
                <option value="THIS_YEAR">Current Financial Year</option>
                <option value="ALL">All Recorded Time</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trend Chart */}
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center justify-between">
                <span>Revenue vs Direct Costs vs Net Profit (Last 6 Months)</span>
                <span className="text-xs text-slate-400 font-normal">Amounts in ₹ INR</span>
              </h4>
              <div className="h-72 w-full">
                {dashboardData?.monthlyRevenueTrends &&
                dashboardData.monthlyRevenueTrends.some((t: any) => t.revenue > 0 || t.cost > 0 || t.profit !== 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dashboardData.monthlyRevenueTrends}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                        labelStyle={{ fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="revenue" name="Revenue Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cost" name="Project Direct Costs" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" name="Net Realized Profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                    <TrendingUp className="w-8 h-8 text-slate-300" />
                    <p>No customer payment or project cost activity recorded for this period.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Expense Categories Breakdown */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="font-bold text-slate-800 text-sm mb-4">Direct Expense Distribution</h4>
              <div className="h-48 w-full">
                {dashboardData?.expenseCategoryBreakdown &&
                dashboardData.expenseCategoryBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.expenseCategoryBreakdown}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                      >
                        {dashboardData.expenseCategoryBreakdown.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => `₹${Number(val).toLocaleString('en-IN')}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                    <Receipt className="w-8 h-8 text-slate-300" />
                    <p>No expenses recorded yet.</p>
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2 max-h-32 overflow-y-auto pr-1">
                {dashboardData?.expenseCategoryBreakdown?.map((cat: any, idx: number) => (
                  <div key={cat.category} className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      {cat.category.replace('_', ' ')}
                    </span>
                    <span className="font-mono font-semibold text-slate-900">
                      ₹{cat.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase">Pending Technician Disbursements</div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  ₹{(dashboardData?.pendingTechnicianPayouts || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Calculated based on verified installation labor</div>
              </div>
              <button
                onClick={() => setActiveTab('payouts')}
                className="text-xs text-emerald-600 font-semibold flex items-center hover:underline"
              >
                Review Payouts <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase">Subsidies Pending Receipt</div>
                <div className="text-xl font-bold font-mono text-amber-600 mt-1">
                  ₹{(dashboardData?.subsidiesPendingReceipt || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Approved by MNRE portal, awaiting treasury disbursement</div>
              </div>
              <button
                onClick={() => setActiveTab('subsidies')}
                className="text-xs text-emerald-600 font-semibold flex items-center hover:underline"
              >
                Reconcile Subsidies <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>

          {/* Accounts Receivable Aging Analysis */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h4 className="font-bold text-slate-800 text-sm mb-1">Accounts Receivable Aging Analysis</h4>
            <p className="text-xs text-slate-500 mb-4">Outstanding customer collection balances past order confirmation date</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase block">Current (0–30 Days)</span>
                <span className="text-base font-bold font-mono text-emerald-900 mt-1 block">
                  ₹{(dashboardData?.aging0To30Days || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-700">Active collection cycle</span>
              </div>
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg">
                <span className="text-[11px] font-semibold text-blue-800 uppercase block">31–60 Days</span>
                <span className="text-base font-bold font-mono text-blue-900 mt-1 block">
                  ₹{(dashboardData?.aging31To60Days || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-blue-700">First reminder phase</span>
              </div>
              <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-lg">
                <span className="text-[11px] font-semibold text-amber-800 uppercase block">61–90 Days</span>
                <span className="text-base font-bold font-mono text-amber-900 mt-1 block">
                  ₹{(dashboardData?.aging61To90Days || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-amber-700">Escalation phase</span>
              </div>
              <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-lg">
                <span className="text-[11px] font-semibold text-rose-800 uppercase block">&gt; 90 Days Critical</span>
                <span className="text-base font-bold font-mono text-rose-900 mt-1 block">
                  ₹{(dashboardData?.agingOver90Days || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-rose-700">Credit hold notice</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER PAYMENT MANAGEMENT */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Customer Receipts & Payment Ledger</h3>
              <p className="text-xs text-slate-500">
                Audited advance, progress, and final settlements with reversal protection
              </p>
            </div>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 transition"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Record New Payment
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Receipt #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Order Ref</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Reference / UTR</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No customer payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((pay) => (
                    <tr
                      key={pay.id}
                      className={`hover:bg-slate-50/70 transition ${
                        pay.status === 'REVERSED' ? 'bg-rose-50/30 line-through text-slate-400' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {pay.paymentNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{pay.paymentDate}</td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-700">
                        {pay.orderNumber || '-'}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {pay.method.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {pay.referenceNumber || 'N/A'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {pay.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{pay.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={pay.status} />
                        {pay.reversalReason && (
                          <div className="text-[10px] text-rose-600 mt-0.5 no-underline">
                            Reason: {pay.reversalReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {pay.status !== 'REVERSED' && (
                          <button
                            onClick={() => {
                              setSelectedPaymentForReversal(pay);
                              setIsReversePaymentModalOpen(true);
                            }}
                            title="Reverse Payment"
                            className="inline-flex items-center text-rose-600 hover:text-rose-800 font-medium text-xs gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reverse
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: JOB-WISE PROFITABILITY TABLE */}
      {activeTab === 'profitability' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Project-Wise Gross Profit, Hardware Cost & Realized Margins
              </h3>
              <span className="text-xs text-slate-500">
                Formula: Net Operating Profit = Recognized Revenue (Excl. GST) &minus; (Hardware BOM + Crew Labor + Transport + Service Expenses)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 md:w-60">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by Order # or Customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={profitFilter}
                onChange={(e: any) => setProfitFilter(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="ALL">All Profit Status</option>
                <option value="PROFITABLE">Profitable (&ge;25%)</option>
                <option value="LOW_MARGIN">Low Margin (0-25%)</option>
                <option value="LOSS_MAKING">Loss Making (&lt;0%)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Order #</th>
                  <th className="py-3 px-3">Customer & System</th>
                  <th className="py-3 px-3 text-right">Recognized Rev</th>
                  <th className="py-3 px-3 text-right">GST (Tax)</th>
                  <th className="py-3 px-3 text-right">Cash Inflow</th>
                  <th className="py-3 px-3 text-right">Hardware (BOM)</th>
                  <th className="py-3 px-3 text-right">Crew Labor</th>
                  <th className="py-3 px-3 text-right">Direct Exp</th>
                  <th className="py-3 px-3 text-right font-bold text-slate-800">Total Cost</th>
                  <th className="py-3 px-3 text-right font-bold text-emerald-800">Net Profit</th>
                  <th className="py-3 px-3 text-right font-bold">Margin</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProfitability.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-400">
                      No completed projects available for profitability analysis.
                    </td>
                  </tr>
                ) : (
                  filteredProfitability.map((job) => (
                    <tr key={job.orderId} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {job.orderNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{job.customerName}</div>
                        <div className="text-[11px] text-slate-500">
                          {job.capacityKw} kW • {job.systemType.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-800">
                        ₹{(job.recognizedRevenue ?? job.orderAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        ₹{(job.taxAmount ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">
                        ₹{job.revenueReceived.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        ₹{job.hardwareCost.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        ₹{(job.installationLaborCost ?? job.technicianCost ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        ₹{(job.otherExpenses ?? job.recordedExpenses ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        ₹{job.totalCost.toLocaleString('en-IN')}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono font-bold ${
                          job.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        ₹{job.netProfit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] ${
                            job.profitMarginPercentage >= 25
                              ? 'bg-emerald-100 text-emerald-800'
                              : job.profitMarginPercentage > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {job.profitMarginPercentage}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        ₹{job.outstandingBalance.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: GST TAX INVOICES */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Official GST Tax Invoices</h3>
              <p className="text-xs text-slate-500">
                Compliant with GST Rules (SAC 998731) • State of Supply: Tamil Nadu (33)
              </p>
            </div>
            <span className="text-xs text-slate-500">Generated on Order Confirmation</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Order Ref</th>
                  <th className="py-3 px-3">HSN/SAC</th>
                  <th className="py-3 px-3 text-right">Taxable Value</th>
                  <th className="py-3 px-3 text-right">CGST</th>
                  <th className="py-3 px-3 text-right">SGST</th>
                  <th className="py-3 px-3 text-right">Invoice Total</th>
                  <th className="py-3 px-3 text-right">Paid</th>
                  <th className="py-3 px-3 text-right">Balance</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-slate-400">
                      No invoices generated yet.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-50/70 transition ${
                        inv.status === 'CANCELLED' ? 'bg-rose-50/40 text-slate-400 line-through' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{inv.invoiceDate}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">
                        {inv.customer?.fullName}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {inv.salesOrder?.orderNumber}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {inv.hsnSacCode || 'SAC 998731'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        ₹{inv.subtotal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        ₹{(inv.cgstAmount ?? inv.taxAmount / 2).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        ₹{(inv.sgstAmount ?? inv.taxAmount / 2).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{inv.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold">
                        ₹{inv.paidAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        ₹{inv.balanceAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="inline-flex items-center text-slate-600 hover:text-slate-900 text-xs font-semibold gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          View
                        </button>
                        {inv.status !== 'CANCELLED' && (
                          <button
                            onClick={() => {
                              setSelectedInvoiceForCancel(inv);
                              setIsCancelInvoiceModalOpen(true);
                            }}
                            className="inline-flex items-center text-rose-600 hover:text-rose-800 text-xs font-semibold gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: TECHNICIAN PAYOUTS & PAYROLL */}
      {activeTab === 'payouts' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Technician Labor & Installation Payroll</h3>
              <p className="text-xs text-slate-500">
                Audited labor hours based on field installation sign-offs at ₹250.00/hr
              </p>
            </div>
            <button
              onClick={() => setIsPayoutModalOpen(true)}
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 transition"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Disburse Payout
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Payout #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Technician</th>
                  <th className="py-3 px-3">Installation Ref</th>
                  <th className="py-3 px-3 text-right">Hours Logged</th>
                  <th className="py-3 px-3 text-right">Rate / Hr</th>
                  <th className="py-3 px-3 text-right">Calculated</th>
                  <th className="py-3 px-3 text-right font-bold text-slate-900">Amount Paid</th>
                  <th className="py-3 px-3 text-right">Pending Due</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Ref / UTR</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-400">
                      No technician payouts available.
                    </td>
                  </tr>
                ) : (
                  payouts.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {pay.paymentNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{pay.paymentDate}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {pay.technician?.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {pay.installation?.installationNumber || 'General Job'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium">
                        {pay.hoursCounted ?? 0} hrs
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        ₹{(pay.hourlyRate ?? 250).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        ₹{(pay.calculatedAmount ?? pay.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-blue-700">
                        ₹{pay.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        ₹{(pay.remainingAmount ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">{pay.paymentMethod}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {pay.referenceNumber || '-'}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={pay.status || 'PAID'} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: PM SURYA GHAR SUBSIDIES */}
      {activeTab === 'subsidies' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                PM Surya Ghar: Muft Bijli Yojana National Portal Tracking
              </h3>
              <p className="text-xs text-slate-500">
                Direct Benefit Transfer (DBT) verification & government subsidy reconciliation
              </p>
            </div>
            <span className="text-xs text-slate-500 font-medium">MNRE Approved Scheme</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">App #</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Order Ref</th>
                  <th className="py-3 px-3">National Portal Reg #</th>
                  <th className="py-3 px-3 text-right">Claimed</th>
                  <th className="py-3 px-3 text-right">Approved</th>
                  <th className="py-3 px-3">Sanction Date</th>
                  <th className="py-3 px-3 text-right">Received</th>
                  <th className="py-3 px-3">Receipt Date</th>
                  <th className="py-3 px-3 text-right">Pending Balance</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subsidies.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-400">
                      No subsidy applications found.
                    </td>
                  </tr>
                ) : (
                  subsidies.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {sub.applicationNumber}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900">
                        {sub.customer?.fullName}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {sub.salesOrder?.orderNumber}
                      </td>
                      <td className="py-3 px-3 font-mono text-emerald-700 font-semibold">
                        {sub.nationalPortalRegNumber || 'Pending Submission'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        ₹{sub.subsidyAmountClaimed.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-blue-700">
                        ₹{(sub.subsidyAmountApproved || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{sub.sanctionDate || '-'}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        ₹{(sub.amountReceived || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{sub.actualReceiptDate || '-'}</td>
                      <td className="py-3 px-3 text-right font-mono text-amber-600 font-medium">
                        ₹{(sub.pendingSubsidyAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedSubsidy(sub);
                            setSubsidyForm({
                              status: sub.status,
                              nationalPortalRegNumber: sub.nationalPortalRegNumber || '',
                              subsidyAmountApproved: sub.subsidyAmountApproved?.toString() || '',
                              sanctionDate: sub.sanctionDate || '',
                              amountReceived: sub.amountReceived?.toString() || '',
                              actualReceiptDate: sub.actualReceiptDate || '',
                              notes: sub.notes || '',
                            });
                            setIsSubsidyModalOpen(true);
                          }}
                          className="inline-flex items-center text-emerald-600 hover:text-emerald-800 text-xs font-semibold gap-1"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: DIRECT EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Direct Operational & Project Expenses</h3>
              <p className="text-xs text-slate-500">
                Validated expenditures with automatic duplicate entry prevention
              </p>
            </div>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 transition"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Expense
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Expense #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Title & Purpose</th>
                  <th className="py-3 px-3">Paid To</th>
                  <th className="py-3 px-3">Payment Method</th>
                  <th className="py-3 px-3">Order Ref</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No expenses recorded yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {exp.expenseNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{exp.expenseDate}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {exp.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900">{exp.title}</td>
                      <td className="py-3 px-3 text-slate-600">{exp.paidTo}</td>
                      <td className="py-3 px-3 text-slate-600">{exp.paymentMethod}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {exp.salesOrder?.orderNumber || 'General Overhead'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{exp.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: RECORD CUSTOMER PAYMENT */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6 overflow-hidden">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Record Customer Payment Receipt
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sales Order / Customer Project *
                </label>
                <select
                  required
                  value={paymentForm.salesOrderId}
                  onChange={(e) => {
                    const ordId = e.target.value;
                    const found = orders.find((o) => o.id === Number(ordId));
                    setPaymentForm({
                      ...paymentForm,
                      salesOrderId: ordId,
                      amount: found ? found.remainingBalance.toString() : '',
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">-- Select Order --</option>
                  {orders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      {ord.orderNumber} - {ord.customer?.fullName} (Total: ₹
                      {ord.totalAmount.toLocaleString('en-IN')}, Due: ₹
                      {ord.remainingBalance.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Type *</label>
                  <select
                    value={paymentForm.type}
                    onChange={(e: any) =>
                      setPaymentForm({ ...paymentForm, type: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                  >
                    <option value="ADVANCE">Advance (Initial Deposit)</option>
                    <option value="PROGRESS">Progress / Milestone</option>
                    <option value="FULL">Full Settlement</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Amount Received (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold"
                    placeholder="e.g. 50000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method *</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e: any) =>
                      setPaymentForm({ ...paymentForm, method: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                    <option value="CHEQUE">Cheque / Demand Draft</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Debit / Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Transaction Ref / UTR # *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentForm.referenceNumber}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono"
                    placeholder="e.g. UTR198273645"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Notes</label>
                <textarea
                  rows={2}
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                  placeholder="Optional bank remarks or invoice notes..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-medium text-xs rounded-lg hover:bg-emerald-700 transition"
                >
                  Record Payment & Update Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REVERSE PAYMENT CONFIRMATION */}
      {isReversePaymentModalOpen && selectedPaymentForReversal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-rose-700 text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                Confirm Payment Reversal
              </h3>
              <button
                onClick={() => setIsReversePaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReversePayment} className="mt-4 space-y-4 text-xs">
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-900 space-y-1">
                <div className="font-bold">
                  Reversing Receipt {selectedPaymentForReversal.paymentNumber}
                </div>
                <div>
                  Amount: <span className="font-mono font-bold">₹{selectedPaymentForReversal.amount.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  Order Ref: <span className="font-mono">{selectedPaymentForReversal.orderNumber || '-'}</span>
                </div>
                <div>
                  Reference: <span className="font-mono">{selectedPaymentForReversal.referenceNumber || 'N/A'}</span>
                </div>
              </div>

              <p className="text-slate-600">
                Reversing this payment will restore the outstanding customer balance on the sales order, update the corresponding GST invoice, and flag this transaction as <strong>REVERSED</strong> in financial audit logs. Financial history will be preserved.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Reversal *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="e.g. Cheque bounced / Duplicate entry / Customer cancelled draft..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReversePaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white font-medium text-xs rounded-lg hover:bg-rose-700 transition"
                >
                  Confirm Reversal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TECHNICIAN PAYOUT DISBURSEMENT */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Disburse Technician Installation Payout
              </h3>
              <button
                onClick={() => setIsPayoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayout} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Technician *</label>
                <select
                  required
                  value={payoutForm.technicianId}
                  onChange={(e) =>
                    setPayoutForm({ ...payoutForm, technicianId: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                >
                  <option value="">-- Select Field Technician --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.skills || 'Technician'}) - {t.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Associated Installation Project (Optional)
                </label>
                <select
                  value={payoutForm.installationId}
                  onChange={(e) =>
                    setPayoutForm({ ...payoutForm, installationId: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                >
                  <option value="">-- General Labor / Routine Service --</option>
                  {installations.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.installationNumber} - {i.customer?.fullName} ({i.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hours Worked *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={payoutForm.hoursCounted}
                    onChange={(e) => {
                      const h = Number(e.target.value);
                      const rate = Number(payoutForm.applicableRate);
                      setPayoutForm({
                        ...payoutForm,
                        hoursCounted: e.target.value,
                        amountPaid: (h * rate).toString(),
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                    placeholder="e.g. 8"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rate / Hr (₹)</label>
                  <input
                    type="number"
                    value={payoutForm.applicableRate}
                    onChange={(e) => {
                      const rate = Number(e.target.value);
                      const h = Number(payoutForm.hoursCounted);
                      setPayoutForm({
                        ...payoutForm,
                        applicableRate: e.target.value,
                        amountPaid: (h * rate).toString(),
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={payoutForm.amountPaid}
                    onChange={(e) => setPayoutForm({ ...payoutForm, amountPaid: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Disbursement Method</label>
                  <select
                    value={payoutForm.paymentMethod}
                    onChange={(e) =>
                      setPayoutForm({ ...payoutForm, paymentMethod: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reference / UTR #</label>
                  <input
                    type="text"
                    value={payoutForm.referenceNumber}
                    onChange={(e) =>
                      setPayoutForm({ ...payoutForm, referenceNumber: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono"
                    placeholder="e.g. UTR78129304"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={payoutForm.notes}
                  onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                  placeholder="Task completed, overtime remarks..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-medium text-xs rounded-lg hover:bg-blue-700 transition"
                >
                  Disburse & Record Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RECORD DIRECT EXPENSE */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Record Direct Project Expense
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e: any) =>
                      setExpenseForm({ ...expenseForm, category: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                  >
                    <option value="TRANSPORT">Transport & Vehicle Freight</option>
                    <option value="INSTALLATION">Site Installation Supplies</option>
                    <option value="SERVICE_REPAIR">Service & Replacement Parts</option>
                    <option value="TECHNICIAN_PAYOUT">Technician Wages / Daily Allowances</option>
                    <option value="PRODUCT_PURCHASE">Hardware / Raw Material Purchase</option>
                    <option value="OTHER">Other Operational Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold"
                    placeholder="e.g. 3500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Expense Title / Payee Item *
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                  placeholder="e.g. Heavy vehicle freight from Chennai warehouse to Madurai site"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Paid To *</label>
                  <input
                    type="text"
                    required
                    value={expenseForm.paidTo}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                    placeholder="e.g. SRS Logistics / Hardware Store"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.expenseDate}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, expenseDate: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sales Order / Project Allocation
                  </label>
                  <select
                    value={expenseForm.salesOrderId}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, salesOrderId: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                  >
                    <option value="">-- General Company Overhead --</option>
                    {orders.map((ord) => (
                      <option key={ord.id} value={ord.id}>
                        {ord.orderNumber} - {ord.customer?.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Bill Notes</label>
                <textarea
                  rows={2}
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, description: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                  placeholder="Receipt #, toll bills, or vendor invoice particulars..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-medium text-xs rounded-lg hover:bg-emerald-700 transition"
                >
                  Record Validated Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: UPDATE SUBSIDY APPLICATION */}
      {isSubsidyModalOpen && selectedSubsidy && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                Update PM Surya Ghar National Portal Status
              </h3>
              <button
                onClick={() => setIsSubsidyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubsidy} className="mt-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-800">
                  {selectedSubsidy.customer?.fullName} — {selectedSubsidy.salesOrder?.orderNumber}
                </div>
                <div className="text-slate-500 mt-0.5">
                  Claimed Subsidy: ₹{selectedSubsidy.subsidyAmountClaimed.toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status on MNRE Portal *</label>
                <select
                  value={subsidyForm.status}
                  onChange={(e: any) =>
                    setSubsidyForm({ ...subsidyForm, status: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold"
                >
                  <option value="NOT_STARTED">NOT STARTED</option>
                  <option value="DOCUMENTS_PENDING">DOCUMENTS PENDING</option>
                  <option value="SUBMITTED">SUBMITTED (Under Initial Review)</option>
                  <option value="UNDER_VERIFICATION">UNDER VERIFICATION (DISCOM Inspection)</option>
                  <option value="APPROVED">APPROVED (Subsidy Sanctioned)</option>
                  <option value="PARTIALLY_RECEIVED">PARTIALLY RECEIVED</option>
                  <option value="AMOUNT_RECEIVED">AMOUNT RECEIVED (Full DBT Disbursed)</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    National Portal Reg #
                  </label>
                  <input
                    type="text"
                    value={subsidyForm.nationalPortalRegNumber}
                    onChange={(e) =>
                      setSubsidyForm({ ...subsidyForm, nationalPortalRegNumber: e.target.value })
                    }
                    placeholder="e.g. TN-SURYA-2026-8812"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Approved Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={subsidyForm.subsidyAmountApproved}
                    onChange={(e) =>
                      setSubsidyForm({ ...subsidyForm, subsidyAmountApproved: e.target.value })
                    }
                    placeholder="e.g. 78000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sanction Date</label>
                  <input
                    type="date"
                    value={subsidyForm.sanctionDate}
                    onChange={(e) =>
                      setSubsidyForm({ ...subsidyForm, sanctionDate: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Amount Received (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={subsidyForm.amountReceived}
                    onChange={(e) =>
                      setSubsidyForm({ ...subsidyForm, amountReceived: e.target.value })
                    }
                    placeholder="e.g. 78000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Actual Receipt / DBT Date
                </label>
                <input
                  type="date"
                  value={subsidyForm.actualReceiptDate}
                  onChange={(e) =>
                    setSubsidyForm({ ...subsidyForm, actualReceiptDate: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Portal Remarks</label>
                <textarea
                  rows={2}
                  value={subsidyForm.notes}
                  onChange={(e) => setSubsidyForm({ ...subsidyForm, notes: e.target.value })}
                  placeholder="DISCOM inspection status, net meter approval notes..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubsidyModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-medium text-xs rounded-lg hover:bg-emerald-700 transition"
                >
                  Save Subsidy Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: CANCEL INVOICE CONFIRMATION */}
      {isCancelInvoiceModalOpen && selectedInvoiceForCancel && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-rose-700 text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                Cancel GST Tax Invoice
              </h3>
              <button
                onClick={() => setIsCancelInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelInvoice} className="mt-4 space-y-4 text-xs">
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-900 space-y-1">
                <div className="font-bold">
                  Invoice {selectedInvoiceForCancel.invoiceNumber}
                </div>
                <div>Customer: {selectedInvoiceForCancel.customer?.fullName}</div>
                <div>
                  Invoice Value: <span className="font-mono font-bold">₹{selectedInvoiceForCancel.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <p className="text-slate-600">
                Cancelling this invoice creates a permanent audit record and voids future collection against this invoice number.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cancellation Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Order cancelled by customer / System configuration change / Re-invoicing required..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCancelInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium text-xs hover:bg-slate-50"
                >
                  Keep Invoice
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white font-medium text-xs rounded-lg hover:bg-rose-700 transition"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: VIEW / PRINT OFFICIAL GST TAX INVOICE */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-start pb-6 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <Building className="w-6 h-6 text-emerald-600" />
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    SUNPOWER SOLUTIONS PVT. LTD.
                  </h2>
                </div>
                <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                  <p>124 Solar Technology Park, GST Road, Guindy, Chennai - 600032</p>
                  <p>
                    <span className="font-semibold text-slate-700">GSTIN:</span> 33AABCS1429B1Z0 •{' '}
                    <span className="font-semibold text-slate-700">PAN:</span> AABCS1429B •{' '}
                    <span className="font-semibold text-slate-700">State:</span> Tamil Nadu (Code: 33)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 font-bold rounded-lg text-xs uppercase tracking-wider">
                  Tax Invoice
                </span>
                <div className="text-lg font-black text-slate-900 font-mono mt-2">
                  {selectedInvoice.invoiceNumber}
                </div>
                <div className="text-xs text-slate-500">
                  Date: {selectedInvoice.invoiceDate}
                </div>
                <div className="mt-1">
                  <StatusBadge status={selectedInvoice.status} />
                </div>
              </div>
            </div>

            {selectedInvoice.status === 'CANCELLED' && (
              <div className="my-4 bg-rose-50 border border-rose-300 p-3 rounded-lg text-rose-800 text-xs">
                <strong>INVOICE VOID / CANCELLED:</strong>{' '}
                {selectedInvoice.cancellationReason || 'Cancelled by Finance'} on{' '}
                {selectedInvoice.cancelledAt || 'N/A'} by{' '}
                {selectedInvoice.cancelledBy || 'Administrator'}
              </div>
            )}

            {/* Bill To & Supply Info */}
            <div className="grid grid-cols-2 gap-8 my-6 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Billed To Customer:</span>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {selectedInvoice.customer?.fullName}
                </div>
                <div className="text-slate-600 mt-1 leading-relaxed">
                  {selectedInvoice.customer?.address || 'Customer Site'}, {selectedInvoice.customer?.city} - {selectedInvoice.customer?.pincode}
                </div>
                <div className="text-slate-500 mt-2">
                  Phone: {selectedInvoice.customer?.phone} • Email: {selectedInvoice.customer?.email}
                </div>
                <div className="text-slate-700 font-mono font-medium mt-1">
                  GSTIN: {selectedInvoice.gstin || 'Unregistered Consumer (B2C)'}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Invoice Particulars:</span>
                <div className="mt-2 space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sales Order Reference:</span>
                    <span className="font-mono font-bold">{selectedInvoice.salesOrder?.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">System Capacity:</span>
                    <span className="font-semibold">{selectedInvoice.salesOrder?.capacityKw || 5.0} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">System Classification:</span>
                    <span className="font-semibold">{selectedInvoice.salesOrder?.systemType || 'ON_GRID'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Place of Supply:</span>
                    <span className="font-medium">Tamil Nadu (33)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Line Items */}
            <div className="border border-slate-200 rounded-xl overflow-hidden my-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Description of Goods / Services</th>
                    <th className="py-2.5 px-3">HSN / SAC</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value</th>
                    <th className="py-2.5 px-3 text-right">GST Rate</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-3 font-mono">1</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">
                        Turnkey Solar Photovoltaic Installation & Commissioning
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Solar modules, grid-tie inverter, mounting structure, cabling, earthing & net-metering liaison.
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {selectedInvoice.hsnSacCode || 'SAC 998731'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">1 Job</td>
                    <td className="py-3 px-3 text-right font-mono font-medium">
                      ₹{selectedInvoice.subtotal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">5.00% (Composite)</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="flex justify-end my-6 text-xs">
              <div className="w-80 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono font-medium">₹{selectedInvoice.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Central GST (CGST @ 2.5%):</span>
                  <span className="font-mono">₹{((selectedInvoice.cgstAmount ?? selectedInvoice.taxAmount / 2)).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>State GST (SGST @ 2.5%):</span>
                  <span className="font-mono">₹{((selectedInvoice.sgstAmount ?? selectedInvoice.taxAmount / 2)).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total (INR):</span>
                  <span className="font-mono text-emerald-800">₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                  <span>Total Payments Realized:</span>
                  <span className="font-mono">₹{selectedInvoice.paidAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Outstanding Balance Due:</span>
                  <span className="font-mono">₹{selectedInvoice.balanceAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-4 flex justify-between items-center">
              <span>This is a computer-generated tax invoice verified under SunPower ERP.</span>
              <div className="space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Tax Invoice
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
