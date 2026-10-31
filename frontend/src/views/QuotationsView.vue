<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { api } from '../api/client';
import type { Quotation, SiteSurvey, SolarPackage, QuotationStatus } from '../types';
import StatusBadge from '../components/ui/StatusBadge.vue';
import { useAuthStore } from '../stores/auth';
import {
  Plus,
  CheckCircle2,
  Printer,
  Zap,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Percent,
  Eye,
  X,
  Send,
} from 'lucide-vue-next';

const quotations = ref<Quotation[]>([]);
const approvedSurveys = ref<SiteSurvey[]>([]);
const packages = ref<SolarPackage[]>([]);
const loading = ref(true);
const showCreateModal = ref(false);
const previewQuotation = ref<Quotation | null>(null);
const statusFilter = ref<'ALL' | 'ACCEPTED' | 'SENT' | 'DRAFT'>('ALL');

const selectedSurveyId = ref('');
const selectedPackageId = ref('');
const installationFee = ref('15000');
const notes = ref('');

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const roles = computed(() => authStore.user?.roles || []);
const isAdmin = computed(() => roles.value.includes('ROLE_ADMIN'));
const isSales = computed(() => roles.value.includes('ROLE_SALES'));
const isFinance = computed(() => roles.value.includes('ROLE_FINANCE'));
const canCreate = computed(() => isSales.value || isFinance.value || isAdmin.value);
const canApprove = computed(() => isSales.value || isFinance.value || isAdmin.value);

const formatCurrency = (val: number | undefined | null) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const formatNumber = (val: number | undefined | null) => {
  return Number(val || 0).toLocaleString('en-IN');
};

const filteredQuotations = computed(() => {
  if (statusFilter.value === 'ALL') return quotations.value;
  return quotations.value.filter((q) => q.status === statusFilter.value);
});

// KPI Computations
const totalPipelineValue = computed(() => {
  return quotations.value.reduce((sum, q) => sum + (q.totalAmount || 0), 0);
});

const acceptedQuotations = computed(() => {
  return quotations.value.filter((q) => q.status === 'ACCEPTED');
});

const acceptedValue = computed(() => {
  return acceptedQuotations.value.reduce((sum, q) => sum + (q.totalAmount || 0), 0);
});

const sentCount = computed(() => {
  return quotations.value.filter((q) => q.status === 'SENT').length;
});

const draftCount = computed(() => {
  return quotations.value.filter((q) => q.status === 'DRAFT').length;
});

const averageKw = computed(() => {
  if (quotations.value.length === 0) return 0;
  const sumKw = quotations.value.reduce((s, q) => s + (q.capacityKw || 0), 0);
  return (sumKw / quotations.value.length).toFixed(1);
});

const fetchData = async () => {
  loading.value = true;
  try {
    const quotesRes = await api.get('/quotations');
    quotations.value = quotesRes.data || [];
  } catch (err: any) {
    console.error('Failed to load quotations', err);
  }

  try {
    const pkgRes = await api.get('/packages');
    packages.value = pkgRes.data || [];
    if (packages.value.length > 0 && !selectedPackageId.value) {
      selectedPackageId.value = packages.value[0].id.toString();
    }
  } catch (err) {
    console.warn('Could not load package catalog', err);
  }

  try {
    const survRes = await api.get('/surveys?status=APPROVED');
    approvedSurveys.value = survRes.data || [];
  } catch (err) {
    console.warn('Could not load approved surveys', err);
  } finally {
    loading.value = false;
  }
};

const handleCreateQuotation = async () => {
  const survey = approvedSurveys.value.find((s) => s.id === parseInt(selectedSurveyId.value));
  if (!survey) {
    alert('Please select an approved site survey.');
    return;
  }

  try {
    await api.post('/quotations', {
      customerId: survey.customer?.id,
      siteSurveyId: survey.id,
      solarPackageId: parseInt(selectedPackageId.value),
      installationFee: parseFloat(installationFee.value) || 0,
      taxRatePercent: 5.0,
      notes: notes.value,
    });
    showCreateModal.value = false;
    fetchData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to create quotation');
  }
};

const handleStatusUpdate = async (id: number, status: QuotationStatus) => {
  try {
    await api.patch(`/quotations/${id}/status`, { status });
    fetchData();
    if (previewQuotation.value && previewQuotation.value.id === id) {
      previewQuotation.value.status = status;
    }
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to update quotation');
  }
};

const convertToOrder = (quote: Quotation) => {
  router.push({
    path: '/orders',
    query: {
      quotationId: String(quote.id),
      convertQuoteId: String(quote.id),
    },
  });
};

const printQuotation = () => {
  window.print();
};

