<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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
} from '../types';
import StatusBadge from '../components/ui/StatusBadge.vue';
import { useAuthStore } from '../stores/auth';
import {
  CircleDollarSign,
  Plus,
  Receipt,
  FileText,
  Clock,
  RotateCcw,
  CheckCircle,
} from 'lucide-vue-next';

const activeTab = ref<'dashboard' | 'profitability' | 'invoices' | 'payouts' | 'subsidies' | 'expenses'>('dashboard');

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
const period = ref('THIS_MONTH');

// Modals
const isExpenseModalOpen = ref(false);
const isPayoutModalOpen = ref(false);
const isSubsidyModalOpen = ref(false);
const selectedSubsidy = ref<SubsidyApplication | null>(null);

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

const subsidyForm = ref({
  status: 'SUBMITTED' as SubsidyStatus,
  nationalPortalRegNumber: '',
  subsidyAmountApproved: '',
  sanctionDate: '',
  amountReceived: '',
  actualReceiptDate: '',
  notes: '',
});

const authStore = useAuthStore();

const formatCurrency = (val: number | undefined) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const fetchData = async () => {
  try {
    loading.value = true;
    const [dashRes, profRes, invRes, expRes, subRes, payRes, payoRes, ordRes, techRes, instRes] = await Promise.all([
      api.get(`/finance/dashboard?period=${period.value}`),
      api.get('/finance/job-profitability'),
      api.get('/finance/invoices'),
      api.get('/finance/expenses'),
      api.get('/finance/subsidies'),
      api.get('/finance/payments'),
      api.get('/finance/technician-payouts'),
      api.get('/orders'),
      api.get('/technicians'),
      api.get('/installations'),
    ]);

    dashboardData.value = dashRes.data;
    profitability.value = profRes.data;
    invoices.value = invRes.data;
    expenses.value = expRes.data;
    subsidies.value = subRes.data;
    payments.value = payRes.data;
    payouts.value = payoRes.data;
    orders.value = ordRes.data;
    technicians.value = techRes.data;
    installations.value = instRes.data;
  } catch (err) {
    console.error('Failed to load financial data', err);
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
      hourlyRate: payoutForm.value.applicableRate ? parseFloat(payoutForm.value.applicableRate) : undefined,
      amount: parseFloat(payoutForm.value.amountPaid),
      paymentMethod: payoutForm.value.paymentMethod,
      referenceNumber: payoutForm.value.referenceNumber,
      notes: payoutForm.value.notes,
    });
    isPayoutModalOpen.value = false;
    fetchData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to record payout');
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
    notes: sub.notes || '',
  };
  isSubsidyModalOpen.value = true;
};

