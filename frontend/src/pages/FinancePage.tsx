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
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Briefcase,
  X,
  FileCheck,
  Building,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  JobProfitability,
  Invoice,
  Expense,
  SubsidyApplication,
  SalesOrder,
  ExpenseCategory,
  SubsidyStatus,
} from '../types';
import { Badge } from '../components/ui/Badge';

export const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profitability' | 'invoices' | 'expenses' | 'subsidies'>('profitability');
  const [profitability, setProfitability] = useState<JobProfitability[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subsidies, setSubsidies] = useState<SubsidyApplication[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSubsidyModalOpen, setIsSubsidyModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedSubsidy, setSelectedSubsidy] = useState<SubsidyApplication | null>(null);

  // Forms
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'TRANSPORT' as ExpenseCategory,
    amount: '',
    paidTo: '',
    paymentMethod: 'BANK_TRANSFER',
    description: '',
    salesOrderId: '',
  });

  const [subsidyForm, setSubsidyForm] = useState({
    status: 'SUBMITTED' as SubsidyStatus,
    nationalPortalRegNumber: '',
    subsidyAmountApproved: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profRes, invRes, expRes, subRes, ordRes] = await Promise.all([
        api.get('/api/finance/job-profitability'),
        api.get('/api/finance/invoices'),
        api.get('/api/finance/expenses'),
        api.get('/api/finance/subsidies'),
        api.get('/api/orders'),
      ]);
      setProfitability(profRes.data);
      setInvoices(invRes.data);
      setExpenses(expRes.data);
      setSubsidies(subRes.data);
      setOrders(ordRes.data);
    } catch (err) {
      console.error('Failed to load finance data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/finance/expenses', {
        title: expenseForm.title,
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        paidTo: expenseForm.paidTo,
        paymentMethod: expenseForm.paymentMethod,
        description: expenseForm.description,
        salesOrderId: expenseForm.salesOrderId ? Number(expenseForm.salesOrderId) : undefined,
      });
      setIsExpenseModalOpen(false);
      setExpenseForm({
        title: '',
        category: 'TRANSPORT',
        amount: '',
        paidTo: '',
        paymentMethod: 'BANK_TRANSFER',
        description: '',
        salesOrderId: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record expense');
    }
  };

  const handleUpdateSubsidy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubsidy) return;
    try {
      await api.patch(`/api/finance/subsidies/${selectedSubsidy.id}/status`, {
        status: subsidyForm.status,
        nationalPortalRegNumber: subsidyForm.nationalPortalRegNumber || undefined,
        subsidyAmountApproved: subsidyForm.subsidyAmountApproved
          ? Number(subsidyForm.subsidyAmountApproved)
          : undefined,
        notes: subsidyForm.notes || undefined,
      });
      setIsSubsidyModalOpen(false);
      setSelectedSubsidy(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update subsidy status');
    }
  };

  // Aggregated totals
  const totalRevenue = profitability.reduce((sum, j) => sum + (j.revenueReceived || 0), 0);
  const totalCost = profitability.reduce((sum, j) => sum + (j.totalCost || 0), 0);
  const totalProfit = profitability.reduce((sum, j) => sum + (j.netProfit || 0), 0);
  const averageMargin =
    profitability.length > 0
      ? (profitability.reduce((sum, j) => sum + (j.profitMarginPercentage || 0), 0) / profitability.length).toFixed(1)
      : '0';

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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CircleDollarSign className="w-6 h-6 text-emerald-600" />
            Financial Management & Job Profitability
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time project net margins, hardware & labor cost allocations, GST invoices, & national subsidy disbursement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportJobProfitabilityCsv}
            className="inline-flex items-center px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2 text-slate-500" />
            Export P&L CSV
          </button>
          {!isAdmin && (
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Record Direct Expense
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Revenue Collected</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Realized Cash Inflow
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Hardware & Labor Costs</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            ₹{totalCost.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1">BOM + Technician + Ops</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Net Realized Profit</div>
          <div className={`text-2xl font-bold mt-1 ${totalProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            ₹{totalProfit.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1">Cumulative Across Jobs</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Average Net Profit Margin</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{averageMargin}%</div>
          <div className="text-xs text-emerald-700 mt-1 font-medium">Target: &gt; 25.0%</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('profitability')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'profitability'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Job-Wise Profitability ({profitability.length})
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'invoices'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Tax Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'expenses'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Direct Expenses ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('subsidies')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'subsidies'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          PM Surya Ghar Subsidies ({subsidies.length})
        </button>
      </div>

      {/* TAB 1: JOB-WISE PROFITABILITY TABLE */}
      {activeTab === 'profitability' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm">
              Per-Job Revenue, Direct Cost & Realized Margin Breakdown
            </h3>
            <span className="text-xs text-slate-500">
              Formula: Net Profit = Revenue Received − (Hardware BOM + Technician Labor + Direct Expenses)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Order #</th>
                  <th className="py-3 px-3">Customer & System</th>
                  <th className="py-3 px-3 text-right">Order Value</th>
                  <th className="py-3 px-3 text-right">Revenue Received</th>
                  <th className="py-3 px-3 text-right">Hardware (BOM)</th>
                  <th className="py-3 px-3 text-right">Tech Labor</th>
                  <th className="py-3 px-3 text-right">Expenses</th>
                  <th className="py-3 px-3 text-right font-bold text-slate-800">Total Cost</th>
                  <th className="py-3 px-3 text-right font-bold text-emerald-800">Net Profit</th>
                  <th className="py-3 px-3 text-right font-bold">Margin</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profitability.map((job) => (
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
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      ₹{job.orderAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">
                      ₹{job.revenueReceived.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      ₹{job.hardwareCost.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      ₹{job.technicianCost.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      ₹{job.recordedExpenses.toLocaleString('en-IN')}
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
                            : job.profitMarginPercentage > 10
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm">Official GST Tax Invoices</h3>
            <span className="text-xs text-slate-500">Generated automatically upon Order confirmation</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Tax (GST)</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">{inv.invoiceDate}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{inv.customer?.fullName}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {inv.salesOrder?.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      ₹{inv.subtotal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      ₹{inv.taxAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-semibold">
                      ₹{inv.paidAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      ₹{inv.balanceAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setTimeout(() => window.print(), 300);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DIRECT EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm">Direct Project & Operations Expenses</h3>
            <span className="text-xs text-slate-500">Tracks site transport, equipment rental, and incidental costs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Expense #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Title & Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Paid To</th>
                  <th className="py-3 px-4">Linked Job</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      {exp.expenseNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">{exp.expenseDate}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{exp.title}</div>
                      <div className="text-xs text-slate-500">{exp.description}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{exp.paidTo}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {exp.salesOrder?.orderNumber || 'General Overhead'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SUBSIDY APPLICATIONS */}
      {activeTab === 'subsidies' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                PM Surya Ghar Muft Bijli Yojana – Subsidy Tracker
              </h3>
              <p className="text-xs text-slate-500">
                Track national portal application numbers, sanction approvals, and customer DBT disbursements.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">App #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Linked Order</th>
                  <th className="py-3 px-4">National Portal Reg #</th>
                  <th className="py-3 px-4 text-right">Claimed (₹)</th>
                  <th className="py-3 px-4 text-right">Approved (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subsidies.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      {sub.applicationNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {sub.customer?.fullName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {sub.salesOrder?.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-800">
                      {sub.nationalPortalRegNumber || (
                        <span className="text-slate-400 italic">Pending Reg</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-800">
                      ₹{sub.subsidyAmountClaimed.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                      {sub.subsidyAmountApproved > 0
                        ? `₹${sub.subsidyAmountApproved.toLocaleString('en-IN')}`
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={sub.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedSubsidy(sub);
                          setSubsidyForm({
                            status: sub.status,
                            nationalPortalRegNumber: sub.nationalPortalRegNumber || '',
                            subsidyAmountApproved: sub.subsidyAmountApproved ? String(sub.subsidyAmountApproved) : '',
                            notes: sub.notes || '',
                          });
                          setIsSubsidyModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Record Project / Operational Expense
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Expense Title *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Scaffolding & Rooftop Crane Rental"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, category: e.target.value as ExpenseCategory })
                    }
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                  >
                    <option value="TRANSPORT">TRANSPORT</option>
                    <option value="INSTALLATION">INSTALLATION</option>
                    <option value="TECHNICIAN_PAYOUT">TECHNICIAN_PAYOUT</option>
                    <option value="SERVICE_REPAIR">SERVICE_REPAIR</option>
                    <option value="PRODUCT_PURCHASE">PRODUCT_PURCHASE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Paid To *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Vendor / Tech name"
                    value={expenseForm.paidTo}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Payment Method
                  </label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Link to Sales Order (Optional - for Job Cost Allocation)
                </label>
                <select
                  value={expenseForm.salesOrderId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, salesOrderId: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                >
                  <option value="">-- General Overhead (No Job Link) --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.customer?.fullName} ({o.capacityKw} kW)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Description / Justification
                </label>
                <textarea
                  rows={2}
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Notes, receipt number, bill reference..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE SUBSIDY MODAL */}
      {isSubsidyModalOpen && selectedSubsidy && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Update PM Surya Ghar Subsidy
                </h3>
                <p className="text-xs text-slate-500">
                  App #{selectedSubsidy.applicationNumber} • {selectedSubsidy.customer?.fullName}
                </p>
              </div>
              <button
                onClick={() => setIsSubsidyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubsidy} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Application Status *
                </label>
                <select
                  value={subsidyForm.status}
                  onChange={(e) =>
                    setSubsidyForm({ ...subsidyForm, status: e.target.value as SubsidyStatus })
                  }
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                >
                  <option value="DOCUMENTS_PENDING">DOCUMENTS_PENDING</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  National Portal Registration #
                </label>
                <input
                  type="text"
                  placeholder="e.g. PMSURYA-2026-DL-88219"
                  value={subsidyForm.nationalPortalRegNumber}
                  onChange={(e) =>
                    setSubsidyForm({ ...subsidyForm, nationalPortalRegNumber: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Sanctioned / Approved Subsidy Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 78000"
                  value={subsidyForm.subsidyAmountApproved}
                  onChange={(e) =>
                    setSubsidyForm({ ...subsidyForm, subsidyAmountApproved: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  DISCOM / Portal Inspection Notes
                </label>
                <textarea
                  rows={2}
                  value={subsidyForm.notes}
                  onChange={(e) => setSubsidyForm({ ...subsidyForm, notes: e.target.value })}
                  placeholder="Discom net-meter synchronization cleared. Direct Bank Transfer expected in 14 days."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubsidyModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                >
                  Update Subsidy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE TAX INVOICE (Hidden on screen, visible during window.print()) */}
      {selectedInvoice && (
        <div className="hidden print:block fixed inset-0 bg-white p-8 z-50 text-slate-900">
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wider text-emerald-800">
                SunPower Solutions Private Limited
              </h1>
              <p className="text-xs text-slate-500">
                Authorized Rooftop Solar Channel Partner & EPC Integrator
              </p>
              <p className="text-xs text-slate-500">GSTIN: {selectedInvoice.gstin || '33AABCS1429B1Z8'}</p>
              <p className="text-xs text-slate-500">
                Registered Office: Tech Park Phase II, Bengaluru, Karnataka
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase text-slate-400">TAX INVOICE</span>
              <div className="text-2xl font-mono font-bold">{selectedInvoice.invoiceNumber}</div>
              <div className="text-xs text-slate-500">Date: {selectedInvoice.invoiceDate}</div>
              <div className="text-xs text-slate-500">Order Ref: {selectedInvoice.salesOrder?.orderNumber}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div className="border border-slate-200 p-4 rounded-lg">
              <h3 className="font-bold text-xs uppercase text-slate-400 mb-2">Billed To</h3>
              <p className="font-semibold text-slate-900">{selectedInvoice.customer?.fullName}</p>
              <p className="text-slate-600">{selectedInvoice.customer?.address}</p>
              <p className="text-slate-600">
                {selectedInvoice.customer?.city} - {selectedInvoice.customer?.pincode}
              </p>
              <p className="text-slate-600">Phone: {selectedInvoice.customer?.phone}</p>
            </div>

            <div className="border border-slate-200 p-4 rounded-lg">
              <h3 className="font-bold text-xs uppercase text-slate-400 mb-2">Project Particulars</h3>
              <p>
                <span className="font-medium text-slate-600">System Installed:</span> Rooftop Grid-Tie Solar Plant
              </p>
              <p>
                <span className="font-medium text-slate-600">Capacity:</span> {selectedInvoice.salesOrder?.capacityKw} kW
              </p>
              <p>
                <span className="font-medium text-slate-600">Inverter & Panel Serial Numbers:</span> Logged in System
              </p>
              <p>
                <span className="font-medium text-slate-600">Payment Status:</span>{' '}
                <span className="font-bold text-emerald-700">
                  {selectedInvoice.balanceAmount === 0 ? 'FULLY PAID' : 'PARTIALLY PAID'}
                </span>
              </p>
            </div>
          </div>

          <table className="w-full text-left border-collapse text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-slate-300 bg-slate-50 text-xs uppercase font-bold text-slate-600">
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3 text-right">Taxable Amount (₹)</th>
                <th className="py-2 px-3 text-right">CGST (6%)</th>
                <th className="py-2 px-3 text-right">SGST (6%)</th>
                <th className="py-2 px-3 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-3 px-3">
                  <div className="font-semibold">Turnkey Solar PV Installation & Commissioning</div>
                  <div className="text-xs text-slate-500">
                    Includes Tier-1 Mono PERC Bifacial Modules, Grid-Tie Inverter, Mounting Structures, ACDB/DCDB, and Earthing.
                  </div>
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  ₹{selectedInvoice.subtotal.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  ₹{((selectedInvoice.taxAmount || 0) / 2).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  ₹{((selectedInvoice.taxAmount || 0) / 2).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold">
                  ₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 font-bold">
                <td colSpan={4} className="py-2 px-3 text-right">Total Invoice Value:</td>
                <td className="py-2 px-3 text-right font-mono">₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}</td>
              </tr>
              <tr className="text-emerald-700">
                <td colSpan={4} className="py-1 px-3 text-right">Less: Total Payments Received:</td>
                <td className="py-1 px-3 text-right font-mono">₹{selectedInvoice.paidAmount.toLocaleString('en-IN')}</td>
              </tr>
              <tr className="text-slate-900 font-bold text-base">
                <td colSpan={4} className="py-2 px-3 text-right">Net Balance Due:</td>
                <td className="py-2 px-3 text-right font-mono">₹{selectedInvoice.balanceAmount.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>

          <div className="border-t-2 border-slate-200 pt-6 mt-12 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <p className="font-bold text-slate-800">Declaration & Terms</p>
              <p className="text-slate-500 mt-1">
                We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
              </p>
            </div>
            <div>
              <div className="h-16 border-b border-dashed border-slate-400 mb-2"></div>
              <p className="font-bold text-slate-800">For SunPower Solutions Pvt Ltd</p>
              <p className="text-slate-400">Authorized Signatory</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