onMounted(() => {
  fetchData();
  if (route.query.siteSurveyId) {
    selectedSurveyId.value = String(route.query.siteSurveyId);
    showCreateModal.value = true;
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
          {{ isFinance ? 'Commercial Quotations & Financial Proposals' : 'Quotations & BOM Estimations' }}
        </h1>
        <p class="text-sm text-slate-500">
          {{ isFinance ? 'Verify contract commercials, BOM pricing, GST applicability, and advance deposit requirements' : 'Automated Bill of Materials (BOM), system pricing, and survey-gated customer proposals' }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="canCreate"
          type="button"
          @click="showCreateModal = true"
          class="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>Generate New Quotation</span>
        </button>
      </div>
    </div>

    <!-- Commercial Metrics KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-[11px] uppercase font-bold text-slate-400">Total Pipeline Value</span>
          <DollarSign class="w-4 h-4 text-slate-400" />
        </div>
        <div class="text-xl font-bold text-slate-900 font-mono mt-1">
          {{ formatCurrency(totalPipelineValue) }}
        </div>
        <span class="text-xs text-slate-500">{{ quotations.length }} total proposals issued</span>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-[11px] uppercase font-bold text-slate-400">Accepted Contract Value</span>
          <CheckCircle2 class="w-4 h-4 text-emerald-600" />
        </div>
        <div class="text-xl font-bold text-emerald-700 font-mono mt-1">
          {{ formatCurrency(acceptedValue) }}
        </div>
        <span class="text-xs text-emerald-700 font-semibold">{{ acceptedQuotations.length }} confirmed proposals</span>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-[11px] uppercase font-bold text-slate-400">Under Client Review</span>
          <Send class="w-4 h-4 text-blue-600" />
        </div>
        <div class="text-xl font-bold text-blue-700 font-mono mt-1">
          {{ sentCount }} Active
        </div>
        <span class="text-xs text-slate-500">{{ draftCount }} drafts awaiting review</span>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-[11px] uppercase font-bold text-slate-400">Average System Size</span>
          <TrendingUp class="w-4 h-4 text-amber-500" />
        </div>
        <div class="text-xl font-bold text-slate-900 font-mono mt-1">
          {{ averageKw }} kW
        </div>
        <span class="text-xs text-slate-500">Commercial & residential average</span>
      </div>
    </div>

    <!-- Status Filter Tabs -->
    <div class="flex items-center gap-2 border-b border-slate-200 pb-2">
      <button
        type="button"
        @click="statusFilter = 'ALL'"
        :class="[
          'px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition',
          statusFilter === 'ALL'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        ]"
      >
        All Quotations ({{ quotations.length }})
      </button>

      <button
        type="button"
        @click="statusFilter = 'ACCEPTED'"
        :class="[
          'px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition',
          statusFilter === 'ACCEPTED'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        ]"
      >
        Approved &amp; Accepted ({{ acceptedQuotations.length }})
      </button>

      <button
        type="button"
        @click="statusFilter = 'SENT'"
        :class="[
          'px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition',
          statusFilter === 'SENT'
            ? 'bg-blue-600 text-white shadow-xs'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        ]"
      >
        Sent to Client ({{ sentCount }})
      </button>

      <button
        type="button"
        @click="statusFilter = 'DRAFT'"
        :class="[
          'px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition',
          statusFilter === 'DRAFT'
            ? 'bg-amber-600 text-white shadow-xs'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        ]"
      >
        Drafts ({{ draftCount }})
      </button>
    </div>

    <!-- Main Quotations Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">Quote #</th>
              <th class="py-3 px-4">Customer</th>
              <th class="py-3 px-4">Capacity &amp; Grid</th>
              <th class="py-3 px-4">Date</th>
              <th class="py-3 px-4 text-right">Subtotal</th>
              <th class="py-3 px-4 text-right">GST Tax</th>
              <th class="py-3 px-4 text-right">Contract Total</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredQuotations.length === 0">
              <td colspan="9" class="py-8 text-center text-slate-400">
                {{ loading ? 'Loading quotations from database...' : 'No quotations matching the selected filter.' }}
              </td>
            </tr>
            <tr v-for="quote in filteredQuotations" :key="quote.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ quote.quotationNumber }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">
                <div>{{ quote.customer?.fullName || 'Customer' }}</div>
                <div class="text-[11px] text-slate-400 font-normal">{{ quote.customer?.phone || '-' }}</div>
              </td>
              <td class="py-3 px-4">
                <span class="font-semibold text-slate-800">{{ quote.capacityKw || 0 }} kW</span>
                <span class="ml-1 text-[11px] text-slate-500">
                  ({{ quote.systemType === 'ON_GRID' ? 'On-Grid' : 'Off-Grid' }})
                </span>
              </td>
              <td class="py-3 px-4 whitespace-nowrap">{{ quote.quotationDate }}</td>
              <td class="py-3 px-4 text-right font-medium">₹{{ formatNumber(quote.subtotal) }}</td>
              <td class="py-3 px-4 text-right text-slate-500">₹{{ formatNumber(quote.taxAmount) }}</td>
              <td class="py-3 px-4 text-right font-bold text-slate-900">₹{{ formatNumber(quote.totalAmount) }}</td>
              <td class="py-3 px-4">
                <StatusBadge :status="quote.status" />
              </td>
              <td class="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                <button
                  type="button"
                  @click="previewQuotation = quote"
                  class="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium cursor-pointer inline-flex items-center gap-1"
                >
                  <Eye class="w-3.5 h-3.5" />
                  <span>Preview / Print</span>
                </button>

                <!-- Workflow action buttons -->
                <button
                  v-if="quote.status === 'DRAFT' && canCreate"
                  type="button"
                  @click="handleStatusUpdate(quote.id, 'SENT')"
                  class="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded font-semibold cursor-pointer"
                >
                  Send to Client
                </button>

                <button
                  v-if="quote.status === 'SENT' && canApprove"
                  type="button"
                  @click="handleStatusUpdate(quote.id, 'ACCEPTED')"
                  class="px-2.5 py-1 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded font-semibold cursor-pointer inline-flex items-center space-x-1"
                >
                  <CheckCircle2 class="w-3.5 h-3.5" />
                  <span>Accept &amp; Confirm</span>
                </button>

                <button
                  v-if="quote.status === 'ACCEPTED'"
                  type="button"
                  @click="convertToOrder(quote)"
                  class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold shadow-xs cursor-pointer inline-flex items-center space-x-1"
                >
                  <Zap class="w-3 h-3" />
                  <span>Convert to Order</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Generate Quotation -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h2 class="text-lg font-bold text-slate-900">Generate BOM-Calculated Quotation</h2>
          <button type="button" @click="showCreateModal = false" class="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleCreateQuotation" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">
              Select Approved Site Survey *
            </label>
            <select
              required
              v-model="selectedSurveyId"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">-- Choose Approved Survey --</option>
              <option v-for="s in approvedSurveys" :key="s.id" :value="s.id">
                {{ s.surveyNumber }} - {{ s.customer?.fullName || 'Customer' }} ({{ s.availableRoofAreaSqFt || 0 }} sq.ft {{ s.roofDirection || '' }})
              </option>
            </select>
            <p v-if="approvedSurveys.length === 0" class="text-[11px] text-amber-600 mt-1 flex items-center space-x-1">
              <AlertCircle class="w-3.5 h-3.5" />
              <span>No approved surveys found. Go to Site Surveys and approve one first.</span>
            </p>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Select Solar Package Template *</label>
            <select
              required
              v-model="selectedPackageId"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option v-for="pkg in packages" :key="pkg.id" :value="pkg.id">
                {{ pkg.name }} ({{ pkg.capacityKw }} kW {{ pkg.systemType }}) - Base: {{ formatCurrency(pkg.basePrice) }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Installation &amp; Commissioning Fee (₹)</label>
              <input
                type="number"
                v-model="installationFee"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Tax Scheme</label>
              <input
                type="text"
                disabled
                value="5% GST (Solar Hardware Concessional Rate)"
                class="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Proposal Terms / Custom Notes</label>
            <textarea
              rows="2"
              v-model="notes"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="Includes 20-year panel warranty, 2-year inverter warranty, and net-metering liaison..."
            ></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="showCreateModal = false"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="approvedSurveys.length === 0"
              class="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              Generate BOM Quotation
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Printable Quotation Preview Modal -->
    <div v-if="previewQuotation" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 no-print">
          <div class="flex items-center space-x-2">
            <button
              type="button"
              @click="printQuotation"
              class="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
            >
              <Printer class="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
          <button type="button" @click="previewQuotation = null" class="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Formal Quotation Document -->
        <div class="space-y-6 text-xs text-slate-700">
          <div class="flex justify-between items-start pb-4 border-b border-slate-200">
            <div>
              <h2 class="text-xl font-bold text-slate-900">SUNPOWER SOLUTIONS</h2>
              <p class="text-slate-500">Rooftop Solar EPC &amp; Installation Specialists</p>
              <p class="text-slate-500">GSTIN: 33AAACS1234F1Z5 | contact@sunpower.com</p>
            </div>
            <div class="text-right">
              <div class="text-base font-bold text-emerald-800">{{ previewQuotation.quotationNumber }}</div>
              <p class="text-slate-500">Date: {{ previewQuotation.quotationDate }}</p>
              <p class="text-slate-500">Valid Until: {{ previewQuotation.validityDate }}</p>
              <div class="mt-1">
                <StatusBadge :status="previewQuotation.status" />
              </div>
            </div>
          </div>

          <!-- Customer & Site Details -->
          <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
            <div>
              <h3 class="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">Client Details</h3>
              <p class="font-semibold text-slate-800">{{ previewQuotation.customer?.fullName || 'Customer' }}</p>
              <p>{{ previewQuotation.customer?.phone || '-' }}</p>
              <p>{{ previewQuotation.customer?.email || '-' }}</p>
              <p>{{ previewQuotation.customer?.address || '-' }}</p>
            </div>
            <div>
              <h3 class="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">Approved Site Survey</h3>
              <p>Ref: {{ previewQuotation.siteSurvey?.surveyNumber || 'N/A' }}</p>
              <p>System Capacity: <strong>{{ previewQuotation.capacityKw || 0 }} kW</strong></p>
              <p>Grid Type: <strong>{{ previewQuotation.systemType === 'ON_GRID' ? 'On-Grid Net Meter' : 'Off-Grid Battery' }}</strong></p>
              <p>Orientation: {{ previewQuotation.siteSurvey?.roofDirection || 'South' }} ({{ previewQuotation.siteSurvey?.availableRoofAreaSqFt || 0 }} sq.ft)</p>
            </div>
          </div>

          <!-- BOM Line Items -->
          <div>
            <h3 class="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2">
              Bill of Materials (BOM) &amp; Equipment Specifications
            </h3>
            <table class="w-full text-left border border-slate-200">
              <thead class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th class="py-2 px-3">Item / Description</th>
                  <th class="py-2 px-3 text-center">Qty</th>
                  <th class="py-2 px-3 text-right">Unit Price</th>
                  <th class="py-2 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr v-for="item in previewQuotation.items || []" :key="item.id">
                  <td class="py-2 px-3 font-medium text-slate-800">
                    {{ item.product?.name || 'Component' }}
                    <span class="block text-[10px] text-slate-400 font-normal">{{ item.product?.productCode }}</span>
                  </td>
                  <td class="py-2 px-3 text-center">{{ item.quantity }} {{ item.product?.unit || 'units' }}</td>
                  <td class="py-2 px-3 text-right">{{ formatCurrency(item.unitPrice) }}</td>
                  <td class="py-2 px-3 text-right font-semibold">{{ formatCurrency(item.totalPrice) }}</td>
                </tr>
                <tr>
                  <td colspan="3" class="py-2 px-3 font-medium text-slate-700">
                    Professional Fitting, Cabling, Earthing &amp; Commissioning
                  </td>
                  <td class="py-2 px-3 text-right font-semibold">{{ formatCurrency(previewQuotation.installationFee) }}</td>
                </tr>
              </tbody>
              <tfoot class="bg-slate-50 font-bold border-t border-slate-200">
                <tr>
                  <td colspan="3" class="py-2 px-3 text-right">Subtotal:</td>
                  <td class="py-2 px-3 text-right">{{ formatCurrency((previewQuotation.subtotal || 0) + (previewQuotation.installationFee || 0)) }}</td>
                </tr>
                <tr>
                  <td colspan="3" class="py-1 px-3 text-right text-slate-600 font-normal">CGST (2.5% Central GST):</td>
                  <td class="py-1 px-3 text-right text-slate-700 font-medium">{{ formatCurrency((previewQuotation.taxAmount || 0) / 2) }}</td>
                </tr>
                <tr>
                  <td colspan="3" class="py-1 px-3 text-right text-slate-600 font-normal">SGST (2.5% State GST):</td>
                  <td class="py-1 px-3 text-right text-slate-700 font-medium">{{ formatCurrency((previewQuotation.taxAmount || 0) / 2) }}</td>
                </tr>
                <tr class="text-xs text-slate-700">
                  <td colspan="3" class="py-1 px-3 text-right font-semibold">Total GST (5% Concessional):</td>
                  <td class="py-1 px-3 text-right font-semibold">{{ formatCurrency(previewQuotation.taxAmount) }}</td>
                </tr>
                <tr class="text-sm text-emerald-800 bg-emerald-50">
                  <td colspan="3" class="py-2.5 px-3 text-right">Total Net Payable:</td>
                  <td class="py-2.5 px-3 text-right">{{ formatCurrency(previewQuotation.totalAmount) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Warranty and Terms -->
          <div class="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 space-y-1">
            <p><strong>Standard Warranties:</strong> Solar Panels: 20 Years | Inverter: 2 Years | Battery Bank: 2 Years.</p>
            <p><strong>Advance Payment Requirement:</strong> 30% on quotation acceptance prior to inventory allocation and dispatch.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
