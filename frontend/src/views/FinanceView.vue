<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api/client';
import type {
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
  SupplierPayment,
  PurchaseItem,
  ProfitAndLossReport,
  CashFlowReport,
  GstReport,
  PaymentReceipt,
} from '../types';
import StatusBadge from '../components/ui/StatusBadge.vue';
import { useAuthStore } from '../stores/auth';
import {
  CircleDollarSign,
  TrendingUp,
  CreditCard,
  Briefcase,
  FileText,
  UserCheck,
  Award,
  Receipt,
  Plus,
  Download,
  Building,
  Printer,
  X,
  RotateCcw,
  ChevronRight,
  AlertCircle,
  Truck,
  BarChart3,
  CheckCircle2,
  XCircle,
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

const validTabs = ['dashboard', 'payments', 'profitability', 'invoices', 'payouts', 'subsidies', 'expenses', 'suppliers', 'reports'] as const;
type TabType = typeof validTabs[number];

const activeTab = ref<TabType>(
  (route.query.tab && validTabs.includes(route.query.tab as TabType))
    ? (route.query.tab as TabType)
    : 'dashboard'
);

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && typeof newTab === 'string' && validTabs.includes(newTab as TabType) && activeTab.value !== newTab) {
      activeTab.value = newTab as TabType;
    }
  }
);

watch(activeTab, (newTab) => {
  if (route.query.tab !== newTab) {
    router.replace({ query: { ...route.query, tab: newTab } });
  }
});

