<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api/client';
import type { Dispatch, SalesOrder, DispatchItem } from '../types';
import StatusBadge from '../components/ui/StatusBadge.vue';
import { useAuthStore } from '../stores/auth';
import { Truck, Plus, Barcode, CheckCircle2, Camera, CameraOff, Volume2 } from 'lucide-vue-next';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';

const dispatches = ref<Dispatch[]>([]);
const confirmedOrders = ref<SalesOrder[]>([]);
const loading = ref(true);
const showCreateModal = ref(false);
const selectedDispatch = ref<Dispatch | null>(null);

// Create Dispatch Form
const createForm = ref({
  salesOrderId: '',
  vehicleNumber: 'TN-38-BZ-4921',
  driverName: 'R. Murugan',
  driverPhone: '9842109876',
  dispatchNotes: 'Fragile solar modules & 5kW inverter strapped safely.',
});

// Barcode scanner
const targetItemId = ref('auto');
const scannerInput = ref('');
const isScanning = ref(false);
const scanMessage = ref<{ text: string; type: 'success' | 'error' } | null>(null);
const cameraActive = ref(false);
const cameraError = ref<string | null>(null);
let lastScanned = '';

const videoRef = ref<HTMLVideoElement | null>(null);
let codeReader: BrowserMultiFormatReader | null = null;
let scanningActive = false;

const route = useRoute();
const authStore = useAuthStore();
const isAdmin = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_ADMIN');
});
const isWarehouse = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_WAREHOUSE') && !isAdmin.value;
});

