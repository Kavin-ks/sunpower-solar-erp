<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { api } from '../api/client';
import type { SalesOrder, Quotation, PaymentMethod, PaymentType } from '../types';
import StatusBadge from '../components/ui/StatusBadge.vue';
import { useAuthStore } from '../stores/auth';
import { ShoppingCart, Plus, CreditCard, Eye, Layers } from 'lucide-vue-next';

const orders = ref<SalesOrder[]>([]);
const acceptedQuotations = ref<Quotation[]>([]);
const loading = ref(true);
const converting = ref(false);
const showConvertModal = ref(false);
const showPaymentModal = ref(false);
const selectedOrder = ref<SalesOrder | null>(null);

// Workflow Inspection Modal
const detailsOrder = ref<SalesOrder | null>(null);
const activeTab = ref<'overview' | 'bom' | 'payments'>('overview');

const selectedQuoteId = ref('');
const advancePercent = ref('30');

// Payment Form
const paymentAmount = ref('');
const paymentMethod = ref<PaymentMethod>('BANK_TRANSFER');
const paymentType = ref<PaymentType>('ADVANCE');
const referenceNumber = ref('');
const paymentNotes = ref('');

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isAdmin = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_ADMIN');
});
const isSales = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_SALES') && !isAdmin.value;
});
const isFinance = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_FINANCE') && !isAdmin.value;
});
const isWarehouse = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_WAREHOUSE') || isAdmin.value;
});

const formatCurrency = (val: number | undefined) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const statusFilter = ref<'ALL' | 'CONFIRMED' | 'PENDING_PAYMENT' | 'COMPLETED'>('ALL');

const confirmedCount = computed(() => orders.value.filter(o => o.status === 'CONFIRMED').length);
const pendingPaymentCount = computed(() => orders.value.filter(o => o.status === 'PENDING_PAYMENT').length);
const completedCount = computed(() => orders.value.filter(o => o.status === 'DISPATCHED' || o.status === 'DELIVERED' || o.status === 'COMPLETED').length);

const filteredOrders = computed(() => {
  if (statusFilter.value === 'CONFIRMED') return orders.value.filter(o => o.status === 'CONFIRMED');
  if (statusFilter.value === 'PENDING_PAYMENT') return orders.value.filter(o => o.status === 'PENDING_PAYMENT');
  if (statusFilter.value === 'COMPLETED') return orders.value.filter(o => o.status === 'DISPATCHED' || o.status === 'DELIVERED' || o.status === 'COMPLETED');
  return orders.value;
});

const fetchOrdersData = async () => {
  loading.value = true;
  try {
    const orderRes = await api.get('/orders');
    orders.value = orderRes.data || [];
  } catch (err) {
    console.error('Failed to load orders', err);
  }

  try {
    const quoteRes = await api.get('/quotations');
    const existingQuoteIds = new Set(orders.value.map((o: SalesOrder) => o.quotation?.id));
    const unassignedAccepted = (quoteRes.data || []).filter(
      (q: Quotation) => q.status === 'ACCEPTED' && !existingQuoteIds.has(q.id)
    );
    acceptedQuotations.value = unassignedAccepted;
    if (unassignedAccepted.length > 0 && !selectedQuoteId.value) {
      selectedQuoteId.value = unassignedAccepted[0].id.toString();
    }
  } catch (err) {
    console.warn('Could not load quotations in orders view', err);
  } finally {
    loading.value = false;
  }
};

const handleConvertOrder = async () => {
  if (!selectedQuoteId.value) {
    alert('Please select an accepted quotation to convert.');
    return;
  }
  converting.value = true;
  try {
    await api.post('/orders/convert', {
      quotationId: parseInt(selectedQuoteId.value),
      advancePercentage: parseFloat(advancePercent.value),
    });
    showConvertModal.value = false;
    fetchOrdersData();
    alert('Quotation successfully converted to Sales Order! Required BOM quantities hard-reserved in warehouse.');
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to convert quotation to order');
  } finally {
    converting.value = false;
  }
};

