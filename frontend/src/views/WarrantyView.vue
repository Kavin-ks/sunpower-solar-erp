<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../api/client';
import type { Warranty } from '../types';
import StatusBadge from '../components/ui/StatusBadge.vue';
import { Barcode, CheckCircle2, Award, Printer } from 'lucide-vue-next';

const warranties = ref<Warranty[]>([]);
const searchSerial = ref('');
const loading = ref(true);
const selectedWarranty = ref<Warranty | null>(null);
const verificationResult = ref<{
  type: 'warranty' | 'serial' | 'not_found';
  data?: any;
  message?: string;
} | null>(null);

const fetchWarranties = async () => {
  loading.value = true;
  verificationResult.value = null;
  try {
    const res = await api.get('/warranties');
    warranties.value = res.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleSerialLookup = async () => {
  const code = searchSerial.value.trim();
  if (!code) {
    fetchWarranties();
    return;
  }
  loading.value = true;
  verificationResult.value = null;
  try {
    const res = await api.get(`/warranties/serial/${encodeURIComponent(code)}`);
    warranties.value = [res.data];
    verificationResult.value = {
      type: 'warranty',
      data: res.data,
      message: `Verified active warranty for serial: ${code}`,
    };
  } catch (err) {
    try {
      const sRes = await api.get(`/serial-numbers/lookup/${encodeURIComponent(code)}`);
      verificationResult.value = {
        type: 'serial',
        data: sRes.data,
        message: `Serial registered in warehouse inventory. Current status: ${sRes.data.status}`,
      };
    } catch (err2) {
      verificationResult.value = {
        type: 'not_found',
        message: `No active warranty or warehouse serial record found for barcode '${code}'.`,
      };
    }
  } finally {
    loading.value = false;
  }
};

const clearSearch = () => {
  searchSerial.value = '';
  verificationResult.value = null;
  fetchWarranties();
};

const isWarrantyValid = (w: Warranty) => {
  const now = new Date();
  const end = new Date(w.warrantyEndDate);
  return w.status === 'ACTIVE' && end >= now;
};

const printCertificate = () => {
  window.print();
};

onMounted(() => {
  fetchWarranties();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Automatic Warranty Management</h1>
        <p class="text-sm text-slate-500">
          Serialized component tracking, 20-year panel & 2-year inverter/battery duration management
        </p>
      </div>

      <!-- Quick Serial Lookup -->
      <form @submit.prevent="handleSerialLookup" class="flex items-center space-x-2">
        <div class="relative">
          <Barcode class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            v-model="searchSerial"
            placeholder="Scan / Enter Serial..."
            class="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
        >
          Verify
        </button>
        <button
          v-if="searchSerial || verificationResult"
          type="button"
          @click="clearSearch"
          class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
        >
          Reset
        </button>
      </form>
    </div>

    <!-- Serial Verification Result Card -->
    <div v-if="verificationResult" class="rounded-xl border p-4 text-xs shadow-xs transition" :class="{
      'bg-emerald-50 border-emerald-200 text-emerald-900': verificationResult.type === 'warranty',
      'bg-blue-50 border-blue-200 text-blue-900': verificationResult.type === 'serial',
      'bg-rose-50 border-rose-200 text-rose-900': verificationResult.type === 'not_found'
    }">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <CheckCircle2 v-if="verificationResult.type === 'warranty'" class="w-5 h-5 text-emerald-600" />
          <Barcode v-else-if="verificationResult.type === 'serial'" class="w-5 h-5 text-blue-600" />
          <span class="font-bold text-sm">{{ verificationResult.message }}</span>
        </div>
        <button type="button" @click="verificationResult = null" class="text-slate-400 hover:text-slate-600 cursor-pointer font-bold">✕</button>
      </div>

      <div v-if="verificationResult.type === 'warranty' && verificationResult.data" class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-emerald-200 text-emerald-800">
        <div><span class="text-slate-500 font-semibold block text-[10px] uppercase">Product:</span> {{ verificationResult.data.product?.name }}</div>
        <div><span class="text-slate-500 font-semibold block text-[10px] uppercase">Customer:</span> {{ verificationResult.data.customer?.fullName }}</div>
        <div><span class="text-slate-500 font-semibold block text-[10px] uppercase">Sales Order:</span> {{ verificationResult.data.salesOrder?.orderNumber }}</div>
        <div><span class="text-slate-500 font-semibold block text-[10px] uppercase">Valid Until:</span> {{ verificationResult.data.warrantyEndDate }}</div>
      </div>

      <div v-if="verificationResult.type === 'serial' && verificationResult.data" class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-blue-200 text-blue-800">
        <div><span class="text-slate-500 font-semibold block text-[10px] uppercase">Product:</span> {{ verificationResult.data.product?.name || verificationResult.data.name }}</div>
        <div><span class="text-slate-500 font-semibold block text-[10px] uppercase">Serial Code:</span> {{ verificationResult.data.serialCode }}</div>
        <div><span class="text-slate-500 font-semibold block text-[10px] uppercase">Current Status:</span> {{ verificationResult.data.status }}</div>
        <div><span class="text-slate-500 font-semibold block text-[10px] uppercase">Location / Bay:</span> {{ verificationResult.data.locationBay || 'Warehouse Floor' }}</div>
      </div>
    </div>

    <!-- Warranties Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">Warranty ID</th>
              <th class="py-3 px-4">Product</th>
              <th class="py-3 px-4">Serial Number</th>
              <th class="py-3 px-4">Customer</th>
              <th class="py-3 px-4">Order Ref</th>
              <th class="py-3 px-4">Duration</th>
              <th class="py-3 px-4">Warranty Period</th>
              <th class="py-3 px-4">Coverage Status</th>
              <th class="py-3 px-4 text-right">Certificate</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="warranties.length === 0">
              <td colspan="9" class="py-8 text-center text-slate-400">
                No active warranty records found. Warranties activate automatically when dispatches are marked DELIVERED.
              </td>
            </tr>
            <tr v-for="w in warranties" :key="w.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ w.warrantyNumber }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">
                {{ w.product.name }}
                <span class="block text-[10px] text-slate-400 font-normal">
                  {{ w.product.category?.name }}
                </span>
              </td>
              <td class="py-3 px-4">
                <span v-if="w.serialNumber" class="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {{ w.serialNumber.serialCode }}
                </span>
                <span v-else class="text-slate-400 italic">Bulk/Panels Group</span>
              </td>
              <td class="py-3 px-4 font-medium text-slate-800">{{ w.customer.fullName }}</td>
              <td class="py-3 px-4 font-mono text-slate-600">{{ w.salesOrder.orderNumber }}</td>
              <td class="py-3 px-4">
                <span class="font-bold text-slate-800">{{ w.durationMonths / 12 }} Years</span>
                <span class="text-slate-400 text-[10px]"> ({{ w.durationMonths }}m)</span>
              </td>
              <td class="py-3 px-4 whitespace-nowrap">
                <div>From: {{ w.warrantyStartDate }}</div>
                <div class="text-[11px] text-slate-400 font-medium">To: {{ w.warrantyEndDate }}</div>
              </td>
              <td class="py-3 px-4">
                <span v-if="isWarrantyValid(w)" class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 class="w-3.5 h-3.5" />
                  <span>ACTIVE</span>
                </span>
                <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  EXPIRED
                </span>
              </td>
              <td class="py-3 px-4 text-right">
                <button
                  type="button"
                  @click="selectedWarranty = w"
                  class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs cursor-pointer"
                >
                  View Certificate
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Certificate Modal -->
    <div v-if="selectedWarranty" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl border-4 border-emerald-600 relative">
        <button
          type="button"
          @click="selectedWarranty = null"
          class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg no-print cursor-pointer"
        >
          ✕
        </button>

        <div class="text-center pb-4 border-b border-slate-200 mb-6">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mb-2">
            <Award class="w-8 h-8" />
          </div>
          <h2 class="text-xl font-extrabold text-slate-900 tracking-tight">SUNPOWER SOLUTIONS</h2>
          <p class="text-xs uppercase tracking-widest text-emerald-700 font-bold mt-0.5">
            Official Warranty Certificate
          </p>
        </div>

        <div class="space-y-4 text-xs text-slate-700">
          <div class="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <div>
              <span class="text-[10px] uppercase font-bold text-emerald-800">Certificate Number</span>
              <div class="font-mono font-bold text-emerald-900 text-sm">{{ selectedWarranty.warrantyNumber }}</div>
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase font-bold text-emerald-800">Coverage Duration</span>
              <div class="font-bold text-emerald-900 text-sm">{{ selectedWarranty.durationMonths / 12 }} Years</div>
            </div>
          </div>

          <div class="space-y-2 border-b border-slate-100 pb-4">
            <div class="flex justify-between">
              <span class="text-slate-500">Registered Customer:</span>
              <span class="font-bold text-slate-900">{{ selectedWarranty.customer.fullName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Protected Equipment:</span>
              <span class="font-bold text-slate-900">{{ selectedWarranty.product.name }}</span>
            </div>
            <div v-if="selectedWarranty.serialNumber" class="flex justify-between">
              <span class="text-slate-500">Unique Serial Number:</span>
              <span class="font-mono font-bold text-purple-700">{{ selectedWarranty.serialNumber.serialCode }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Site Commissioning Date:</span>
              <span class="font-semibold text-slate-800">{{ selectedWarranty.deliveryDate }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Warranty Valid Until:</span>
              <span class="font-bold text-emerald-800">{{ selectedWarranty.warrantyEndDate }}</span>
            </div>
          </div>

          <p class="text-[11px] text-slate-500 italic text-center">
            This certificate guarantees manufacturer free replacement and repair service during the active coverage period.
          </p>

          <div class="flex justify-end space-x-2 pt-2 no-print">
            <button
              type="button"
              @click="printCertificate"
              class="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer class="w-3.5 h-3.5" />
              <span>Print Certificate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