const dashboardData = ref<FinanceDashboard | null>(null);
const profitability = ref<JobProfitability[]>([]);
const invoices = ref<Invoice[]>([]);
const expenses = ref<Expense[]>([]);
const subsidies = ref<SubsidyApplication[]>([]);
const payments = ref<Payment[]>([]);
const payouts = ref<TechnicianPayment[]>([]);
const orders = ref<SalesOrder[]>([]);
const technicians = ref<Technician[]>([]);
const installations = ref<Installation[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const period = ref('THIS_MONTH');

// Modals
const isExpenseModalOpen = ref(false);
const isPayoutModalOpen = ref(false);
const isSubsidyModalOpen = ref(false);
const isPaymentModalOpen = ref(false);
const isCancelInvoiceModalOpen = ref(false);
const supplierPurchases = ref<PurchaseItem[]>([]);
const supplierPayments = ref<SupplierPayment[]>([]);
const pnlReport = ref<ProfitAndLossReport | null>(null);
const cashFlowReport = ref<CashFlowReport | null>(null);
const gstReport = ref<GstReport | null>(null);
const selectedReceipt = ref<PaymentReceipt | null>(null);
const isReceiptModalOpen = ref(false);
const isSupplierPaymentModalOpen = ref(false);
const selectedPurchaseForPayment = ref<PurchaseItem | null>(null);
const reportsActiveTab = ref<'pnl' | 'cashflow' | 'gst'>('pnl');

const supplierPaymentForm = ref({
  purchaseId: 0,
  amount: '',
  paymentDate: new Date().toISOString().slice(0, 10),
  paymentMethod: 'Bank Transfer',
  referenceNumber: '',
  notes: '',
});
const selectedInvoice = ref<Invoice | null>(null);
const selectedInvoiceForCancel = ref<Invoice | null>(null);
const selectedSubsidy = ref<SubsidyApplication | null>(null);
const invoiceCancelReason = ref('');

// Forms
const expenseForm = ref({
  title: '',
  category: 'TRANSPORT' as ExpenseCategory,
  amount: '',
  paidTo: '',
  paymentMethod: 'Bank Transfer',
  description: '',
  salesOrderId: '',
  expenseDate: new Date().toISOString().slice(0, 10),
});

const payoutForm = ref({
  technicianId: '',
  installationId: '',
  hoursCounted: '',
  applicableRate: '250',
  amountPaid: '',
  paymentMethod: 'Bank Transfer',
  referenceNumber: '',
  notes: '',
});

const paymentForm = ref({
  salesOrderId: '',
  amount: '',
  paymentDate: new Date().toISOString().slice(0, 10),
  method: 'BANK_TRANSFER' as PaymentMethod,
  type: 'ADVANCE' as PaymentType,
  referenceNumber: '',
  notes: '',
});

const subsidyForm = ref({
  status: 'SUBMITTED' as SubsidyStatus,
  nationalPortalRegNumber: '',
  subsidyAmountApproved: '',
  sanctionDate: '',
  amountReceived: '',
  actualReceiptDate: '',
  discomConsumerNumber: '',
  discomApplicationNumber: '',
  feasibilityApprovedDate: '',
  netMeterInstalledDate: '',
  commissioningCertificateNumber: '',
  notes: '',
});

const authStore = useAuthStore();

const formatCurrency = (val: number | undefined | null) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

// Safe formatting for numbers only
const formatNumber = (val: number | undefined | null) => {
  return Number(val || 0).toLocaleString('en-IN');
};

const fetchData = async () => {
  try {
    loading.value = true;
    error.value = null;

    const [
      dashRes,
      profRes,
      invRes,
      expRes,
      subRes,
      payRes,
      payoRes,
      ordRes,
      techRes,
      instRes,
      supPurchasesRes,
      supPaymentsRes,
    ] = await Promise.allSettled([
      api.get(`/finance/dashboard?period=${period.value}`),
      api.get('/finance/job-profitability'),
      api.get('/finance/invoices'),
      api.get('/finance/expenses'),
      api.get('/finance/subsidies'),
      api.get('/payments'),
      api.get('/finance/technician-payouts'),
      api.get('/orders'),
      api.get('/technicians'),
      api.get('/installations'),
      api.get('/finance/suppliers/purchases'),
      api.get('/finance/suppliers/payments'),
    ]);

    if (dashRes.status === 'fulfilled') dashboardData.value = dashRes.value.data;
    if (profRes.status === 'fulfilled') profitability.value = profRes.value.data || [];
    if (invRes.status === 'fulfilled') invoices.value = invRes.value.data || [];
    if (expRes.status === 'fulfilled') expenses.value = expRes.value.data || [];
    if (subRes.status === 'fulfilled') subsidies.value = subRes.value.data || [];
    if (payRes.status === 'fulfilled') payments.value = payRes.value.data || [];
    if (payoRes.status === 'fulfilled') payouts.value = payoRes.value.data || [];
    if (ordRes.status === 'fulfilled') orders.value = ordRes.value.data || [];
    if (techRes.status === 'fulfilled') technicians.value = techRes.value.data || [];
    if (instRes.status === 'fulfilled') installations.value = instRes.value.data || [];
    if (supPurchasesRes.status === 'fulfilled') supplierPurchases.value = supPurchasesRes.value.data || [];
    if (supPaymentsRes.status === 'fulfilled') supplierPayments.value = supPaymentsRes.value.data || [];

    if (dashRes.status === 'rejected') {
      const err: any = dashRes.reason;
      error.value = err.response?.data?.message || err.message || 'Partial financial data loaded. Retry to refresh dashboard.';
    }

    fetchReports();
  } catch (err: any) {
    console.error('Failed to load financial data', err);
    error.value = err.response?.data?.message || err.message || 'Failed to connect to Financial Service';
  } finally {
    loading.value = false;
  }
};

const handleExpenseSubmit = async () => {
  try {
    await api.post('/finance/expenses', {
      title: expenseForm.value.title,
      category: expenseForm.value.category,
      amount: parseFloat(expenseForm.value.amount),
      paidTo: expenseForm.value.paidTo,
      paymentMethod: expenseForm.value.paymentMethod,
      description: expenseForm.value.description,
      salesOrderId: expenseForm.value.salesOrderId ? parseInt(expenseForm.value.salesOrderId) : null,
      expenseDate: expenseForm.value.expenseDate,
    });
    isExpenseModalOpen.value = false;
    expenseForm.value = {
      title: '',
      category: 'TRANSPORT' as ExpenseCategory,
      amount: '',
      paidTo: '',
      paymentMethod: 'Bank Transfer',
      description: '',
      salesOrderId: '',
      expenseDate: new Date().toISOString().slice(0, 10),
    };
    fetchData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to record expense');
  }
};

const handlePayoutSubmit = async () => {
  try {
    await api.post('/finance/technician-payouts', {
      technicianId: parseInt(payoutForm.value.technicianId),
      installationId: payoutForm.value.installationId ? parseInt(payoutForm.value.installationId) : null,
      hoursCounted: payoutForm.value.hoursCounted ? parseFloat(payoutForm.value.hoursCounted) : undefined,
      applicableRate: payoutForm.value.applicableRate ? parseFloat(payoutForm.value.applicableRate) : undefined,
      amountPaid: parseFloat(payoutForm.value.amountPaid),
      paymentMethod: payoutForm.value.paymentMethod,
      referenceNumber: payoutForm.value.referenceNumber,
      notes: payoutForm.value.notes,
    });
    isPayoutModalOpen.value = false;
    payoutForm.value = {
      technicianId: '',
      installationId: '',
      hoursCounted: '',
      applicableRate: '250',
      amountPaid: '',
      paymentMethod: 'Bank Transfer',
      referenceNumber: '',
      notes: '',
    };
    fetchData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to record payout');
  }
};

const handlePaymentSubmit = async () => {
  try {
    await api.post('/payments', {
      salesOrderId: parseInt(paymentForm.value.salesOrderId),
      amount: parseFloat(paymentForm.value.amount),
      paymentDate: paymentForm.value.paymentDate,
      method: paymentForm.value.method,
      type: paymentForm.value.type,
      referenceNumber: paymentForm.value.referenceNumber.trim(),
      notes: paymentForm.value.notes,
    });
    isPaymentModalOpen.value = false;
    paymentForm.value = {
      salesOrderId: '',
      amount: '',
      paymentDate: new Date().toISOString().slice(0, 10),
      method: 'BANK_TRANSFER' as PaymentMethod,
      type: 'ADVANCE' as PaymentType,
      referenceNumber: '',
      notes: '',
    };
    fetchData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to record customer payment');
  }
};

const handleReversePayment = async (paymentId: number) => {
  const reason = prompt('Please enter reason for payment reversal:');
  if (!reason || !reason.trim()) return;

  try {
    await api.post(`/payments/${paymentId}/reverse`, { reason: reason.trim() });
    alert('Payment reversed successfully. Outstanding order balance has been restored.');
    fetchData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to reverse payment');
  }
};

const openSubsidyModal = (sub: SubsidyApplication) => {
  selectedSubsidy.value = sub;
  subsidyForm.value = {
    status: sub.status,
    nationalPortalRegNumber: sub.nationalPortalRegNumber || '',
    subsidyAmountApproved: sub.subsidyAmountApproved ? sub.subsidyAmountApproved.toString() : '',
    sanctionDate: sub.sanctionDate || '',
    amountReceived: sub.amountReceived ? sub.amountReceived.toString() : '',
    actualReceiptDate: sub.actualReceiptDate || '',
    discomConsumerNumber: (sub as any).discomConsumerNumber || '',
    discomApplicationNumber: (sub as any).discomApplicationNumber || '',
    feasibilityApprovedDate: (sub as any).feasibilityApprovedDate || '',
    netMeterInstalledDate: (sub as any).netMeterInstalledDate || '',
    commissioningCertificateNumber: (sub as any).commissioningCertificateNumber || '',
    notes: sub.notes || '',
  };
  isSubsidyModalOpen.value = true;
};

const handleSubsidySubmit = async () => {
  if (!selectedSubsidy.value) return;
  try {
    await api.patch(`/finance/subsidies/${selectedSubsidy.value.id}/status`, {
      status: subsidyForm.value.status,
      nationalPortalRegNumber: subsidyForm.value.nationalPortalRegNumber,
      subsidyAmountApproved: subsidyForm.value.subsidyAmountApproved ? parseFloat(subsidyForm.value.subsidyAmountApproved) : undefined,
      sanctionDate: subsidyForm.value.sanctionDate || undefined,
      amountReceived: subsidyForm.value.amountReceived ? parseFloat(subsidyForm.value.amountReceived) : undefined,
      actualReceiptDate: subsidyForm.value.actualReceiptDate || undefined,
      discomConsumerNumber: subsidyForm.value.discomConsumerNumber || undefined,
      discomApplicationNumber: subsidyForm.value.discomApplicationNumber || undefined,
      feasibilityApprovedDate: subsidyForm.value.feasibilityApprovedDate || undefined,
      netMeterInstalledDate: subsidyForm.value.netMeterInstalledDate || undefined,
      commissioningCertificateNumber: subsidyForm.value.commissioningCertificateNumber || undefined,
      notes: subsidyForm.value.notes,
    });
    isSubsidyModalOpen.value = false;
    fetchData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to update subsidy record');
  }
};

const openCancelInvoiceModal = (inv: Invoice) => {
  selectedInvoiceForCancel.value = inv;
  invoiceCancelReason.value = '';
  isCancelInvoiceModalOpen.value = true;
};

const handleCancelInvoiceSubmit = async () => {
  if (!selectedInvoiceForCancel.value) return;
  if (!invoiceCancelReason.value.trim()) {
    alert('Please provide a reason for cancelling this GST invoice.');
    return;
  }
  try {
    await api.post(`/finance/invoices/${selectedInvoiceForCancel.value.id}/cancel`, {
      reason: invoiceCancelReason.value.trim(),
      cancelledBy: authStore.user?.username || 'admin',
    });
    isCancelInvoiceModalOpen.value = false;
    selectedInvoiceForCancel.value = null;
    fetchData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to cancel invoice');
  }
};

const downloadProfitabilityCsv = async () => {
  try {
    const res = await api.get('/finance/export/job-profitability', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SunPower_Job_Profitability_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err: any) {
    alert('Failed to export CSV');
  }
};

const printCurrentInvoice = () => {
  window.print();
};

const fetchReports = async () => {
  try {
    const [pnlRes, cfRes, gstRes] = await Promise.allSettled([
      api.get(`/finance/reports/profit-and-loss?period=${period.value}`),
      api.get(`/finance/reports/cash-flow?period=${period.value}`),
      api.get(`/finance/reports/gst?period=${period.value}`),
    ]);
    if (pnlRes.status === 'fulfilled') pnlReport.value = pnlRes.value.data;
    if (cfRes.status === 'fulfilled') cashFlowReport.value = cfRes.value.data;
    if (gstRes.status === 'fulfilled') gstReport.value = gstRes.value.data;
  } catch (e) {
    console.warn('Reports failed to load', e);
  }
};

const handleApproveExpense = async (expenseId: number) => {
  try {
    await api.patch(`/finance/expenses/${expenseId}/approve`);
    fetchData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to approve expense');
  }
};

const handleRejectExpense = async (expenseId: number) => {
  const reason = prompt('Please provide reason for rejecting this expense:');
  if (!reason || !reason.trim()) return;
  try {
    await api.patch(`/finance/expenses/${expenseId}/reject`, {
      reason: reason.trim(),
      approvedBy: authStore.user?.username || 'Finance Controller',
    });
    fetchData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to reject expense');
  }
};

const openSupplierPaymentModal = (purchase: PurchaseItem) => {
  selectedPurchaseForPayment.value = purchase;
  supplierPaymentForm.value = {
    purchaseId: purchase.id,
    amount: purchase.remainingBalance > 0 ? purchase.remainingBalance.toString() : '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Bank Transfer',
    referenceNumber: '',
    notes: '',
  };
  isSupplierPaymentModalOpen.value = true;
};

const handleSupplierPaymentSubmit = async () => {
  if (!selectedPurchaseForPayment.value) return;
  try {
    await api.post('/finance/suppliers/payments', {
      purchaseId: selectedPurchaseForPayment.value.id,
      amount: parseFloat(supplierPaymentForm.value.amount),
      paymentDate: supplierPaymentForm.value.paymentDate,
      paymentMethod: supplierPaymentForm.value.paymentMethod,
      referenceNumber: supplierPaymentForm.value.referenceNumber.trim(),
      notes: supplierPaymentForm.value.notes,
    });
    isSupplierPaymentModalOpen.value = false;
    fetchData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to record supplier payment');
  }
};

const openReceiptModal = async (paymentId: number) => {
  try {
    const res = await api.get(`/payments/${paymentId}/receipt`);
    selectedReceipt.value = res.data;
    isReceiptModalOpen.value = true;
  } catch (err: any) {
    alert('Failed to load payment receipt');
  }
};

const exportCsvFile = async (endpoint: string, filename: string) => {
  try {
    const res = await api.get(endpoint, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err: any) {
    alert('Failed to export CSV: ' + (err.response?.data?.message || err.message));
  }
};

// ---------------- CHART COMPUTATIONS ----------------
// Chronological Monthly Trends
const monthlyTrends = computed(() => {
  if (!dashboardData.value?.monthlyRevenueTrends) return [];
  return dashboardData.value.monthlyRevenueTrends;
});

// Calculate Max Value for SVG Bar Chart Scaling
const maxChartValue = computed(() => {
  const trends = monthlyTrends.value;
  if (!trends || trends.length === 0) return 300000;
  let max = 0;
  for (const t of trends) {
    if (t.revenue > max) max = t.revenue;
    if (t.cost > max) max = t.cost;
    if (t.profit > max) max = t.profit;
  }
  if (max <= 0) return 300000;
  return Math.max(300000, Math.ceil(max / 75000) * 75000);
});

// Active hover state for bar chart tooltip
const hoveredMonthIndex = ref<number | null>(null);

// Category colors for donut chart
const categoryColors: Record<string, string> = {
  TECHNICIAN_PAYOUT: '#10b981',
  TRANSPORT: '#3b82f6',
  INSTALLATION: '#8b5cf6',
  SERVICE_REPAIR: '#f59e0b',
  PRODUCT_PURCHASE: '#ec4899',
  OTHER: '#64748b',
};

const donutSegments = computed(() => {
  const breakdown = dashboardData.value?.expenseCategoryBreakdown || [];
  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
  if (total === 0) return [];

  let accumulatedPercent = 0;
  return breakdown.map((item, index) => {
    const percent = item.amount / total;
    const strokeDasharray = `${(percent * 100).toFixed(2)} ${(100 - percent * 100).toFixed(2)}`;
    const strokeDashoffset = (-accumulatedPercent * 100).toFixed(2);
    accumulatedPercent += percent;

    return {
      category: item.category,
      amount: item.amount,
      color: categoryColors[item.category] || ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'][index % 6],
      strokeDasharray,
      strokeDashoffset,
    };
  });
});

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CircleDollarSign class="w-7 h-7 text-emerald-600 shrink-0" />
          <span>Financial Management & Project Profitability</span>
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-1">
          Real-time project gross margins, GST invoices, customer collections, technician payroll, & national solar subsidies.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          @click="isPaymentModalOpen = true"
          class="inline-flex items-center px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm shadow-xs cursor-pointer transition"
        >
          <CreditCard class="w-4 h-4 mr-1.5" />
          <span>Record Customer Payment</span>
        </button>

        <button
          type="button"
          @click="isPayoutModalOpen = true"
          class="inline-flex items-center px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm shadow-xs cursor-pointer transition"
        >
          <UserCheck class="w-4 h-4 mr-1.5" />
          <span>Disburse Technician Payout</span>
        </button>

        <button
          type="button"
          @click="isExpenseModalOpen = true"
          class="inline-flex items-center px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm shadow-xs cursor-pointer transition"
        >
          <Plus class="w-4 h-4 mr-1.5" />
          <span>Direct Expense</span>
        </button>

        <button
          type="button"
          @click="downloadProfitabilityCsv"
          class="inline-flex items-center px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm shadow-xs cursor-pointer transition"
        >
          <Download class="w-4 h-4 mr-1.5 text-slate-500" />
          <span>Export P&L</span>
        </button>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs sm:text-sm text-rose-800">
      <div class="flex items-center gap-2.5">
        <AlertCircle class="w-5 h-5 text-rose-600 shrink-0" />
        <div>
          <div class="font-semibold text-rose-900">Financial Service Error</div>
          <div class="text-xs text-rose-700 mt-0.5">{{ error }}</div>
        </div>
      </div>
      <button
        type="button"
        @click="fetchData"
        class="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition cursor-pointer"
      >
        Retry
      </button>
    </div>

    <!-- Loading State Skeleton -->
    <div v-if="loading && !dashboardData" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
      <div v-for="i in 5" :key="i" class="bg-white p-4 rounded-xl border border-slate-200 h-28 flex flex-col justify-between">
        <div class="h-3 w-24 bg-slate-200 rounded"></div>
        <div class="h-6 w-32 bg-slate-200 rounded"></div>
        <div class="h-3 w-20 bg-slate-100 rounded"></div>
      </div>
    </div>

    <!-- Top 5 KPI Cards -->
    <div v-else-if="dashboardData" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <!-- Card 1: Recognized Revenue -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Recognized Revenue</div>
          <div class="text-2xl font-bold text-slate-900 mt-1 font-mono">
            ₹{{ formatNumber(dashboardData.totalRecognizedRevenue || dashboardData.totalInvoicedRevenue) }}
          </div>
        </div>
        <div class="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-50 flex items-center justify-between gap-1">
          <span class="truncate">Excl. GST</span>
          <span class="text-emerald-600 font-medium font-mono shrink-0">
            ₹{{ formatNumber(dashboardData.totalCashCollected || dashboardData.totalPaymentsReceived) }} Cash
          </span>
        </div>
      </div>

      <!-- Card 2: Total Receivables Due -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Receivables Due</div>
          <div class="text-2xl font-bold text-amber-600 mt-1 font-mono">
            ₹{{ formatNumber(dashboardData.totalOutstandingReceivables) }}
          </div>
        </div>
        <div class="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-50">Pending from Customers</div>
      </div>

      <!-- Card 3: Project Costs -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Project Costs (BOM + Labor)</div>
          <div class="text-2xl font-bold text-slate-900 mt-1 font-mono">
            ₹{{ formatNumber((dashboardData.totalHardwareCost || 0) + (dashboardData.totalInstallationLaborCost || 0) + (dashboardData.totalOperationalExpenses || 0)) }}
          </div>
        </div>
        <div class="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-50">Hardware + Crew + Transport</div>
      </div>

      <!-- Card 4: Net Accounting Profit -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Net Accounting Profit</div>
          <div
            :class="[
              'text-2xl font-bold mt-1 font-mono',
              dashboardData.totalProjectProfit >= 0 ? 'text-emerald-700' : 'text-rose-600',
            ]"
          >
            ₹{{ formatNumber(dashboardData.totalProjectProfit) }}
          </div>
        </div>
        <div class="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-50">True Project Operating Margin</div>
      </div>

      <!-- Card 5: Average Gross Margin -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Average Gross Margin</div>
          <div class="text-2xl font-bold text-emerald-600 mt-1 font-mono">
            {{ dashboardData.averageProfitMargin?.toFixed(1) || '0.0' }}%
          </div>
        </div>
        <div class="text-xs text-emerald-700 font-medium mt-2 pt-2 border-t border-slate-50">Standard Target ≥ 25.0%</div>
      </div>
    </div>

    <!-- Navigation Tabs Bar -->
    <div class="flex border-b border-slate-200 space-x-6 text-xs sm:text-sm font-medium overflow-x-auto pb-0">
      <button
        type="button"
        @click="activeTab = 'dashboard'"
        :class="[
          'pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer',
          activeTab === 'dashboard'
            ? 'border-emerald-600 text-emerald-700 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-800',
        ]"
      >
        <TrendingUp class="w-4 h-4" />
        <span>Finance Dashboard</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'payments'"
        :class="[
          'pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer',
          activeTab === 'payments'
            ? 'border-emerald-600 text-emerald-700 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-800',
        ]"
      >
        <CreditCard class="w-4 h-4" />
        <span>Customer Payments ({{ payments.length }})</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'profitability'"
        :class="[
          'pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer',
          activeTab === 'profitability'
            ? 'border-emerald-600 text-emerald-700 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-800',
        ]"
      >
        <Briefcase class="w-4 h-4" />
        <span>Job-Wise Profitability ({{ profitability.length }})</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'invoices'"
        :class="[
          'pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer',
          activeTab === 'invoices'
            ? 'border-emerald-600 text-emerald-700 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-800',
        ]"
      >
        <FileText class="w-4 h-4" />
        <span>GST Tax Invoices ({{ invoices.length }})</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'payouts'"
        :class="[
          'pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer',
          activeTab === 'payouts'
            ? 'border-emerald-600 text-emerald-700 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-800',
        ]"
      >
        <UserCheck class="w-4 h-4" />
        <span>Technician Payouts ({{ payouts.length }})</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'subsidies'"
        :class="[
          'pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer',
          activeTab === 'subsidies'
            ? 'border-emerald-600 text-emerald-700 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-800',
        ]"
      >
        <Award class="w-4 h-4" />
        <span>PM Surya Ghar Subsidies ({{ subsidies.length }})</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'expenses'"
        :class="[
          'pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer',
          activeTab === 'expenses'
            ? 'border-emerald-600 text-emerald-700 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-800',
        ]"
      >
        <Receipt class="w-4 h-4" />
        <span>Direct Expenses ({{ expenses.length }})</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'suppliers'"
        :class="[
          'pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer',
          activeTab === 'suppliers'
            ? 'border-emerald-600 text-emerald-700 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-800',
        ]"
      >
        <Truck class="w-4 h-4" />
        <span>Supplier Invoices ({{ supplierPurchases.length }})</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'reports'"
        :class="[
          'pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer',
          activeTab === 'reports'
            ? 'border-emerald-600 text-emerald-700 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-800',
        ]"
      >
        <BarChart3 class="w-4 h-4" />
        <span>Financial Statements</span>
      </button>
    </div>

    <!-- ================= TAB 1: FINANCE DASHBOARD ================= -->
    <div v-if="activeTab === 'dashboard'" class="space-y-6">
      <!-- Executive Insights Bar -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 class="font-bold text-slate-900 text-sm sm:text-base">Executive Financial Insights</h3>
          <p class="text-xs text-slate-500">Live operational cash flows, expense breakdown, and subsidy reconciliation</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500 font-medium">Reporting Window:</span>
          <select
            v-model="period"
            @change="fetchData"
            class="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
          >
            <option value="THIS_MONTH">Current Month</option>
            <option value="LAST_3_MONTHS">Last 3 Months</option>
            <option value="FY_2026_27">Financial Year 2026-27</option>
            <option value="ALL">All Recorded Time</option>
          </select>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Monthly Trend Chart (2 Columns) -->
        <div class="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-bold text-slate-800 text-sm">Revenue vs Direct Costs vs Net Profit (Last 6 Months)</h4>
            <span class="text-xs text-slate-400 font-normal">Amounts in ₹ INR</span>
          </div>

          <!-- SVG Bar Chart -->
          <div class="relative h-72 w-full pt-4">
            <svg class="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
              <!-- Y-Axis Gridlines & Labels -->
              <g stroke="#f1f5f9" stroke-dasharray="3 3">
                <line x1="50" y1="20" x2="590" y2="20" />
                <line x1="50" y1="65" x2="590" y2="65" />
                <line x1="50" y1="110" x2="590" y2="110" />
                <line x1="50" y1="155" x2="590" y2="155" />
                <line x1="50" y1="200" x2="590" y2="200" />
              </g>

              <g fill="#94a3b8" font-size="10" text-anchor="end" font-family="sans-serif">
                <text x="44" y="24">₹{{ ((maxChartValue) / 1000).toFixed(0) }}k</text>
                <text x="44" y="69">₹{{ ((maxChartValue * 0.75) / 1000).toFixed(0) }}k</text>
                <text x="44" y="114">₹{{ ((maxChartValue * 0.5) / 1000).toFixed(0) }}k</text>
                <text x="44" y="159">₹{{ ((maxChartValue * 0.25) / 1000).toFixed(0) }}k</text>
                <text x="44" y="204">₹0k</text>
              </g>

              <!-- Monthly Grouped Bars -->
              <g v-for="(item, index) in monthlyTrends" :key="item.month">
                <!-- Group Container at X Position -->
                <g
                  @mouseenter="hoveredMonthIndex = index"
                  @mouseleave="hoveredMonthIndex = null"
                  class="cursor-pointer"
                >
                  <!-- Group Slot (X offset) -->
                  <!-- Bar 1: Revenue Collected (Green #10b981) -->
                  <rect
                    :x="65 + index * 88"
                    :y="200 - Math.min(180, (item.revenue / maxChartValue) * 180)"
                    width="18"
                    :height="Math.max(2, (item.revenue / maxChartValue) * 180)"
                    rx="3"
                    fill="#10b981"
                    class="transition-all hover:opacity-85"
                  />

                  <!-- Bar 2: Project Direct Costs (Amber #f59e0b) -->
                  <rect
                    :x="65 + index * 88 + 22"
                    :y="200 - Math.min(180, (item.cost / maxChartValue) * 180)"
                    width="18"
                    :height="Math.max(2, (item.cost / maxChartValue) * 180)"
                    rx="3"
                    fill="#f59e0b"
                    class="transition-all hover:opacity-85"
                  />

                  <!-- Bar 3: Net Realized Profit (Blue #3b82f6) -->
                  <rect
                    :x="65 + index * 88 + 44"
                    :y="200 - Math.min(180, Math.max(0, (item.profit / maxChartValue) * 180))"
                    width="18"
                    :height="Math.max(2, Math.max(0, (item.profit / maxChartValue) * 180))"
                    rx="3"
                    fill="#3b82f6"
                    class="transition-all hover:opacity-85"
                  />

                  <!-- X-Axis Month Label -->
                  <text
                    :x="65 + index * 88 + 31"
                    y="222"
                    fill="#64748b"
                    font-size="10.5"
                    text-anchor="middle"
                    font-weight="500"
                  >
                    {{ item.month }}
                  </text>
                </g>
              </g>
            </svg>

            <!-- Floating Tooltip on Hover -->
            <div
              v-if="hoveredMonthIndex !== null && monthlyTrends[hoveredMonthIndex]"
              class="absolute top-2 right-4 bg-slate-900/90 text-white rounded-lg p-2.5 text-xs shadow-lg backdrop-blur-xs pointer-events-none border border-slate-700"
            >
              <div class="font-bold border-b border-slate-700 pb-1 mb-1.5">{{ monthlyTrends[hoveredMonthIndex].month }}</div>
              <div class="flex items-center justify-between gap-4 text-emerald-400">
                <span>Revenue:</span>
                <span class="font-mono font-bold">₹{{ formatNumber(monthlyTrends[hoveredMonthIndex].revenue) }}</span>
              </div>
              <div class="flex items-center justify-between gap-4 text-amber-400">
                <span>Direct Costs:</span>
                <span class="font-mono font-bold">₹{{ formatNumber(monthlyTrends[hoveredMonthIndex].cost) }}</span>
              </div>
              <div class="flex items-center justify-between gap-4 text-blue-400">
                <span>Net Profit:</span>
                <span class="font-mono font-bold">₹{{ formatNumber(monthlyTrends[hoveredMonthIndex].profit) }}</span>
              </div>
            </div>
          </div>

          <!-- Bottom Legend -->
          <div class="flex items-center justify-center gap-6 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-xs bg-blue-500 inline-block"></span>
              <span>Net Realized Profit</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-xs bg-amber-500 inline-block"></span>
              <span>Project Direct Costs</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-xs bg-emerald-500 inline-block"></span>
              <span>Revenue Collected</span>
            </div>
          </div>
        </div>

        <!-- Direct Expense Distribution Donut Chart (1 Column) -->
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <h4 class="font-bold text-slate-800 text-sm mb-2">Direct Expense Distribution</h4>

          <div class="flex flex-col items-center justify-center py-4">
            <!-- Donut SVG -->
            <div class="relative w-44 h-44">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <!-- Background Circle -->
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#f1f5f9"
                  stroke-width="5"
                />

                <!-- Donut Segments -->
                <circle
                  v-for="seg in donutSegments"
                  :key="seg.category"
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  :stroke="seg.color"
                  stroke-width="5"
                  :stroke-dasharray="seg.strokeDasharray"
                  :stroke-dashoffset="seg.strokeDashoffset"
                  class="transition-all duration-500"
                />
              </svg>

              <!-- Donut Center Label -->
              <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span class="text-[10px] uppercase font-bold text-slate-400">Total Ops</span>
                <span class="text-sm font-bold text-slate-800 font-mono mt-0.5">
                  ₹{{ formatNumber(dashboardData?.totalOperationalExpenses) }}
                </span>
              </div>
            </div>

            <!-- Expense Category Legend -->
            <div class="w-full mt-4 space-y-2 text-xs">
              <div
                v-for="seg in donutSegments"
                :key="seg.category"
                class="flex items-center justify-between text-slate-600"
              >
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: seg.color }"></span>
                  <span class="text-[11px] font-semibold uppercase">{{ seg.category.replace('_', ' ') }}</span>
                </div>
                <span class="font-mono font-bold text-slate-900">₹{{ formatNumber(seg.amount) }}</span>
              </div>
              <div v-if="donutSegments.length === 0" class="text-center py-2 text-slate-400 text-xs">
                No direct expenses in this period
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Action Cards Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Card: Pending Technician Disbursements -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span class="text-[11px] uppercase font-bold text-slate-400 block">Pending Technician Disbursements</span>
            <div class="text-xl font-bold text-slate-900 font-mono mt-0.5">
              ₹{{ formatNumber(dashboardData?.pendingTechnicianPayouts) }}
            </div>
            <span class="text-xs text-slate-500">Scheduled payroll pending installation audit</span>
          </div>
          <button
            type="button"
            @click="activeTab = 'payouts'"
            class="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Review Payouts</span>
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Card: Subsidies Pending Receipt -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span class="text-[11px] uppercase font-bold text-slate-400 block">Subsidies Pending Receipt</span>
            <div class="text-xl font-bold text-slate-900 font-mono mt-0.5">
              ₹{{ formatNumber(dashboardData?.subsidiesPendingReceipt) }}
            </div>
            <span class="text-xs text-slate-500">Approved by MNRE portal, awaiting treasury</span>
          </div>
          <button
            type="button"
            @click="activeTab = 'subsidies'"
            class="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Reconcile Subsidies</span>
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Accounts Receivable Aging Analysis Card -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h4 class="font-bold text-slate-800 text-sm mb-1">Accounts Receivable Aging Analysis</h4>
        <p class="text-xs text-slate-500 mb-4">Outstanding customer collection balances past order confirmation date</p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg">
            <span class="text-[11px] font-semibold text-emerald-800 uppercase block">Current (0–30 Days)</span>
            <span class="text-base font-bold font-mono text-emerald-900 mt-1 block">
              ₹{{ formatNumber(dashboardData?.aging0To30Days) }}
            </span>
            <span class="text-[10px] text-emerald-700">Active collection cycle</span>
          </div>
          <div class="p-3 bg-blue-50/60 border border-blue-100 rounded-lg">
            <span class="text-[11px] font-semibold text-blue-800 uppercase block">31–60 Days</span>
            <span class="text-base font-bold font-mono text-blue-900 mt-1 block">
              ₹{{ formatNumber(dashboardData?.aging31To60Days) }}
            </span>
            <span class="text-[10px] text-blue-700">First reminder phase</span>
          </div>
          <div class="p-3 bg-amber-50/60 border border-amber-100 rounded-lg">
            <span class="text-[11px] font-semibold text-amber-800 uppercase block">61–90 Days</span>
            <span class="text-base font-bold font-mono text-amber-900 mt-1 block">
              ₹{{ formatNumber(dashboardData?.aging61To90Days) }}
            </span>
            <span class="text-[10px] text-amber-700">Escalation phase</span>
          </div>
          <div class="p-3 bg-rose-50/60 border border-rose-100 rounded-lg">
            <span class="text-[11px] font-semibold text-rose-800 uppercase block">&gt; 90 Days Critical</span>
            <span class="text-base font-bold font-mono text-rose-900 mt-1 block">
              ₹{{ formatNumber(dashboardData?.agingOver90Days) }}
            </span>
            <span class="text-[10px] text-rose-700">Credit hold notice</span>
          </div>
        </div>
      </div>

      <!-- Quick Summary Table of Recent Job Margins -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 class="text-sm font-bold text-slate-800">Job Profitability Snapshot</h2>
          <button
            type="button"
            @click="activeTab = 'profitability'"
            class="text-xs text-emerald-700 font-semibold hover:text-emerald-800 cursor-pointer"
          >
            View All Ledger &gt;
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-2.5 px-4">Order #</th>
                <th class="py-2.5 px-4">Customer</th>
                <th class="py-2.5 px-4 text-right">Contract Revenue</th>
                <th class="py-2.5 px-4 text-right">Hardware Cost</th>
                <th class="py-2.5 px-4 text-right">Labor Cost</th>
                <th class="py-2.5 px-4 text-right">Net Profit</th>
                <th class="py-2.5 px-4 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="jp in profitability.slice(0, 5)" :key="jp.orderId" class="hover:bg-slate-50">
                <td class="py-2.5 px-4 font-mono font-bold text-slate-900">{{ jp.orderNumber }}</td>
                <td class="py-2.5 px-4 font-semibold text-slate-800">{{ jp.customerName }}</td>
                <td class="py-2.5 px-4 text-right font-medium">₹{{ formatNumber(jp.orderAmount) }}</td>
                <td class="py-2.5 px-4 text-right text-slate-500">₹{{ formatNumber(jp.hardwareCost) }}</td>
                <td class="py-2.5 px-4 text-right text-slate-500">₹{{ formatNumber(jp.installationLaborCost || jp.technicianCost || 0) }}</td>
                <td class="py-2.5 px-4 text-right font-bold text-emerald-700">₹{{ formatNumber(jp.netProfit) }}</td>
                <td class="py-2.5 px-4 text-right font-bold">
                  <span :class="jp.profitMarginPercentage >= 20 ? 'text-emerald-700' : 'text-amber-600'">
                    {{ jp.profitMarginPercentage?.toFixed(1) }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Unified Financial Transactions Feed -->
      <div v-if="dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0" class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Unified Financial Activity Feed</h3>
            <p class="text-xs text-slate-500">Chronological live transactions across customer collections, labor payouts, supplier orders, and expenses</p>
          </div>
          <span class="text-xs text-slate-400 font-mono">Live ERP Feed</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-2.5 px-4">Date</th>
                <th class="py-2.5 px-4">Type</th>
                <th class="py-2.5 px-4">Reference</th>
                <th class="py-2.5 px-4">Description</th>
                <th class="py-2.5 px-4 text-right">Amount</th>
                <th class="py-2.5 px-4 text-center">Cash Impact</th>
                <th class="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(tx, idx) in dashboardData.recentTransactions" :key="idx" class="hover:bg-slate-50 transition">
                <td class="py-2.5 px-4 whitespace-nowrap font-medium text-slate-700">{{ tx.date }}</td>
                <td class="py-2.5 px-4">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                    {{ tx.type?.replace('_', ' ') }}
                  </span>
                </td>
                <td class="py-2.5 px-4 font-mono font-bold text-slate-900">{{ tx.reference }}</td>
                <td class="py-2.5 px-4 text-slate-700">{{ tx.description }}</td>
                <td class="py-2.5 px-4 text-right font-mono font-bold" :class="tx.flow === 'INFLOW' ? 'text-emerald-700' : 'text-slate-900'">
                  ₹{{ formatNumber(tx.amount) }}
                </td>
                <td class="py-2.5 px-4 text-center">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                      tx.flow === 'INFLOW' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    ]"
                  >
                    {{ tx.flow === 'INFLOW' ? '+ Inflow' : '- Outflow' }}
                  </span>
                </td>
                <td class="py-2.5 px-4 text-right font-semibold text-slate-600">{{ tx.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ================= TAB 2: CUSTOMER PAYMENTS ================= -->
    <div v-if="activeTab === 'payments'" class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="p-4 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h3 class="text-sm font-bold text-slate-900">Customer Payment Transactions</h3>
          <p class="text-xs text-slate-500">Official cash inflows, booking advances, stage collections, and reversals</p>
        </div>
        <button
          type="button"
          @click="isPaymentModalOpen = true"
          class="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs cursor-pointer"
        >
          <CreditCard class="w-3.5 h-3.5 mr-1.5" />
          <span>Record Payment</span>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">Payment #</th>
              <th class="py-3 px-4">Customer</th>
              <th class="py-3 px-4">Order Ref</th>
              <th class="py-3 px-4 text-right">Amount</th>
              <th class="py-3 px-4">Type</th>
              <th class="py-3 px-4">Method</th>
              <th class="py-3 px-4">Reference / UTR</th>
              <th class="py-3 px-4">Date</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="pay in payments" :key="pay.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ pay.paymentNumber }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">{{ pay.customer?.fullName || '-' }}</td>
              <td class="py-3 px-4 font-mono text-slate-600">{{ pay.salesOrder?.orderNumber || '-' }}</td>
              <td class="py-3 px-4 text-right font-bold text-emerald-700">₹{{ formatNumber(pay.amount) }}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                  {{ pay.type }}
                </span>
              </td>
              <td class="py-3 px-4">{{ pay.method }}</td>
              <td class="py-3 px-4 font-mono text-slate-600">{{ pay.referenceNumber || '-' }}</td>
              <td class="py-3 px-4 whitespace-nowrap">{{ pay.paymentDate }}</td>
              <td class="py-3 px-4">
                <StatusBadge :status="pay.status" />
              </td>
              <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    @click="openReceiptModal(pay.id)"
                    class="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                    title="View & Print Payment Receipt"
                  >
                    Receipt
                  </button>
                  <button
                    v-if="pay.status === 'SUCCESS'"
                    type="button"
                    @click="handleReversePayment(pay.id)"
                    class="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                    title="Reverse payment & restore customer balance"
                  >
                    Reverse
                  </button>
                  <span v-else class="text-slate-400 text-[11px]">-</span>
                </div>
              </td>
            </tr>
            <tr v-if="payments.length === 0">
              <td colspan="10" class="py-8 text-center text-slate-400">No customer payments recorded yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================= TAB 3: JOB-WISE PROFITABILITY ================= -->
    <div v-if="activeTab === 'profitability'" class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">Order #</th>
              <th class="py-3 px-4">Customer</th>
              <th class="py-3 px-4">System Spec</th>
              <th class="py-3 px-4 text-right">Order Revenue</th>
              <th class="py-3 px-4 text-right">Received</th>
              <th class="py-3 px-4 text-right">Hardware Cost</th>
              <th class="py-3 px-4 text-right">Total Cost</th>
              <th class="py-3 px-4 text-right">Net Profit</th>
              <th class="py-3 px-4 text-right">Margin %</th>
              <th class="py-3 px-4">Health Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="jp in profitability" :key="jp.orderId" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ jp.orderNumber }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">{{ jp.customerName }}</td>
              <td class="py-3 px-4">{{ jp.capacityKw }} kW {{ jp.systemType }}</td>
              <td class="py-3 px-4 text-right font-bold text-slate-900">₹{{ formatNumber(jp.orderAmount) }}</td>
              <td class="py-3 px-4 text-right text-emerald-700 font-medium">₹{{ formatNumber(jp.revenueReceived) }}</td>
              <td class="py-3 px-4 text-right text-slate-500">₹{{ formatNumber(jp.hardwareCost) }}</td>
              <td class="py-3 px-4 text-right font-medium text-slate-700">₹{{ formatNumber(jp.totalCost) }}</td>
              <td class="py-3 px-4 text-right font-bold text-emerald-700">₹{{ formatNumber(jp.netProfit) }}</td>
              <td class="py-3 px-4 text-right font-bold text-slate-900">{{ jp.profitMarginPercentage?.toFixed(1) }}%</td>
              <td class="py-3 px-4">
                <span
                  v-if="jp.profitMarginPercentage >= 20"
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"
                >
                  HIGH MARGIN
                </span>
                <span
                  v-else-if="jp.profitMarginPercentage >= 10"
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
                >
                  NORMAL MARGIN
                </span>
                <span
                  v-else
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200"
                >
                  LOW MARGIN
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================= TAB 4: GST TAX INVOICES ================= -->
    <div v-if="activeTab === 'invoices'" class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">Invoice #</th>
              <th class="py-3 px-4">Customer</th>
              <th class="py-3 px-4">Date</th>
              <th class="py-3 px-4 text-right">Subtotal</th>
              <th class="py-3 px-4 text-right">GST (CGST+SGST)</th>
              <th class="py-3 px-4 text-right">Total Invoice</th>
              <th class="py-3 px-4 text-right">Paid</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="inv in invoices" :key="inv.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ inv.invoiceNumber }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">{{ inv.customer?.fullName || '-' }}</td>
              <td class="py-3 px-4 whitespace-nowrap">{{ inv.invoiceDate }}</td>
              <td class="py-3 px-4 text-right font-medium">₹{{ formatNumber(inv.subtotal) }}</td>
              <td class="py-3 px-4 text-right text-slate-500">₹{{ formatNumber(inv.taxAmount) }}</td>
              <td class="py-3 px-4 text-right font-bold text-slate-900">₹{{ formatNumber(inv.totalAmount) }}</td>
              <td class="py-3 px-4 text-right text-emerald-700 font-bold">₹{{ formatNumber(inv.paidAmount) }}</td>
              <td class="py-3 px-4">
                <StatusBadge :status="inv.status" />
              </td>
              <td class="py-3 px-4 text-right space-x-2">
                <button
                  type="button"
                  @click="selectedInvoice = inv"
                  class="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  View / Print
                </button>
                <button
                  v-if="inv.status !== 'CANCELLED' && inv.status !== 'PAID'"
                  type="button"
                  @click="openCancelInvoiceModal(inv)"
                  class="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================= TAB 5: TECHNICIAN PAYOUTS ================= -->
    <div v-if="activeTab === 'payouts'" class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="p-4 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h3 class="text-sm font-bold text-slate-900">Field Technician Payroll Ledger</h3>
          <p class="text-xs text-slate-500">Verified labor hours, installation completion payouts, and payment references</p>
        </div>
        <button
          type="button"
          @click="isPayoutModalOpen = true"
          class="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs cursor-pointer"
        >
          <UserCheck class="w-3.5 h-3.5 mr-1.5" />
          <span>Disburse Payout</span>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">Payout #</th>
              <th class="py-3 px-4">Technician</th>
              <th class="py-3 px-4">Installation Ref</th>
              <th class="py-3 px-4">Hours</th>
              <th class="py-3 px-4 text-right">Amount Paid</th>
              <th class="py-3 px-4">Payment Method</th>
              <th class="py-3 px-4">Reference #</th>
              <th class="py-3 px-4">Date</th>
              <th class="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="pay in payouts" :key="pay.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ pay.paymentNumber }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">{{ pay.technician?.name || '-' }}</td>
              <td class="py-3 px-4 font-mono text-slate-600">{{ pay.installation?.installationNumber || '-' }}</td>
              <td class="py-3 px-4">{{ pay.hoursCounted || '-' }} hrs</td>
              <td class="py-3 px-4 text-right font-bold text-emerald-700">₹{{ formatNumber(pay.amountPaid || pay.amount) }}</td>
              <td class="py-3 px-4">{{ pay.paymentMethod }}</td>
              <td class="py-3 px-4 font-mono text-slate-600">{{ pay.referenceNumber || '-' }}</td>
              <td class="py-3 px-4 whitespace-nowrap">{{ pay.paymentDate }}</td>
              <td class="py-3 px-4">
                <StatusBadge :status="pay.status || 'PAID'" />
              </td>
            </tr>
            <tr v-if="payouts.length === 0">
              <td colspan="9" class="py-8 text-center text-slate-400">No technician payouts recorded yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================= TAB 6: PM SURYA GHAR SUBSIDIES ================= -->
    <div v-if="activeTab === 'subsidies'" class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">App Ref #</th>
              <th class="py-3 px-4">National Portal Reg #</th>
              <th class="py-3 px-4">Customer</th>
              <th class="py-3 px-4 text-right">Claimed</th>
              <th class="py-3 px-4 text-right">Sanctioned</th>
              <th class="py-3 px-4 text-right">Disbursed</th>
              <th class="py-3 px-4">Discom Info</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="sub in subsidies" :key="sub.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ sub.applicationNumber }}</td>
              <td class="py-3 px-4 font-mono text-purple-700 font-bold">{{ sub.nationalPortalRegNumber || 'Pending Submission' }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">{{ sub.customer?.fullName }}</td>
              <td class="py-3 px-4 text-right font-medium">₹{{ formatNumber(sub.subsidyAmountClaimed) }}</td>
              <td class="py-3 px-4 text-right font-bold text-slate-800">₹{{ formatNumber(sub.subsidyAmountApproved) }}</td>
              <td class="py-3 px-4 text-right font-bold text-emerald-700">₹{{ formatNumber(sub.amountReceived) }}</td>
              <td class="py-3 px-4 text-[11px] text-slate-500 font-mono">
                {{ (sub as any).discomConsumerNumber || '-' }}
              </td>
              <td class="py-3 px-4">
                <StatusBadge :status="sub.status" />
              </td>
              <td class="py-3 px-4 text-right">
                <button
                  type="button"
                  @click="openSubsidyModal(sub)"
                  class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs cursor-pointer"
                >
                  Update Stage
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================= TAB 7: OPERATIONAL EXPENSES ================= -->
    <div v-if="activeTab === 'expenses'" class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="p-4 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h3 class="text-sm font-bold text-slate-900">Direct Operational Expenses</h3>
          <p class="text-xs text-slate-500">Logistics, cranes, safety equipment, transport, and permit fees</p>
        </div>
        <button
          type="button"
          @click="isExpenseModalOpen = true"
          class="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-xs cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5 mr-1.5" />
          <span>Record Expense</span>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">Expense #</th>
              <th class="py-3 px-4">Category</th>
              <th class="py-3 px-4">Title & Description</th>
              <th class="py-3 px-4 text-right">Amount</th>
              <th class="py-3 px-4">Paid To</th>
              <th class="py-3 px-4">Date</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="exp in expenses" :key="exp.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ exp.expenseNumber }}</td>
              <td class="py-3 px-4">
                <span class="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 uppercase">
                  {{ exp.category }}
                </span>
              </td>
              <td class="py-3 px-4">
                <span class="font-bold text-slate-800 block">{{ exp.title }}</span>
                <span class="text-slate-500 text-[11px]">{{ exp.description }}</span>
              </td>
              <td class="py-3 px-4 text-right font-bold text-rose-700">₹{{ formatNumber(exp.amount) }}</td>
              <td class="py-3 px-4 text-slate-700">{{ exp.paidTo }}</td>
              <td class="py-3 px-4 whitespace-nowrap">{{ exp.expenseDate }}</td>
              <td class="py-3 px-4">
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                    exp.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                    exp.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                    exp.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  ]"
                >
                  {{ exp.status || 'APPROVED' }}
                </span>
              </td>
              <td class="py-3 px-4 text-right">
                <div v-if="exp.status === 'PENDING'" class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    @click="handleApproveExpense(exp.id)"
                    class="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    @click="handleRejectExpense(exp.id)"
                    class="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[10px] cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
                <span v-else class="text-slate-400 text-[11px]">{{ exp.approvedBy || '-' }}</span>
              </td>
            </tr>
            <tr v-if="expenses.length === 0">
              <td colspan="6" class="py-8 text-center text-slate-400">No operational expenses recorded yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

        <!-- ================= TAB 8: SUPPLIER INVOICES & PAYMENTS ================= -->
    <div v-if="activeTab === 'suppliers'" class="space-y-6">
      <!-- Supplier Balance KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[11px] uppercase font-bold text-slate-400 block">Total Purchases</span>
          <div class="text-xl font-bold text-slate-900 font-mono mt-0.5">
            ₹{{ formatNumber(supplierPurchases.reduce((s, p) => s + (p.totalAmount || 0), 0)) }}
          </div>
          <span class="text-xs text-slate-500">Hardware & material procurements</span>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[11px] uppercase font-bold text-slate-400 block">Total Disbursed</span>
          <div class="text-xl font-bold text-emerald-700 font-mono mt-0.5">
            ₹{{ formatNumber(supplierPurchases.reduce((s, p) => s + (p.paidAmount || 0), 0)) }}
          </div>
          <span class="text-xs text-slate-500">Verified vendor disbursements</span>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[11px] uppercase font-bold text-slate-400 block">Outstanding Payables</span>
          <div class="text-xl font-bold text-rose-700 font-mono mt-0.5">
            ₹{{ formatNumber(dashboardData?.outstandingSupplierPayments || supplierPurchases.reduce((s, p) => s + (p.remainingBalance || 0), 0)) }}
          </div>
          <span class="text-xs text-slate-500">Pending supplier settle balances</span>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span class="text-[11px] uppercase font-bold text-slate-400 block">Export Ledger</span>
            <span class="text-xs text-slate-500 block mt-1">Download complete supplier POs</span>
          </div>
          <button
            type="button"
            @click="exportCsvFile('/finance/export/suppliers', 'SunPower_Supplier_Purchases')"
            class="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <Download class="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      <!-- Supplier Purchases Table -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Supplier Purchase Orders & Invoices</h3>
            <p class="text-xs text-slate-500">BOM hardware procurements, panel shipments, and inverter deliveries</p>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">PO / Purchase #</th>
                <th class="py-3 px-4">Supplier Name</th>
                <th class="py-3 px-4 text-right">PO Total</th>
                <th class="py-3 px-4 text-right">Paid</th>
                <th class="py-3 px-4 text-right">Remaining Balance</th>
                <th class="py-3 px-4">Due Date</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="p in supplierPurchases" :key="p.id" class="hover:bg-slate-50 transition">
                <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ p.purchaseNumber }}</td>
                <td class="py-3 px-4 font-semibold text-slate-800">{{ p.supplierName }}</td>
                <td class="py-3 px-4 text-right font-bold text-slate-900">₹{{ formatNumber(p.totalAmount) }}</td>
                <td class="py-3 px-4 text-right font-medium text-emerald-700">₹{{ formatNumber(p.paidAmount) }}</td>
                <td class="py-3 px-4 text-right font-bold text-rose-700">₹{{ formatNumber(p.remainingBalance) }}</td>
                <td class="py-3 px-4 whitespace-nowrap">{{ p.dueDate || '-' }}</td>
                <td class="py-3 px-4">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                      p.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                      p.paymentStatus === 'PARTIALLY_PAID' ? 'bg-blue-100 text-blue-800' :
                      p.paymentStatus === 'OVERDUE' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    ]"
                  >
                    {{ p.paymentStatus || 'UNPAID' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right">
                  <button
                    v-if="p.paymentStatus !== 'PAID'"
                    type="button"
                    @click="openSupplierPaymentModal(p)"
                    class="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] cursor-pointer"
                  >
                    Record Payment
                  </button>
                  <span v-else class="text-slate-400 text-[11px]">Settled</span>
                </td>
              </tr>
              <tr v-if="supplierPurchases.length === 0">
                <td colspan="8" class="py-8 text-center text-slate-400">No supplier purchases found in the database.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Supplier Payments Disbursement History -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-200">
          <h3 class="text-sm font-bold text-slate-900">Supplier Disbursement History</h3>
          <p class="text-xs text-slate-500">Verified bank transfers and payments executed to equipment manufacturers</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">Disbursement #</th>
                <th class="py-3 px-4">Supplier</th>
                <th class="py-3 px-4 text-right">Amount</th>
                <th class="py-3 px-4">Method</th>
                <th class="py-3 px-4">Reference / UTR</th>
                <th class="py-3 px-4">Date</th>
                <th class="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="sp in supplierPayments" :key="sp.id" class="hover:bg-slate-50">
                <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ sp.paymentNumber }}</td>
                <td class="py-3 px-4 font-semibold text-slate-800">{{ sp.supplierName }}</td>
                <td class="py-3 px-4 text-right font-bold text-slate-900">₹{{ formatNumber(sp.amount) }}</td>
                <td class="py-3 px-4">{{ sp.paymentMethod }}</td>
                <td class="py-3 px-4 font-mono text-slate-600">{{ sp.referenceNumber || '-' }}</td>
                <td class="py-3 px-4 whitespace-nowrap">{{ sp.paymentDate }}</td>
                <td class="py-3 px-4">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                    {{ sp.status }}
                  </span>
                </td>
              </tr>
              <tr v-if="supplierPayments.length === 0">
                <td colspan="7" class="py-8 text-center text-slate-400">No supplier payments disbursed yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ================= TAB 9: FINANCIAL STATEMENTS & REPORTS ================= -->
    <div v-if="activeTab === 'reports'" class="space-y-6">
      <!-- Sub-navigation & Export Actions -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="reportsActiveTab = 'pnl'"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition',
              reportsActiveTab === 'pnl' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            ]"
          >
            Profit &amp; Loss
          </button>
          <button
            type="button"
            @click="reportsActiveTab = 'cashflow'"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition',
              reportsActiveTab === 'cashflow' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            ]"
          >
            Cash Flow Statement
          </button>
          <button
            type="button"
            @click="reportsActiveTab = 'gst'"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition',
              reportsActiveTab === 'gst' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            ]"
          >
            GST Liability &amp; ITC
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="exportCsvFile('/finance/export/job-profitability', 'SunPower_Job_Profitability')"
            class="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <Download class="w-3.5 h-3.5" />
            <span>P&amp;L CSV</span>
          </button>
          <button
            type="button"
            @click="exportCsvFile('/finance/export/invoices', 'SunPower_GST_Invoices')"
            class="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <Download class="w-3.5 h-3.5" />
            <span>GST CSV</span>
          </button>
          <button
            type="button"
            @click="exportCsvFile('/finance/export/expenses', 'SunPower_Expenses')"
            class="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <Download class="w-3.5 h-3.5" />
            <span>Expenses CSV</span>
          </button>
        </div>
      </div>

      <!-- Report View 1: Profit and Loss Statement -->
      <div v-if="reportsActiveTab === 'pnl'" class="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-4xl mx-auto space-y-6">
        <div class="border-b border-slate-200 pb-4 flex justify-between items-start">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Statement of Profit &amp; Loss</h3>
            <p class="text-xs text-slate-500">Period: {{ period }} | Currency: INR (₹) | Standard Accrual Basis</p>
          </div>
          <span class="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-200">
            Official GAAP Compliant
          </span>
        </div>

        <div class="space-y-4 text-sm">
          <!-- Revenue Section -->
          <div>
            <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 mb-2">1. Operating Revenue</h4>
            <div class="space-y-1.5 pl-4 border-l-2 border-emerald-500">
              <div class="flex justify-between py-1">
                <span class="text-slate-600">Total Invoiced Billing (Gross incl. GST)</span>
                <span class="font-mono text-slate-700">₹{{ formatNumber(pnlReport?.totalRevenue) }}</span>
              </div>
              <div class="flex justify-between py-1 font-semibold text-slate-900 border-t border-slate-100">
                <span>Recognized Accounting Revenue (Excl. GST Tax)</span>
                <span class="font-mono text-emerald-700">₹{{ formatNumber(pnlReport?.gstExcludedRevenue) }}</span>
              </div>
            </div>
          </div>

          <!-- Cost of Goods Sold Section -->
          <div>
            <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 mb-2">2. Cost of Goods Sold (COGS)</h4>
            <div class="space-y-1.5 pl-4 border-l-2 border-amber-500">
              <div class="flex justify-between py-1 text-slate-600">
                <span>Solar Equipment &amp; Hardware BOM</span>
                <span class="font-mono">₹{{ formatNumber(pnlReport?.hardwareCogs) }}</span>
              </div>
              <div class="flex justify-between py-1 text-slate-600">
                <span>Direct Installation Labor &amp; Technician Payouts</span>
                <span class="font-mono">₹{{ formatNumber(pnlReport?.installationLaborCogs) }}</span>
              </div>
              <div class="flex justify-between py-1 font-semibold text-slate-900 border-t border-slate-100">
                <span>Total Cost of Goods Sold</span>
                <span class="font-mono text-amber-700">₹{{ formatNumber(pnlReport?.totalCogs) }}</span>
              </div>
            </div>
          </div>

          <!-- Gross Profit Row -->
          <div class="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex justify-between items-center font-bold">
            <div>
              <span class="text-emerald-900 text-base">Gross Profit (Revenue − COGS)</span>
              <span class="text-xs text-emerald-700 block font-normal">Gross Margin: {{ pnlReport?.grossMarginPercentage?.toFixed(1) || 0 }}%</span>
            </div>
            <span class="font-mono text-lg text-emerald-800">₹{{ formatNumber(pnlReport?.grossProfit) }}</span>
          </div>

          <!-- Operating Expenses Section -->
          <div>
            <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 mb-2">3. Operating Expenses</h4>
            <div class="space-y-1.5 pl-4 border-l-2 border-slate-400">
              <div v-for="cat in pnlReport?.operatingExpensesBreakdown" :key="cat.category" class="flex justify-between py-1 text-slate-600">
                <span class="capitalize">{{ cat.category.toLowerCase().replace('_', ' ') }}</span>
                <span class="font-mono">₹{{ formatNumber(cat.amount) }}</span>
              </div>
              <div class="flex justify-between py-1 font-semibold text-slate-900 border-t border-slate-100">
                <span>Total Operating Expenses</span>
                <span class="font-mono text-slate-800">₹{{ formatNumber(pnlReport?.totalOperatingExpenses) }}</span>
              </div>
            </div>
          </div>

          <!-- Net Profit Row -->
          <div class="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center font-bold shadow-lg">
            <div>
              <span class="text-lg">Net Operating Profit</span>
              <span class="text-xs text-slate-300 block font-normal">Net Profit Margin: {{ pnlReport?.netMarginPercentage?.toFixed(1) || 0 }}%</span>
            </div>
            <span class="font-mono text-2xl text-emerald-400">₹{{ formatNumber(pnlReport?.netProfit) }}</span>
          </div>
        </div>
      </div>

      <!-- Report View 2: Cash Flow Statement -->
      <div v-if="reportsActiveTab === 'cashflow'" class="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-4xl mx-auto space-y-6">
        <div class="border-b border-slate-200 pb-4">
          <h3 class="text-lg font-bold text-slate-900">Statement of Cash Flows</h3>
          <p class="text-xs text-slate-500">Period: {{ period }} | Actual Bank &amp; Cash Movements | Direct Method</p>
        </div>

        <div class="space-y-4 text-sm">
          <div class="flex justify-between py-2 border-b border-slate-100">
            <span class="font-semibold text-slate-700">Opening Cash &amp; Bank Balance</span>
            <span class="font-mono font-bold text-slate-900">₹{{ formatNumber(cashFlowReport?.openingBalance) }}</span>
          </div>

          <!-- Operating Inflows -->
          <div>
            <h4 class="font-bold text-xs uppercase tracking-wider text-emerald-700 mb-2">Operating Cash Inflows</h4>
            <div class="space-y-1.5 pl-4 border-l-2 border-emerald-500">
              <div class="flex justify-between py-1 text-slate-600">
                <span>Customer Stage Collections Received</span>
                <span class="font-mono text-emerald-700 font-semibold">+₹{{ formatNumber(cashFlowReport?.customerReceipts) }}</span>
              </div>
              <div class="flex justify-between py-1 text-slate-600">
                <span>PM Surya Ghar Subsidies Disbursed to Bank</span>
                <span class="font-mono text-emerald-700 font-semibold">+₹{{ formatNumber(cashFlowReport?.subsidyReceipts) }}</span>
              </div>
              <div class="flex justify-between py-1 font-semibold text-slate-900 border-t border-slate-100">
                <span>Total Operating Inflows</span>
                <span class="font-mono text-emerald-700 font-bold">+₹{{ formatNumber(cashFlowReport?.totalOperatingInflows) }}</span>
              </div>
            </div>
          </div>

          <!-- Operating Outflows -->
          <div>
            <h4 class="font-bold text-xs uppercase tracking-wider text-rose-700 mb-2">Operating Cash Outflows</h4>
            <div class="space-y-1.5 pl-4 border-l-2 border-rose-500">
              <div class="flex justify-between py-1 text-slate-600">
                <span>Supplier Material Payments Disbursed</span>
                <span class="font-mono text-rose-700 font-semibold">-₹{{ formatNumber(cashFlowReport?.supplierPayments) }}</span>
              </div>
              <div class="flex justify-between py-1 text-slate-600">
                <span>Technician &amp; Labor Field Disbursements</span>
                <span class="font-mono text-rose-700 font-semibold">-₹{{ formatNumber(cashFlowReport?.technicianPayouts) }}</span>
              </div>
              <div class="flex justify-between py-1 text-slate-600">
                <span>Direct Operating &amp; Site Expenses</span>
                <span class="font-mono text-rose-700 font-semibold">-₹{{ formatNumber(cashFlowReport?.directOperatingExpenses) }}</span>
              </div>
              <div class="flex justify-between py-1 font-semibold text-slate-900 border-t border-slate-100">
                <span>Total Operating Outflows</span>
                <span class="font-mono text-rose-700 font-bold">-₹{{ formatNumber(cashFlowReport?.totalOperatingOutflows) }}</span>
              </div>
            </div>
          </div>

          <!-- Net Cash Flow -->
          <div class="p-3 bg-blue-50/80 border border-blue-200 rounded-lg flex justify-between items-center font-bold">
            <span class="text-blue-900">Net Operating Cash Flow</span>
            <span class="font-mono text-lg" :class="Number(cashFlowReport?.netOperatingCashFlow) >= 0 ? 'text-emerald-700' : 'text-rose-700'">
              {{ Number(cashFlowReport?.netOperatingCashFlow) >= 0 ? '+' : '' }}₹{{ formatNumber(cashFlowReport?.netOperatingCashFlow) }}
            </span>
          </div>

          <!-- Closing Balance -->
          <div class="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center font-bold">
            <span class="text-lg">Closing Cash &amp; Bank Balance</span>
            <span class="font-mono text-2xl text-emerald-400">₹{{ formatNumber(cashFlowReport?.closingBalance) }}</span>
          </div>
        </div>
      </div>

      <!-- Report View 3: GST Liability Report -->
      <div v-if="reportsActiveTab === 'gst'" class="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-4xl mx-auto space-y-6">
        <div class="border-b border-slate-200 pb-4">
          <h3 class="text-lg font-bold text-slate-900">GST Tax Liability &amp; Input Tax Credit (ITC)</h3>
          <p class="text-xs text-slate-500">HSN 85414011 / SAC 995465 | Solar Composite Scheme 13.80%</p>
        </div>

        <div class="space-y-4 text-sm">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-xs text-slate-500 uppercase font-bold block">Output CGST (Central)</span>
              <span class="font-mono font-bold text-lg text-slate-900 mt-1 block">₹{{ formatNumber(gstReport?.outputCgst) }}</span>
            </div>
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-xs text-slate-500 uppercase font-bold block">Output SGST (State)</span>
              <span class="font-mono font-bold text-lg text-slate-900 mt-1 block">₹{{ formatNumber(gstReport?.outputSgst) }}</span>
            </div>
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-xs text-slate-500 uppercase font-bold block">Output IGST (Interstate)</span>
              <span class="font-mono font-bold text-lg text-slate-900 mt-1 block">₹{{ formatNumber(gstReport?.outputIgst) }}</span>
            </div>
          </div>

          <div class="space-y-2 pt-2">
            <div class="flex justify-between py-2 border-b border-slate-100">
              <span class="text-slate-700 font-semibold">Total Output GST Collected on Sales Invoices</span>
              <span class="font-mono font-bold text-slate-900">₹{{ formatNumber(gstReport?.totalOutputGst) }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-100">
              <span class="text-slate-700 font-semibold">Less: Eligible Input Tax Credit (ITC on Hardware Purchases)</span>
              <span class="font-mono font-bold text-emerald-700">-₹{{ formatNumber(gstReport?.inputGst) }}</span>
            </div>
            <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center font-bold">
              <div>
                <span class="text-emerald-900 text-base">Net GST Liability Payable to Government</span>
                <span class="text-xs text-emerald-700 block font-normal">GSTR-3B Monthly Return Filing</span>
              </div>
              <span class="font-mono text-2xl text-emerald-800">₹{{ formatNumber(gstReport?.netGstPayable) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= MODALS ================= -->

    <!-- Modal 1: Record Customer Payment -->
    <div v-if="isPaymentModalOpen" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-slate-900">Record Customer Payment</h2>
          <button type="button" @click="isPaymentModalOpen = false" class="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="handlePaymentSubmit" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Sales Order *</label>
            <select required v-model="paymentForm.salesOrderId" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
              <option value="">-- Choose Sales Order --</option>
              <option v-for="o in orders" :key="o.id" :value="o.id">
                {{ o.orderNumber }} — {{ o.customer?.fullName }} (Due: ₹{{ formatNumber(o.remainingBalance) }})
              </option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
              <input type="number" step="0.01" required v-model="paymentForm.amount" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Payment Type *</label>
              <select v-model="paymentForm.type" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="ADVANCE">ADVANCE (Booking)</option>
                <option value="STAGE_1">STAGE_1 (Dispatch)</option>
                <option value="STAGE_2">STAGE_2 (Installation)</option>
                <option value="FINAL_SETTLEMENT">FINAL_SETTLEMENT (Net-metering)</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Payment Method *</label>
              <select v-model="paymentForm.method" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">UTR / Ref Number *</label>
              <input type="text" required v-model="paymentForm.referenceNumber" placeholder="e.g. UTR128491823" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Notes</label>
            <input type="text" v-model="paymentForm.notes" placeholder="Optional payment remarks" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button type="button" @click="isPaymentModalOpen = false" class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs cursor-pointer">Record Payment</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal 2: Record Operational Expense -->
    <div v-if="isExpenseModalOpen" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-slate-900">Record Operational Expense</h2>
          <button type="button" @click="isExpenseModalOpen = false" class="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="handleExpenseSubmit" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Expense Title *</label>
            <input type="text" required v-model="expenseForm.title" placeholder="e.g. Crane Rental for 5kW Solar Lift" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Category *</label>
              <select v-model="expenseForm.category" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="TRANSPORT">TRANSPORT</option>
                <option value="INSTALLATION">INSTALLATION</option>
                <option value="SERVICE_REPAIR">SERVICE_REPAIR</option>
                <option value="TECHNICIAN_PAYOUT">TECHNICIAN_PAYOUT</option>
                <option value="PRODUCT_PURCHASE">PRODUCT_PURCHASE</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
              <input type="number" required v-model="expenseForm.amount" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Paid To *</label>
            <input type="text" required v-model="expenseForm.paidTo" placeholder="Vendor / Service Provider Name" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button type="button" @click="isExpenseModalOpen = false" class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-semibold shadow-xs cursor-pointer">Save Expense</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal 3: Technician Payout -->
    <div v-if="isPayoutModalOpen" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-slate-900">Disburse Technician Payout</h2>
          <button type="button" @click="isPayoutModalOpen = false" class="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="handlePayoutSubmit" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Technician *</label>
            <select required v-model="payoutForm.technicianId" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
              <option value="">-- Choose Technician --</option>
              <option v-for="t in technicians" :key="t.id" :value="t.id">{{ t.name }} ({{ t.phone }})</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Hours Counted</label>
              <input type="number" step="0.5" v-model="payoutForm.hoursCounted" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Amount to Pay (₹) *</label>
              <input type="number" required v-model="payoutForm.amountPaid" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">UTR / Bank Reference Number *</label>
            <input type="text" required v-model="payoutForm.referenceNumber" placeholder="e.g. UTR-PAY-9872" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button type="button" @click="isPayoutModalOpen = false" class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-xs cursor-pointer">Disburse Payout</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal 4: Update Subsidy Stage -->
    <div v-if="isSubsidyModalOpen && selectedSubsidy" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div class="flex justify-between items-center mb-1">
          <h2 class="text-lg font-bold text-slate-900">PM Surya Ghar Subsidy Tracker</h2>
          <button type="button" @click="isSubsidyModalOpen = false" class="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X class="w-5 h-5" />
          </button>
        </div>
        <p class="text-xs text-slate-500 mb-4">App: {{ selectedSubsidy.applicationNumber }} • Customer: {{ selectedSubsidy.customer?.fullName }}</p>

        <form @submit.prevent="handleSubsidySubmit" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">National Portal Application # *</label>
            <input type="text" required v-model="subsidyForm.nationalPortalRegNumber" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Subsidy Processing Stage *</label>
            <select v-model="subsidyForm.status" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
              <option value="DOCUMENTS_PENDING">DOCUMENTS_PENDING</option>
              <option value="SUBMITTED">SUBMITTED (Portal Uploaded)</option>
              <option value="UNDER_VERIFICATION">UNDER_VERIFICATION (DISCOM Inspection)</option>
              <option value="APPROVED">APPROVED (Sanction Issued)</option>
              <option value="AMOUNT_RECEIVED">AMOUNT_RECEIVED (Direct Bank Transfer Completed)</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Sanctioned Amount (₹)</label>
              <input type="number" v-model="subsidyForm.subsidyAmountApproved" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Disbursed to Bank (₹)</label>
              <input type="number" v-model="subsidyForm.amountReceived" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Discom Consumer #</label>
              <input type="text" v-model="subsidyForm.discomConsumerNumber" placeholder="EB / TANGEDCO Account #" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Discom Application #</label>
              <input type="text" v-model="subsidyForm.discomApplicationNumber" placeholder="Net-metering Application #" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Net Meter Installed Date</label>
              <input type="date" v-model="subsidyForm.netMeterInstalledDate" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Commissioning Cert #</label>
              <input type="text" v-model="subsidyForm.commissioningCertificateNumber" placeholder="Inspection Certificate #" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button type="button" @click="isSubsidyModalOpen = false" class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold shadow-xs cursor-pointer">Save Subsidy Stage</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal 5: View / Print Official GST Tax Invoice -->
    <div v-if="selectedInvoice" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <!-- Modal Controls -->
        <div class="flex justify-end items-center gap-2 mb-4 print:hidden">
          <button
            type="button"
            @click="printCurrentInvoice"
            class="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
          >
            <Printer class="w-3.5 h-3.5 mr-1.5" />
            <span>Print / PDF</span>
          </button>
          <button
            type="button"
            @click="selectedInvoice = null"
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Printable Invoice Content -->
        <div class="border-b border-slate-200 pb-6 flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2">
              <Building class="w-6 h-6 text-emerald-600" />
              <h2 class="text-xl font-black text-slate-900 tracking-tight">
                SUNPOWER SOLUTIONS PVT. LTD.
              </h2>
            </div>
            <div class="text-xs text-slate-500 mt-1 space-y-0.5">
              <p>124 Solar Technology Park, GST Road, Guindy, Chennai - 600032</p>
              <p>
                <span class="font-semibold text-slate-700">GSTIN:</span> 33AABCS1429B1Z0 •
                <span class="font-semibold text-slate-700">PAN:</span> AABCS1429B •
                <span class="font-semibold text-slate-700">State:</span> Tamil Nadu (Code: 33)
              </p>
            </div>
          </div>
          <div class="text-right">
            <span class="inline-block px-3 py-1 bg-slate-100 text-slate-800 font-bold rounded-lg text-xs uppercase tracking-wider">
              Tax Invoice
            </span>
            <div class="text-lg font-black text-slate-900 font-mono mt-1">
              {{ selectedInvoice.invoiceNumber }}
            </div>
            <div class="text-xs text-slate-500">
              Date: {{ selectedInvoice.invoiceDate }}
            </div>
            <div class="mt-1">
              <StatusBadge :status="selectedInvoice.status" />
            </div>
          </div>
        </div>

        <!-- Bill To / Supply Info -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 text-xs">
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span class="text-[10px] font-bold uppercase text-slate-400">Billed To Customer:</span>
            <div class="text-sm font-bold text-slate-900 mt-1">
              {{ selectedInvoice.customer?.fullName }}
            </div>
            <div class="text-slate-600 mt-1 leading-relaxed">
              {{ selectedInvoice.customer?.address || 'Site Address' }}, {{ selectedInvoice.customer?.city }} - {{ selectedInvoice.customer?.pincode }}
            </div>
            <div class="text-slate-500 mt-2">
              Phone: {{ selectedInvoice.customer?.phone }} • Email: {{ selectedInvoice.customer?.email }}
            </div>
            <div class="text-slate-700 font-mono font-medium mt-1">
              GSTIN: {{ (selectedInvoice as any).gstin || 'Unregistered Consumer (B2C)' }}
            </div>
          </div>

          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span class="text-[10px] font-bold uppercase text-slate-400">Invoice Particulars:</span>
            <div class="mt-2 space-y-1.5 text-slate-700">
              <div class="flex justify-between">
                <span class="text-slate-500">Sales Order Reference:</span>
                <span class="font-mono font-bold">{{ selectedInvoice.salesOrder?.orderNumber }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">System Capacity:</span>
                <span class="font-semibold">{{ selectedInvoice.salesOrder?.capacityKw || 5.0 }} kW</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Place of Supply:</span>
                <span class="font-medium">Tamil Nadu (33)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Line Items Table -->
        <div class="border border-slate-200 rounded-xl overflow-hidden my-6">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <th class="py-2.5 px-3">#</th>
                <th class="py-2.5 px-3">Description of Goods / Services</th>
                <th class="py-2.5 px-3">HSN / SAC</th>
                <th class="py-2.5 px-3 text-right">Taxable Value</th>
                <th class="py-2.5 px-3 text-right">GST Rate</th>
                <th class="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr>
                <td class="py-2.5 px-3 font-mono">1</td>
                <td class="py-2.5 px-3 font-medium text-slate-900">
                  Solar PV Generating System Hardware Component (70% Value)
                </td>
                <td class="py-2.5 px-3 font-mono">85414011</td>
                <td class="py-2.5 px-3 text-right font-mono">₹{{ formatNumber(selectedInvoice.subtotal * 0.70) }}</td>
                <td class="py-2.5 px-3 text-right">12% GST</td>
                <td class="py-2.5 px-3 text-right font-mono font-medium">₹{{ formatNumber((selectedInvoice.subtotal * 0.70) * 1.12) }}</td>
              </tr>
              <tr>
                <td class="py-2.5 px-3 font-mono">2</td>
                <td class="py-2.5 px-3 font-medium text-slate-900">
                  Solar Installation & Commissioning Erection Services (30% Value)
                </td>
                <td class="py-2.5 px-3 font-mono">995465</td>
                <td class="py-2.5 px-3 text-right font-mono">₹{{ formatNumber(selectedInvoice.subtotal * 0.30) }}</td>
                <td class="py-2.5 px-3 text-right">18% GST</td>
                <td class="py-2.5 px-3 text-right font-mono font-medium">₹{{ formatNumber((selectedInvoice.subtotal * 0.30) * 1.18) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals Calculation -->
        <div class="flex justify-end">
          <div class="w-72 space-y-2 text-xs">
            <div class="flex justify-between text-slate-600">
              <span>Taxable Subtotal:</span>
              <span class="font-mono font-bold">₹{{ formatNumber(selectedInvoice.subtotal) }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>CGST (Intra-state):</span>
              <span class="font-mono">₹{{ formatNumber(selectedInvoice.cgstAmount || (selectedInvoice.taxAmount / 2)) }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>SGST (Intra-state):</span>
              <span class="font-mono">₹{{ formatNumber(selectedInvoice.sgstAmount || (selectedInvoice.taxAmount / 2)) }}</span>
            </div>
            <div class="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
              <span>Total Invoice Amount:</span>
              <span class="font-mono text-emerald-700">₹{{ formatNumber(selectedInvoice.totalAmount) }}</span>
            </div>
            <div class="flex justify-between text-slate-500 pt-1">
              <span>Amount Paid:</span>
              <span class="font-mono text-emerald-600 font-semibold">₹{{ formatNumber(selectedInvoice.paidAmount) }}</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>Balance Outstanding:</span>
              <span class="font-mono text-amber-600 font-semibold">₹{{ formatNumber(selectedInvoice.totalAmount - (selectedInvoice.paidAmount || 0)) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal 6: Cancel GST Invoice -->
    <div v-if="isCancelInvoiceModalOpen && selectedInvoiceForCancel" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 class="text-lg font-bold text-slate-900 mb-2">Cancel GST Tax Invoice</h2>
        <p class="text-xs text-slate-500 mb-4">
          Invoice: {{ selectedInvoiceForCancel.invoiceNumber }} • Amount: ₹{{ formatNumber(selectedInvoiceForCancel.totalAmount) }}
        </p>

        <form @submit.prevent="handleCancelInvoiceSubmit" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Reason for Cancellation *</label>
            <textarea
              required
              rows="3"
              v-model="invoiceCancelReason"
              placeholder="e.g. Order cancelled by customer or revised quote requested"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            ></textarea>
          </div>
          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button type="button" @click="isCancelInvoiceModalOpen = false" class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer">Close</button>
            <button type="submit" class="px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-semibold shadow-xs cursor-pointer">Confirm Cancellation</button>
          </div>
        </form>
      </div>
    </div>
  </div>
    <!-- Modal: Record Supplier Payment -->
    <div v-if="isSupplierPaymentModalOpen && selectedPurchaseForPayment" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Disburse Supplier Payment</h2>
            <p class="text-xs text-slate-500">{{ selectedPurchaseForPayment.supplierName }} ({{ selectedPurchaseForPayment.purchaseNumber }})</p>
          </div>
          <button type="button" @click="isSupplierPaymentModalOpen = false" class="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleSupplierPaymentSubmit" class="space-y-4">
          <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div class="flex justify-between text-slate-600">
              <span>PO Total:</span>
              <span class="font-mono font-semibold">₹{{ formatNumber(selectedPurchaseForPayment.totalAmount) }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>Paid So Far:</span>
              <span class="font-mono font-semibold text-emerald-700">₹{{ formatNumber(selectedPurchaseForPayment.paidAmount) }}</span>
            </div>
            <div class="flex justify-between font-bold text-rose-700 pt-1 border-t border-slate-200">
              <span>Outstanding Balance:</span>
              <span class="font-mono">₹{{ formatNumber(selectedPurchaseForPayment.remainingBalance) }}</span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Disbursement Amount (₹) *</label>
            <input
              type="number"
              v-model="supplierPaymentForm.amount"
              step="0.01"
              :max="selectedPurchaseForPayment.remainingBalance"
              required
              class="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                v-model="supplierPaymentForm.paymentMethod"
                class="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="Cheque">Cheque</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                v-model="supplierPaymentForm.paymentDate"
                required
                class="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Bank Reference / UTR Number *</label>
            <input
              type="text"
              v-model="supplierPaymentForm.referenceNumber"
              required
              placeholder="e.g. UTR-HDFC-998877"
              class="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
            <textarea
              v-model="supplierPaymentForm.notes"
              rows="2"
              placeholder="Invoice verification, GRN confirmation notes..."
              class="w-full text-xs border border-slate-300 rounded-lg px-3 py-2"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              @click="isSupplierPaymentModalOpen = false"
              class="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Confirm Disbursement
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Payment Receipt View & Print -->
    <div v-if="isReceiptModalOpen && selectedReceipt" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div class="flex justify-between items-center border-b border-slate-200 pb-3">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">
              SP
            </div>
            <div>
              <h2 class="text-sm font-bold text-slate-900">Official Payment Receipt</h2>
              <span class="text-[11px] font-mono text-slate-500">{{ selectedReceipt.receiptNumber }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="printCurrentInvoice"
              class="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
              title="Print Receipt"
            >
              <Printer class="w-4 h-4" />
            </button>
            <button
              type="button"
              @click="isReceiptModalOpen = false"
              class="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div class="space-y-3 text-xs text-slate-700">
          <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">Received From</span>
              <span class="font-bold text-slate-900">{{ selectedReceipt.customerName }}</span>
              <span class="text-slate-500 block text-[11px]">{{ selectedReceipt.customerPhone }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">Payment Details</span>
              <span class="font-mono font-semibold">{{ selectedReceipt.paymentNumber }}</span>
              <span class="text-slate-500 block text-[11px]">{{ selectedReceipt.paymentDate }}</span>
            </div>
          </div>

          <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex justify-between items-center">
            <div>
              <span class="text-emerald-800 text-[11px] uppercase font-bold block">Amount Received</span>
              <span class="text-[11px] text-emerald-700 font-medium">Via {{ selectedReceipt.paymentMethod }} ({{ selectedReceipt.paymentType }})</span>
            </div>
            <span class="font-mono text-xl font-bold text-emerald-900">₹{{ formatNumber(selectedReceipt.amount) }}</span>
          </div>

          <div class="space-y-1.5 pt-1 text-slate-600">
            <div class="flex justify-between">
              <span>Sales Order Reference:</span>
              <span class="font-mono font-semibold text-slate-800">{{ selectedReceipt.salesOrderNumber }}</span>
            </div>
            <div class="flex justify-between">
              <span>Tax Invoice Reference:</span>
              <span class="font-mono font-semibold text-slate-800">{{ selectedReceipt.invoiceNumber }}</span>
            </div>
            <div class="flex justify-between">
              <span>Bank Reference / UTR:</span>
              <span class="font-mono font-semibold text-slate-800">{{ selectedReceipt.referenceNumber }}</span>
            </div>
            <div class="flex justify-between border-t border-slate-100 pt-1.5">
              <span>Order Contract Value:</span>
              <span class="font-mono">₹{{ formatNumber(selectedReceipt.orderTotalAmount) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Total Paid to Date:</span>
              <span class="font-mono text-emerald-700 font-semibold">₹{{ formatNumber(selectedReceipt.totalPaidToDate) }}</span>
            </div>
            <div class="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
              <span>Remaining Balance:</span>
              <span class="font-mono text-rose-700">₹{{ formatNumber(selectedReceipt.remainingBalance) }}</span>
            </div>
          </div>

          <div class="text-[10px] text-slate-400 pt-2 border-t border-slate-100 text-center">
            Authorized Signature: {{ selectedReceipt.receivedBy }} | SunPower Solutions Financial Accounts
          </div>
        </div>
      </div>
    </div>

</template>