const handleRecordPayment = async () => {
  if (!selectedOrder.value) return;
  try {
    await api.post('/payments', {
      salesOrderId: selectedOrder.value.id,
      amount: parseFloat(paymentAmount.value),
      method: paymentMethod.value,
      type: paymentType.value,
      referenceNumber: referenceNumber.value,
      notes: paymentNotes.value,
    });
    showPaymentModal.value = false;
    paymentAmount.value = '';
    referenceNumber.value = '';
    paymentNotes.value = '';
    fetchOrdersData();
    alert('Payment successfully recorded and allocated to order balance.');
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to record payment');
  }
};

const openPaymentModal = (order: SalesOrder) => {
  selectedOrder.value = order;
  paymentAmount.value = order.remainingBalance ? order.remainingBalance.toString() : '';
  showPaymentModal.value = true;
};

const openOrderWorkflows = (order: SalesOrder, tab: 'overview' | 'bom' | 'payments' = 'overview') => {
  detailsOrder.value = order;
  activeTab.value = tab;
};

onMounted(() => {
  fetchOrdersData();
  if (route.query.quotationId) {
    selectedQuoteId.value = String(route.query.quotationId);
    showConvertModal.value = true;
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
          {{ isWarehouse ? 'Confirmed Orders Queue & Warehouse Picking' : 'Sales Orders & Payment Gate' }}
        </h1>
        <p class="text-sm text-slate-500">
          {{ isWarehouse ? 'Advance-cleared customer orders with hardware BOM reservations ready for warehouse picking and vehicle dispatch' : 'Conversion from accepted quotation • Hard inventory reservation • Advance payment gateway for dispatch' }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="isSales"
          type="button"
          @click="showConvertModal = true"
          class="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>Convert Accepted Quotation</span>
        </button>
      </div>
    </div>

    <!-- Status Tabs -->
    <div class="flex items-center gap-2 border-b border-slate-200 pb-2">
      <button
        type="button"
        @click="statusFilter = 'ALL'"
        :class="[
          'px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition',
          statusFilter === 'ALL'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        ]"
      >
        All Orders ({{ orders.length }})
      </button>

      <button
        type="button"
        @click="statusFilter = 'CONFIRMED'"
        :class="[
          'px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5',
          statusFilter === 'CONFIRMED'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        ]"
      >
        <span>Ready for Picking ({{ confirmedCount }})</span>
      </button>

      <button
        type="button"
        @click="statusFilter = 'PENDING_PAYMENT'"
        :class="[
          'px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5',
          statusFilter === 'PENDING_PAYMENT'
            ? 'bg-amber-600 text-white shadow-xs'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        ]"
      >
        <span>Awaiting Advance ({{ pendingPaymentCount }})</span>
      </button>

      <button
        type="button"
        @click="statusFilter = 'COMPLETED'"
        :class="[
          'px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5',
          statusFilter === 'COMPLETED'
            ? 'bg-blue-600 text-white shadow-xs'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        ]"
      >
        <span>Dispatched &amp; Delivered ({{ completedCount }})</span>
      </button>
    </div>

    <!-- Main Orders Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">Order #</th>
              <th class="py-3 px-4">Customer</th>
              <th class="py-3 px-4">System Spec</th>
              <th class="py-3 px-4 text-right">Total Order</th>
              <th class="py-3 px-4 text-right">Advance Req</th>
              <th class="py-3 px-4 text-right">Paid</th>
              <th class="py-3 px-4 text-right">Balance</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredOrders.length === 0">
              <td colspan="9" class="py-8 text-center text-slate-400">
                {{ loading ? "Loading confirmed orders from database..." : "No orders matching the selected queue filter." }}
              </td>
            </tr>
            <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ order.orderNumber }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">
                <div>{{ order.customer.fullName }}</div>
                <div class="text-[11px] text-slate-400 font-normal">{{ order.customer.phone }}</div>
              </td>
              <td class="py-3 px-4">
                <span class="font-bold text-slate-800">{{ order.capacityKw }} kW</span>
                <span class="ml-1 text-[11px] text-slate-500">
                  ({{ order.systemType === 'ON_GRID' ? 'On-Grid' : 'Off-Grid' }})
                </span>
              </td>
              <td class="py-3 px-4 text-right font-bold text-slate-900">{{ formatCurrency(order.totalAmount) }}</td>
              <td class="py-3 px-4 text-right text-amber-700 font-medium">{{ formatCurrency(order.advanceRequired) }}</td>
              <td class="py-3 px-4 text-right font-bold text-emerald-700">{{ formatCurrency(order.totalPaid) }}</td>
              <td class="py-3 px-4 text-right font-medium">
                <span :class="order.remainingBalance > 0 ? 'text-rose-600' : 'text-slate-500'">
                  {{ formatCurrency(order.remainingBalance) }}
                </span>
              </td>
              <td class="py-3 px-4">
                <StatusBadge :status="order.status" />
              </td>
              <td class="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                <button
                  type="button"
                  @click="openOrderWorkflows(order, 'overview')"
                  class="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium cursor-pointer inline-flex items-center space-x-1"
                >
                  <Eye class="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>

                <router-link
                  v-if="isWarehouse && order.status === 'CONFIRMED'"
                  :to="`/dispatch?orderId=${order.id}`"
                  class="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded font-semibold cursor-pointer inline-flex items-center space-x-1"
                >
                  <Truck class="w-3.5 h-3.5" />
                  <span>Pick &amp; Dispatch</span>
                </router-link>

                <button
                  v-if="(isFinance || isSales) && order.remainingBalance > 0"
                  type="button"
                  @click="openPaymentModal(order)"
                  class="px-2.5 py-1 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded font-semibold cursor-pointer inline-flex items-center space-x-1"
                >
                  <CreditCard class="w-3.5 h-3.5" />
                  <span>Receive Payment</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Convert Quotation -->
    <div v-if="showConvertModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h2 class="text-lg font-bold text-slate-900">Convert Accepted Quotation to Sales Order</h2>
          <button type="button" @click="showConvertModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="handleConvertOrder" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Select Accepted Quotation *</label>
            <select
              required
              v-model="selectedQuoteId"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">-- Choose Accepted Proposal --</option>
              <option v-for="q in acceptedQuotations" :key="q.id" :value="q.id">
                {{ q.quotationNumber }} - {{ q.customer.fullName }} ({{ q.capacityKw }} kW - {{ formatCurrency(q.totalAmount) }})
              </option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Advance Payment Percentage Required (%)</label>
            <input
              type="number"
              min="10"
              max="100"
              required
              v-model="advancePercent"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="showConvertModal = false"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="converting || acceptedQuotations.length === 0"
              class="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {{ converting ? 'Reserving Inventory...' : 'Confirm Order & Reserve Stock' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Record Payment -->
    <div v-if="showPaymentModal && selectedOrder" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 class="text-lg font-bold text-slate-900 mb-1">Record Customer Payment</h2>
        <p class="text-xs text-slate-500 mb-4">Order # {{ selectedOrder.orderNumber }} • Remaining: {{ formatCurrency(selectedOrder.remainingBalance) }}</p>

        <form @submit.prevent="handleRecordPayment" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
            <input
              type="number"
              required
              v-model="paymentAmount"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Payment Method *</label>
              <select v-model="paymentMethod" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Credit / Debit Card</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Payment Type *</label>
              <select v-model="paymentType" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="ADVANCE">Advance (Unlocks Dispatch)</option>
                <option value="PROGRESS">Progress / Milestone</option>
                <option value="FULL">Final Settlement</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">UTR / Bank Reference Number *</label>
            <input
              type="text"
              required
              v-model="referenceNumber"
              placeholder="e.g. UTR84739210"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Notes</label>
            <input
              type="text"
              v-model="paymentNotes"
              placeholder="e.g. Received via HDFC Bank netbanking"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="showPaymentModal = false"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs cursor-pointer"
            >
              Post Payment Entry
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Order Workflow Inspector -->
    <div v-if="detailsOrder" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Order Lifecycle Inspector: {{ detailsOrder.orderNumber }}</h2>
            <p class="text-xs text-slate-500">Customer: {{ detailsOrder.customer.fullName }} • {{ detailsOrder.capacityKw }} kW System</p>
          </div>
          <button type="button" @click="detailsOrder = null" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-slate-200 mb-4 text-xs font-semibold">
          <button
            type="button"
            @click="activeTab = 'overview'"
            :class="['px-4 py-2 border-b-2 cursor-pointer', activeTab === 'overview' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500']"
          >
            Financial Overview
          </button>
          <button
            type="button"
            @click="activeTab = 'bom'"
            :class="['px-4 py-2 border-b-2 cursor-pointer', activeTab === 'bom' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500']"
          >
            Reserved BOM Items
          </button>
          <button
            type="button"
            @click="activeTab = 'payments'"
            :class="['px-4 py-2 border-b-2 cursor-pointer', activeTab === 'payments' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500']"
          >
            Payments History ({{ detailsOrder.payments ? detailsOrder.payments.length : 0 }})
          </button>
        </div>

        <div v-if="activeTab === 'overview'" class="space-y-4 text-xs text-slate-700">
          <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Total Contract Value</span>
              <span class="font-bold text-slate-900 text-sm">{{ formatCurrency(detailsOrder.totalAmount) }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Advance Required</span>
              <span class="font-bold text-amber-800 text-sm">{{ formatCurrency(detailsOrder.advanceRequired) }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Total Paid to Date</span>
              <span class="font-bold text-emerald-700 text-sm">{{ formatCurrency(detailsOrder.totalPaid) }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Outstanding Balance</span>
              <span class="font-bold text-rose-600 text-sm">{{ formatCurrency(detailsOrder.remainingBalance) }}</span>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'bom'" class="space-y-2 text-xs">
          <table class="w-full text-left border border-slate-200">
            <thead class="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th class="py-2 px-3">Product Name</th>
                <th class="py-2 px-3 text-center">Reserved Qty</th>
                <th class="py-2 px-3 text-right">Unit Price</th>
                <th class="py-2 px-3 text-right">Total Price</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in detailsOrder.items" :key="item.id">
                <td class="py-2 px-3 font-medium text-slate-800">{{ item.product.name }}</td>
                <td class="py-2 px-3 text-center font-bold text-emerald-700">{{ item.quantity }} {{ item.product.unit }}</td>
                <td class="py-2 px-3 text-right">{{ formatCurrency(item.unitPrice) }}</td>
                <td class="py-2 px-3 text-right font-semibold">{{ formatCurrency(item.totalPrice) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="activeTab === 'payments'" class="space-y-2 text-xs">
          <div v-if="!detailsOrder.payments || detailsOrder.payments.length === 0" class="py-6 text-center text-slate-400">
            No payments recorded yet for this order.
          </div>
          <div v-else class="space-y-2">
            <div v-for="p in detailsOrder.payments" :key="p.id" class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <span class="font-bold text-slate-900 block">{{ p.paymentNumber }}</span>
                <span class="text-slate-500 text-[11px]">{{ p.method }} • Ref: {{ p.referenceNumber }}</span>
              </div>
              <div class="text-right">
                <span class="font-bold text-emerald-700 text-sm block">{{ formatCurrency(p.amount) }}</span>
                <span class="text-[10px] text-slate-400">{{ p.paymentDate }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-3 border-t border-slate-100 mt-4">
          <button
            type="button"
            @click="detailsOrder = null"
            class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