const handleSubsidySubmit = async () => {
  if (!selectedSubsidy.value) return;
  try {
    await api.patch(`/finance/subsidies/${selectedSubsidy.value.id}`, {
      status: subsidyForm.value.status,
      nationalPortalRegNumber: subsidyForm.value.nationalPortalRegNumber,
      subsidyAmountApproved: subsidyForm.value.subsidyAmountApproved ? parseFloat(subsidyForm.value.subsidyAmountApproved) : undefined,
      sanctionDate: subsidyForm.value.sanctionDate || undefined,
      amountReceived: subsidyForm.value.amountReceived ? parseFloat(subsidyForm.value.amountReceived) : undefined,
      actualReceiptDate: subsidyForm.value.actualReceiptDate || undefined,
      notes: subsidyForm.value.notes,
    });
    isSubsidyModalOpen.value = false;
    fetchData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to update subsidy record');
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Finance, P&L & Subsidy Management</h1>
        <p class="text-sm text-slate-500">
          GST Invoicing • Job profitability analysis • PM Surya Ghar subsidy tracking • Field payout ledger
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="isExpenseModalOpen = true"
          class="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Record Expense</span>
        </button>

        <button
          type="button"
          @click="isPayoutModalOpen = true"
          class="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Technician Payout</span>
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-slate-200 text-xs font-semibold space-x-2">
      <button
        type="button"
        @click="activeTab = 'dashboard'"
        :class="['px-4 py-2 border-b-2 cursor-pointer', activeTab === 'dashboard' ? 'border-emerald-600 text-emerald-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800']"
      >
        Executive P&L Summary
      </button>
      <button
        type="button"
        @click="activeTab = 'profitability'"
        :class="['px-4 py-2 border-b-2 cursor-pointer', activeTab === 'profitability' ? 'border-emerald-600 text-emerald-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800']"
      >
        Job Profitability Ledger ({{ profitability.length }})
      </button>
      <button
        type="button"
        @click="activeTab = 'invoices'"
        :class="['px-4 py-2 border-b-2 cursor-pointer', activeTab === 'invoices' ? 'border-emerald-600 text-emerald-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800']"
      >
        GST Tax Invoices ({{ invoices.length }})
      </button>
      <button
        type="button"
        @click="activeTab = 'subsidies'"
        :class="['px-4 py-2 border-b-2 cursor-pointer', activeTab === 'subsidies' ? 'border-emerald-600 text-emerald-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800']"
      >
        PM Surya Ghar Subsidies ({{ subsidies.length }})
      </button>
      <button
        type="button"
        @click="activeTab = 'payouts'"
        :class="['px-4 py-2 border-b-2 cursor-pointer', activeTab === 'payouts' ? 'border-emerald-600 text-emerald-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800']"
      >
        Technician Payouts ({{ payouts.length }})
      </button>
      <button
        type="button"
        @click="activeTab = 'expenses'"
        :class="['px-4 py-2 border-b-2 cursor-pointer', activeTab === 'expenses' ? 'border-emerald-600 text-emerald-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800']"
      >
        Operational Expenses ({{ expenses.length }})
      </button>
    </div>

    <!-- TAB 1: Executive Dashboard -->
    <div v-if="activeTab === 'dashboard'" class="space-y-6">
      <div v-if="dashboardData" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Total Invoiced Revenue</span>
          <div class="text-2xl font-bold text-slate-900 mt-1">{{ formatCurrency(dashboardData.totalInvoicedRevenue) }}</div>
          <span class="text-[11px] text-slate-500">Collected: {{ formatCurrency(dashboardData.totalPaymentsReceived) }}</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Outstanding Receivables</span>
          <div class="text-2xl font-bold text-amber-700 mt-1">{{ formatCurrency(dashboardData.totalOutstandingReceivables) }}</div>
          <span class="text-[11px] text-slate-500">Pending customer balance</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Total Project Net Profit</span>
          <div class="text-2xl font-bold text-emerald-700 mt-1">{{ formatCurrency(dashboardData.totalProjectProfit) }}</div>
          <span class="text-[11px] text-emerald-600 font-semibold">{{ dashboardData.averageProfitMargin?.toFixed(1) }}% Average Margin</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Direct Hardware & Labor Cost</span>
          <div class="text-2xl font-bold text-slate-700 mt-1">
            {{ formatCurrency((dashboardData.totalHardwareCost || 0) + (dashboardData.totalInstallationLaborCost || 0)) }}
          </div>
          <span class="text-[11px] text-slate-500">BOM purchase & technicians</span>
        </div>
      </div>

      <!-- Quick Summary Table of Recent Job Margins -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-200">
          <h2 class="text-sm font-bold text-slate-800">Job Profitability Snapshot</h2>
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
                <td class="py-2.5 px-4 text-right font-medium">{{ formatCurrency(jp.orderAmount) }}</td>
                <td class="py-2.5 px-4 text-right text-slate-500">{{ formatCurrency(jp.hardwareCost) }}</td>
                <td class="py-2.5 px-4 text-right text-slate-500">{{ formatCurrency(jp.installationLaborCost || jp.technicianCost || 0) }}</td>
                <td class="py-2.5 px-4 text-right font-bold text-emerald-700">{{ formatCurrency(jp.netProfit) }}</td>
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
    </div>

    <!-- TAB 2: Job Profitability -->
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
              <td class="py-3 px-4 text-right font-bold text-slate-900">{{ formatCurrency(jp.orderAmount) }}</td>
              <td class="py-3 px-4 text-right text-emerald-700 font-medium">{{ formatCurrency(jp.revenueReceived) }}</td>
              <td class="py-3 px-4 text-right text-slate-500">{{ formatCurrency(jp.hardwareCost) }}</td>
              <td class="py-3 px-4 text-right font-medium text-slate-700">{{ formatCurrency(jp.totalCost) }}</td>
              <td class="py-3 px-4 text-right font-bold text-emerald-700">{{ formatCurrency(jp.netProfit) }}</td>
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

    <!-- TAB 3: GST Tax Invoices -->
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
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="inv in invoices" :key="inv.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ inv.invoiceNumber }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">{{ inv.customer.fullName }}</td>
              <td class="py-3 px-4 whitespace-nowrap">{{ inv.invoiceDate }}</td>
              <td class="py-3 px-4 text-right font-medium">{{ formatCurrency(inv.subtotal) }}</td>
              <td class="py-3 px-4 text-right text-slate-500">{{ formatCurrency(inv.taxAmount) }}</td>
              <td class="py-3 px-4 text-right font-bold text-slate-900">{{ formatCurrency(inv.totalAmount) }}</td>
              <td class="py-3 px-4 text-right text-emerald-700 font-bold">{{ formatCurrency(inv.paidAmount) }}</td>
              <td class="py-3 px-4">
                <StatusBadge :status="inv.status" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 4: PM Surya Ghar Subsidies -->
    <div v-if="activeTab === 'subsidies'" class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">App Ref #</th>
              <th class="py-3 px-4">National Portal Reg #</th>
              <th class="py-3 px-4">Customer</th>
              <th class="py-3 px-4 text-right">Claimed Amount</th>
              <th class="py-3 px-4 text-right">Sanctioned</th>
              <th class="py-3 px-4 text-right">Disbursed (Received)</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="sub in subsidies" :key="sub.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ sub.applicationNumber }}</td>
              <td class="py-3 px-4 font-mono text-purple-700 font-bold">{{ sub.nationalPortalRegNumber || 'Pending Submission' }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">{{ sub.customer.fullName }}</td>
              <td class="py-3 px-4 text-right font-medium">{{ formatCurrency(sub.subsidyAmountClaimed) }}</td>
              <td class="py-3 px-4 text-right font-bold text-slate-800">{{ formatCurrency(sub.subsidyAmountApproved) }}</td>
              <td class="py-3 px-4 text-right font-bold text-emerald-700">{{ formatCurrency(sub.amountReceived) }}</td>
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

    <!-- TAB 5: Technician Payouts -->
    <div v-if="activeTab === 'payouts'" class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">Payout #</th>
              <th class="py-3 px-4">Technician</th>
              <th class="py-3 px-4">Hours</th>
              <th class="py-3 px-4 text-right">Amount Paid</th>
              <th class="py-3 px-4">Payment Method</th>
              <th class="py-3 px-4">Date</th>
              <th class="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="pay in payouts" :key="pay.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ pay.paymentNumber }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">{{ pay.technician.name }}</td>
              <td class="py-3 px-4">{{ pay.hoursCounted || '-' }} hrs</td>
              <td class="py-3 px-4 text-right font-bold text-emerald-700">{{ formatCurrency(pay.amountPaid || pay.amount) }}</td>
              <td class="py-3 px-4">{{ pay.paymentMethod }}</td>
              <td class="py-3 px-4 whitespace-nowrap">{{ pay.paymentDate }}</td>
              <td class="py-3 px-4">
                <StatusBadge :status="pay.status || 'PAID'" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 6: Operational Expenses -->
    <div v-if="activeTab === 'expenses'" class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
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
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="exp in expenses" :key="exp.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ exp.expenseNumber }}</td>
              <td class="py-3 px-4">
                <span class="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700">
                  {{ exp.category }}
                </span>
              </td>
              <td class="py-3 px-4">
                <span class="font-bold text-slate-800 block">{{ exp.title }}</span>
                <span class="text-slate-500 text-[11px]">{{ exp.description }}</span>
              </td>
              <td class="py-3 px-4 text-right font-bold text-rose-700">{{ formatCurrency(exp.amount) }}</td>
              <td class="py-3 px-4 text-slate-700">{{ exp.paidTo }}</td>
              <td class="py-3 px-4 whitespace-nowrap">{{ exp.expenseDate }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Record Expense -->
    <div v-if="isExpenseModalOpen" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 class="text-lg font-bold text-slate-900 mb-4">Record Operational Expense</h2>
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

    <!-- Modal: Technician Payout -->
    <div v-if="isPayoutModalOpen" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 class="text-lg font-bold text-slate-900 mb-4">Disburse Technician Payout</h2>
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
            <button type="submit" class="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs cursor-pointer">Disburse Payout</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Update Subsidy -->
    <div v-if="isSubsidyModalOpen && selectedSubsidy" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 class="text-lg font-bold text-slate-900 mb-1">PM Surya Ghar Subsidy Tracker</h2>
        <p class="text-xs text-slate-500 mb-4">App: {{ selectedSubsidy.applicationNumber }} • Customer: {{ selectedSubsidy.customer.fullName }}</p>

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
          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button type="button" @click="isSubsidyModalOpen = false" class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold shadow-xs cursor-pointer">Save Subsidy Stage</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
