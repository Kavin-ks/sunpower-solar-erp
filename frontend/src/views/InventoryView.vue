<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '../api/client';
import type { InventoryStock, StockMovement } from '../types';
import { useAuthStore } from '../stores/auth';
import { Boxes, PackageCheck, Layers, History } from 'lucide-vue-next';

const stocks = ref<InventoryStock[]>([]);
const movements = ref<StockMovement[]>([]);
const loading = ref(true);
const showAdjustModal = ref(false);
const selectedStock = ref<InventoryStock | null>(null);
const adjustDelta = ref('');
const adjustReason = ref('');

const authStore = useAuthStore();
const isAdmin = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_ADMIN') || roles.includes('ROLE_DIRECTOR');
});
const isWarehouse = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_WAREHOUSE') && !isAdmin.value;
});

const totalStockValue = computed(() => {
  return stocks.value.reduce(
    (acc, s) => acc + s.product.purchasePrice * (s.availableQuantity + s.reservedQuantity),
    0
  );
});

const totalAvailableUnits = computed(() => {
  return stocks.value.reduce((acc, s) => acc + s.availableQuantity, 0);
});

const totalReservedUnits = computed(() => {
  return stocks.value.reduce((acc, s) => acc + s.reservedQuantity, 0);
});

const formatCurrency = (val: number | undefined) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const fetchInventory = async () => {
  loading.value = true;
  try {
    const [stockRes, movRes] = await Promise.all([
      api.get('/inventory'),
      api.get('/inventory/movements').catch(() => ({ data: [] })),
    ]);
    stocks.value = stockRes.data;
    movements.value = movRes.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleAdjustSubmit = async () => {
  if (!selectedStock.value) return;
  try {
    await api.post('/inventory/adjust', {
      productId: selectedStock.value.product.id,
      quantityDelta: parseInt(adjustDelta.value),
      reason: adjustReason.value,
    });
    showAdjustModal.value = false;
    adjustDelta.value = '';
    adjustReason.value = '';
    fetchInventory();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to adjust stock');
  }
};

onMounted(() => {
  fetchInventory();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Warehouse Inventory Management</h1>
        <p class="text-sm text-slate-500">
          Real-time stock balance, order reservations, negative stock protection, and movement audit
        </p>
      </div>
    </div>

    <!-- Stock Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Stock Value</span>
          <div class="text-2xl font-bold text-slate-900 mt-1">
            {{ formatCurrency(totalStockValue) }}
          </div>
          <p class="text-xs text-slate-400 mt-0.5">Evaluated at purchase cost</p>
        </div>
        <div class="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <Boxes class="w-6 h-6" />
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Available Units</span>
          <div class="text-2xl font-bold text-emerald-700 mt-1">
            {{ totalAvailableUnits }}
          </div>
          <p class="text-xs text-slate-400 mt-0.5">Ready for new customer orders</p>
        </div>
        <div class="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <PackageCheck class="w-6 h-6" />
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Reserved for Orders</span>
          <div class="text-2xl font-bold text-amber-700 mt-1">
            {{ totalReservedUnits }}
          </div>
          <p class="text-xs text-slate-400 mt-0.5">Committed in active sales orders</p>
        </div>
        <div class="p-3 bg-amber-50 text-amber-600 rounded-xl">
          <Layers class="w-6 h-6" />
        </div>
      </div>
    </div>

    <!-- Main Inventory Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="p-4 border-b border-slate-200 flex items-center justify-between">
        <h2 class="text-sm font-bold text-slate-800">Product Catalogue & Warehouse Stock</h2>
        <span class="text-xs text-slate-500 font-medium">{{ stocks.length }} catalogued items</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">Item Code</th>
              <th class="py-3 px-4">Product Name</th>
              <th class="py-3 px-4">Category</th>
              <th class="py-3 px-4 text-center">Serialized?</th>
              <th class="py-3 px-4 text-right">Available</th>
              <th class="py-3 px-4 text-right">Reserved</th>
              <th class="py-3 px-4 text-right">Total Stock</th>
              <th class="py-3 px-4">Warehouse Bay</th>
              <th class="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="stock in stocks" :key="stock.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-medium text-slate-900">{{ stock.product.productCode }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">{{ stock.product.name }}</td>
              <td class="py-3 px-4">
                <span class="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-600">
                  {{ stock.product.category?.name || 'General' }}
                </span>
              </td>
              <td class="py-3 px-4 text-center">
                <span v-if="stock.product.serialized" class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  YES (Barcode)
                </span>
                <span v-else class="text-slate-400">Bulk</span>
              </td>
              <td class="py-3 px-4 text-right font-bold">
                <span :class="stock.availableQuantity <= stock.product.minimumStockLevel ? 'text-rose-600' : 'text-emerald-700'">
                  {{ stock.availableQuantity }} {{ stock.product.unit }}
                </span>
                <span v-if="stock.availableQuantity <= stock.product.minimumStockLevel" class="block text-[10px] font-semibold text-rose-500">
                  Low Stock Alert
                </span>
              </td>
              <td class="py-3 px-4 text-right font-medium text-amber-700">
                {{ stock.reservedQuantity }} {{ stock.product.unit }}
              </td>
              <td class="py-3 px-4 text-right font-bold text-slate-900">
                {{ stock.availableQuantity + stock.reservedQuantity }} {{ stock.product.unit }}
              </td>
              <td class="py-3 px-4 text-slate-500">{{ stock.warehouseLocation }}</td>
              <td class="py-3 px-4 text-right">
                <button
                  v-if="!isAdmin && isWarehouse"
                  type="button"
                  @click="selectedStock = stock; showAdjustModal = true"
                  class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                >
                  Adjust
                </button>
                <span v-else class="text-slate-400 italic text-[11px]">View Only</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Stock Movements Log -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="p-4 border-b border-slate-200 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <History class="w-4 h-4 text-slate-500" />
          <h2 class="text-sm font-bold text-slate-800">Recent Inventory Movement Audit</h2>
        </div>
        <span class="text-xs text-slate-400">Past 50 operations</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-2.5 px-4">Date & Time</th>
              <th class="py-2.5 px-4">Product</th>
              <th class="py-2.5 px-4">Type</th>
              <th class="py-2.5 px-4 text-right">Qty Delta</th>
              <th class="py-2.5 px-4">Ref #</th>
              <th class="py-2.5 px-4">Notes</th>
              <th class="py-2.5 px-4">User</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="mov in movements" :key="mov.id">
              <td class="py-2 px-4 text-slate-400 whitespace-nowrap">
                {{ new Date(mov.createdAt).toLocaleString() }}
              </td>
              <td class="py-2 px-4 font-medium text-slate-800">{{ mov.product.name }}</td>
              <td class="py-2 px-4">
                <span class="font-semibold text-slate-700">{{ mov.movementType }}</span>
              </td>
              <td :class="['py-2 px-4 text-right font-bold', mov.quantity >= 0 ? 'text-emerald-700' : 'text-rose-600']">
                {{ mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity }}
              </td>
              <td class="py-2 px-4 font-mono text-slate-500">{{ mov.referenceNumber || '-' }}</td>
              <td class="py-2 px-4 text-slate-600">{{ mov.notes }}</td>
              <td class="py-2 px-4 text-slate-400">{{ mov.performedBy }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Adjust Stock Modal -->
    <div v-if="showAdjustModal && selectedStock" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 class="text-lg font-bold text-slate-900 mb-1">Stock Adjustment</h2>
        <p class="text-xs text-slate-500 mb-4">{{ selectedStock.product.name }}</p>

        <form @submit.prevent="handleAdjustSubmit" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">
              Quantity Delta (+ to restock, - to deduct) *
            </label>
            <input
              type="number"
              required
              v-model="adjustDelta"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. 10 or -2"
            />
            <p class="text-[11px] text-slate-400 mt-1">
              Current available: <strong>{{ selectedStock.availableQuantity }}</strong>
            </p>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Reason / Reference *</label>
            <input
              type="text"
              required
              v-model="adjustReason"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. Received new shipment from Growatt / Physical count adjustment"
            />
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="showAdjustModal = false"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs cursor-pointer"
            >
              Apply Stock Change
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