const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch (e) {
    // Audio context may be restricted by browser policy
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    const [dispRes, ordRes] = await Promise.all([
      api.get('/dispatches'),
      api.get('/orders'),
    ]);
    dispatches.value = dispRes.data;
    confirmedOrders.value = ordRes.data.filter((o: SalesOrder) => o.status === 'CONFIRMED');
    if (confirmedOrders.value.length > 0 && !createForm.value.salesOrderId) {
      createForm.value.salesOrderId = confirmedOrders.value[0].id.toString();
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleCreateDispatch = async () => {
  if (!createForm.value.salesOrderId) return;
  try {
    await api.post('/dispatches', {
      salesOrderId: parseInt(createForm.value.salesOrderId),
      vehicleNumber: createForm.value.vehicleNumber,
      driverName: createForm.value.driverName,
      driverPhone: createForm.value.driverPhone,
      dispatchNotes: createForm.value.dispatchNotes,
    });
    showCreateModal.value = false;
    fetchData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to create dispatch');
  }
};

const handleBarcodeScan = async (code: string) => {
  if (!code || !selectedDispatch.value) return;
  if (code === lastScanned) return;
  lastScanned = code;
  setTimeout(() => { lastScanned = ''; }, 2000);

  isScanning.value = true;
  scanMessage.value = null;

  try {
    const dispatchItemId = targetItemId.value !== 'auto' ? parseInt(targetItemId.value) : undefined;
    const res = await api.post(`/dispatches/${selectedDispatch.value.id}/scan-barcode`, {
      barcode: code,
      dispatchItemId,
    });
    playBeep();
    selectedDispatch.value = res.data;
    scanMessage.value = {
      text: `✓ Barcode '${code}' registered & allocated! Marked: Outbound for Installation.`,
      type: 'success',
    };
    fetchData();
  } catch (err: any) {
    scanMessage.value = {
      text: err.response?.data?.message || `Barcode '${code}' not found or already registered.`,
      type: 'error',
    };
  } finally {
    isScanning.value = false;
  }
};

const handleManualScanSubmit = () => {
  if (scannerInput.value.trim()) {
    handleBarcodeScan(scannerInput.value.trim());
    scannerInput.value = '';
  }
};

const startCamera = async () => {
  cameraError.value = null;
  lastScanned = '';
  try {
    codeReader = new BrowserMultiFormatReader();
    scanningActive = true;

    const devices = await BrowserMultiFormatReader.listVideoInputDevices();
    if (devices.length === 0) {
      cameraError.value = 'No camera found. Use USB scanner or manual entry.';
      return;
    }

    const preferredDevice = devices.find((d) => d.label.toLowerCase().includes('back')) || devices[0];

    await codeReader.decodeFromVideoDevice(
      preferredDevice.deviceId,
      videoRef.value!,
      (result, err) => {
        if (!scanningActive) return;
        if (result) {
          handleBarcodeScan(result.getText());
        }
      }
    );

    cameraActive.value = true;
  } catch (err: any) {
    cameraError.value = 'Camera unavailable. Allow camera permission or use manual entry below.';
    cameraActive.value = false;
  }
};

const stopCamera = () => {
  scanningActive = false;
  if (codeReader) {
    codeReader = null;
  }
  if (videoRef.value && videoRef.value.srcObject) {
    const stream = videoRef.value.srcObject as MediaStream;
    stream.getTracks().forEach((track) => track.stop());
    videoRef.value.srcObject = null;
  }
  cameraActive.value = false;
  lastScanned = '';
};

const handleDispatchShipment = async (dispatchId: number) => {
  try {
    await api.patch(`/dispatches/${dispatchId}/dispatch`);
    fetchData();
    if (selectedDispatch.value && selectedDispatch.value.id === dispatchId) {
      const res = await api.get(`/dispatches/${dispatchId}`);
      selectedDispatch.value = res.data;
    }
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to dispatch shipment');
  }
};

const handleMarkDelivered = async (dispatchId: number) => {
  try {
    await api.patch(`/dispatches/${dispatchId}/deliver`);
    fetchData();
    if (selectedDispatch.value && selectedDispatch.value.id === dispatchId) {
      const res = await api.get(`/dispatches/${dispatchId}`);
      selectedDispatch.value = res.data;
    }
    alert('Shipment marked DELIVERED! Serialized product warranties automatically activated in database.');
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to mark delivered');
  }
};

onMounted(async () => {
  await fetchData();
  if (route.query.orderId) {
    createForm.value.salesOrderId = String(route.query.orderId);
    showCreateModal.value = true;
  }
});

onBeforeUnmount(() => {
  stopCamera();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Warehouse Picking & Barcode Dispatch</h1>
        <p class="text-sm text-slate-500">
          Serialized scanning • Vehicle logistics • Automatic warranty activation on delivery confirmation
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="isWarehouse"
          type="button"
          @click="showCreateModal = true"
          class="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>Create Dispatch Order</span>
        </button>
      </div>
    </div>

    <!-- Dispatches Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">Dispatch #</th>
              <th class="py-3 px-4">Sales Order</th>
              <th class="py-3 px-4">Customer</th>
              <th class="py-3 px-4">Vehicle / Driver</th>
              <th class="py-3 px-4">Serialized Items</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="dispatches.length === 0">
              <td colspan="7" class="py-8 text-center text-slate-400">
                No dispatch orders generated. Confirmed orders ready for dispatch will appear here.
              </td>
            </tr>
            <tr v-for="disp in dispatches" :key="disp.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ disp.dispatchNumber }}</td>
              <td class="py-3 px-4 font-mono font-semibold text-slate-700">{{ disp.salesOrder.orderNumber }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">
                <div>{{ disp.customer.fullName }}</div>
                <div class="text-[11px] text-slate-400 font-normal">{{ disp.customer.city || disp.customer.phone }}</div>
              </td>
              <td class="py-3 px-4">
                <span class="font-bold text-slate-800">{{ disp.vehicleNumber || 'Unassigned' }}</span>
                <span class="block text-[10px] text-slate-400">{{ disp.driverName }} ({{ disp.driverPhone }})</span>
              </td>
              <td class="py-3 px-4">
                <span class="font-bold text-slate-800">{{ disp.items.length }} line items</span>
              </td>
              <td class="py-3 px-4">
                <StatusBadge :status="disp.status" />
              </td>
              <td class="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                <button
                  type="button"
                  @click="selectedDispatch = disp"
                  class="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium cursor-pointer inline-flex items-center space-x-1"
                >
                  <Barcode class="w-3.5 h-3.5" />
                  <span>Scan & Pick</span>
                </button>

                <button
                  v-if="isWarehouse && disp.status === 'READY_FOR_DISPATCH'"
                  type="button"
                  @click="handleDispatchShipment(disp.id)"
                  class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold cursor-pointer inline-flex items-center space-x-1"
                >
                  <Truck class="w-3.5 h-3.5" />
                  <span>Dispatch Vehicle</span>
                </button>

                <button
                  v-if="isWarehouse && disp.status === 'DISPATCHED'"
                  type="button"
                  @click="handleMarkDelivered(disp.id)"
                  class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold cursor-pointer inline-flex items-center space-x-1"
                >
                  <CheckCircle2 class="w-3.5 h-3.5" />
                  <span>Mark Delivered</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Create Dispatch Order -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h2 class="text-lg font-bold text-slate-900">Create Warehouse Dispatch Manifest</h2>
          <button type="button" @click="showCreateModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="handleCreateDispatch" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Select Confirmed Sales Order *</label>
            <select
              required
              v-model="createForm.salesOrderId"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">-- Choose Confirmed Order --</option>
              <option v-for="o in confirmedOrders" :key="o.id" :value="o.id">
                {{ o.orderNumber }} - {{ o.customer.fullName }} ({{ o.capacityKw }} kW)
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Vehicle Registration # *</label>
              <input
                type="text"
                required
                v-model="createForm.vehicleNumber"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs uppercase font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Driver Name *</label>
              <input
                type="text"
                required
                v-model="createForm.driverName"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Driver Phone Number *</label>
            <input
              type="tel"
              required
              v-model="createForm.driverPhone"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Handling / Packaging Notes</label>
            <textarea
              rows="2"
              v-model="createForm.dispatchNotes"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
              :disabled="confirmedOrders.length === 0"
              class="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              Create Dispatch
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Barcode Scanning & Picking Workbench -->
    <div v-if="selectedDispatch" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Picking & Barcode Scanner: {{ selectedDispatch.dispatchNumber }}</h2>
            <p class="text-xs text-slate-500">Order: {{ selectedDispatch.salesOrder.orderNumber }} • Status: {{ selectedDispatch.status }}</p>
          </div>
          <button type="button" @click="stopCamera(); selectedDispatch = null" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <!-- Scan Feedback -->
        <div v-if="scanMessage" :class="['p-3 rounded-xl text-xs mb-3 flex items-center space-x-2', scanMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200']">
          <span class="font-semibold">{{ scanMessage.text }}</span>
        </div>

        <!-- Live Camera Barcode Reader -->
        <div class="mb-4 bg-slate-900 rounded-xl overflow-hidden p-2 text-center text-white">
          <div class="flex items-center justify-between px-2 py-1 text-xs">
            <span class="flex items-center gap-1.5"><Barcode class="w-4 h-4 text-emerald-400" /> Live Camera Barcode Scanner</span>
            <button
              type="button"
              @click="cameraActive ? stopCamera() : startCamera()"
              class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold cursor-pointer"
            >
              {{ cameraActive ? 'Turn Off Camera' : 'Turn On Camera' }}
            </button>
          </div>
          <div v-if="cameraActive" class="relative mt-2 aspect-16/9 bg-black rounded-lg overflow-hidden flex items-center justify-center">
            <video ref="videoRef" playsinline muted class="w-full h-full object-cover"></video>
          </div>
        </div>

        <!-- Manual Barcode Entry Form -->
        <form @submit.prevent="handleManualScanSubmit" class="flex gap-2 mb-4">
          <input
            type="text"
            v-model="scannerInput"
            placeholder="Scan USB barcode or enter serial code (e.g. SN-INV-5KW-001)..."
            class="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Register Serial
          </button>
        </form>

        <!-- Manifest Items Table -->
        <div class="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <table class="w-full text-left">
            <thead class="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th class="py-2 px-3">Item</th>
                <th class="py-2 px-3 text-center">Qty</th>
                <th class="py-2 px-3">Allocated Barcode / Serial</th>
                <th class="py-2 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in selectedDispatch.items" :key="item.id">
                <td class="py-2.5 px-3 font-semibold text-slate-800">
                  {{ item.product.name }}
                  <span class="block text-[10px] text-slate-400 font-normal">{{ item.product.productCode }}</span>
                </td>
                <td class="py-2.5 px-3 text-center font-bold text-slate-700">{{ item.quantity }} {{ item.product.unit }}</td>
                <td class="py-2.5 px-3">
                  <span v-if="item.serialNumber" class="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {{ item.serialNumber.serialCode }}
                  </span>
                  <span v-else class="text-amber-600 italic text-[11px]">Pending Barcode Scan</span>
                </td>
                <td class="py-2.5 px-3 text-right">
                  <span v-if="item.serialNumber" class="text-emerald-700 font-bold text-[11px]">✓ Picked</span>
                  <span v-else class="text-slate-400 text-[11px]">Unallocated</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end pt-4 border-t border-slate-100 mt-4">
          <button
            type="button"
            @click="stopCamera(); selectedDispatch = null"
            class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
