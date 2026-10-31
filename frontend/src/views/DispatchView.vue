<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { api } from '../api/client';
import type { Dispatch, SalesOrder, DispatchItem } from '../types';
import StatusBadge from '../components/ui/StatusBadge.vue';
import { useAuthStore } from '../stores/auth';
import {
  Truck,
  Plus,
  Barcode,
  CheckCircle2,
  Camera,
  CameraOff,
  Volume2,
  Upload,
  RefreshCw,
  Zap,
  FlipHorizontal,
  AlertCircle,
  Loader2,
  Check,
  ImageIcon,
} from 'lucide-vue-next';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';

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
const cameraLoading = ref(false);
const cameraError = ref<string | null>(null);
const availableDevices = ref<{ deviceId: string; label: string }[]>([]);
const selectedDeviceId = ref<string>('');
const hasTorch = ref(false);
const isTorchOn = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
let lastScanned = '';
let scanningActive = false;

const videoRef = ref<HTMLVideoElement | null>(null);
let codeReader: BrowserMultiFormatReader | null = null;
let controls: IScannerControls | null = null;

const authStore = useAuthStore();
const isAdmin = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_ADMIN') || roles.includes('ROLE_DIRECTOR');
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
  const cleanCode = code.trim();
  if (cleanCode === lastScanned) return;
  lastScanned = cleanCode;
  setTimeout(() => {
    if (lastScanned === cleanCode) {
      lastScanned = '';
    }
  }, 2500);

  isScanning.value = true;
  scanMessage.value = null;

  try {
    const dispatchItemId = targetItemId.value !== 'auto' ? parseInt(targetItemId.value) : undefined;
    const res = await api.post(`/dispatches/${selectedDispatch.value.id}/scan-barcode`, {
      barcode: cleanCode,
      dispatchItemId,
    });
    playBeep();
    selectedDispatch.value = res.data;
    scanMessage.value = {
      text: `✓ Barcode '${cleanCode}' registered & allocated! Marked: Outbound for Installation.`,
      type: 'success',
    };
    fetchData();
  } catch (err: any) {
    scanMessage.value = {
      text: err.response?.data?.message || `Barcode '${cleanCode}' not found or already registered.`,
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

const startCamera = async (preferredDeviceId?: string) => {
  stopCamera();
  cameraError.value = null;
  cameraLoading.value = true;
  cameraActive.value = true;

  // Await next tick so videoRef element is mounted in DOM
  await nextTick();

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera API (getUserMedia) not supported in this browser. Please use the image upload option or USB scanner.');
    }

    if (!codeReader) {
      codeReader = new BrowserMultiFormatReader();
    }
    scanningActive = true;

    const constraints: MediaStreamConstraints = preferredDeviceId
      ? { video: { deviceId: { exact: preferredDeviceId } }, audio: false }
      : {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

    if (!videoRef.value) {
      throw new Error('Video preview element is not ready.');
    }

    controls = await codeReader.decodeFromConstraints(
      constraints,
      videoRef.value,
      (result, err) => {
        if (!scanningActive) return;
        if (result) {
          const text = result.getText();
          if (text && text.trim() && text.trim() !== lastScanned) {
            handleBarcodeScan(text.trim());
          }
        }
      }
    );

    // Detect torch capability
    if (controls && typeof controls.switchTorch === 'function') {
      hasTorch.value = true;
    } else {
      hasTorch.value = false;
    }

    // Refresh video devices list now that permission has been granted
    try {
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      availableDevices.value = devices.map((d, idx) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${idx + 1}`,
      }));
      if (preferredDeviceId) {
        selectedDeviceId.value = preferredDeviceId;
      } else if (devices.length > 0 && !selectedDeviceId.value) {
        const envCam = devices.find(d =>
          d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment')
        );
        selectedDeviceId.value = envCam ? envCam.deviceId : devices[0].deviceId;
      }
    } catch (e) {
      console.warn('Could not list video devices:', e);
    }
  } catch (err: any) {
    console.error('Camera initialization failed:', err);
    let msg = 'Camera access failed. ';
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      msg = 'Camera permission was denied. Please allow camera permissions in your browser or address bar settings.';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      msg = 'No camera found on this device. You can upload an image or use a USB barcode scanner.';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      msg = 'Camera hardware is busy or in use by another application.';
    } else if (err.message) {
      msg += err.message;
    }
    cameraError.value = msg;
    stopCamera();
  } finally {
    cameraLoading.value = false;
  }
};

const stopCamera = () => {
  scanningActive = false;
  if (controls) {
    try {
      controls.stop();
    } catch (e) {
      console.warn('Error stopping scanner controls:', e);
    }
    controls = null;
  }
  if (videoRef.value && videoRef.value.srcObject) {
    try {
      const stream = videoRef.value.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.value.srcObject = null;
    } catch (e) {}
  }
  cameraActive.value = false;
  cameraLoading.value = false;
  hasTorch.value = false;
  isTorchOn.value = false;
};

const toggleTorch = async () => {
  if (!controls?.switchTorch) return;
  try {
    const nextTorch = !isTorchOn.value;
    await controls.switchTorch(nextTorch);
    isTorchOn.value = nextTorch;
  } catch (err) {
    console.warn('Failed to switch torch:', err);
  }
};

const handleDeviceChange = async () => {
  if (selectedDeviceId.value) {
    await startCamera(selectedDeviceId.value);
  }
};

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  isScanning.value = true;
  scanMessage.value = {
    text: `Analyzing barcode image '${file.name}'...`,
    type: 'success',
  };

  try {
    if (!codeReader) {
      codeReader = new BrowserMultiFormatReader();
    }
    const objectUrl = URL.createObjectURL(file);
    const result = await codeReader.decodeFromImageUrl(objectUrl);
    URL.revokeObjectURL(objectUrl);

    if (result && result.getText()) {
      await handleBarcodeScan(result.getText());
    } else {
      throw new Error('No barcode detected in image');
    }
  } catch (err: any) {
    scanMessage.value = {
      text: 'Could not decode barcode from image. Please ensure the barcode is clear, flat, and well lit.',
      type: 'error',
    };
  } finally {
    isScanning.value = false;
    target.value = '';
  }
};

const closeScanModal = () => {
  stopCamera();
  selectedDispatch.value = null;
  scanMessage.value = null;
  cameraError.value = null;
  scannerInput.value = '';
  targetItemId.value = 'auto';
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

onMounted(() => {
  fetchData();
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
            <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Barcode class="w-5 h-5 text-emerald-600" />
              Picking & Barcode Scanner: {{ selectedDispatch.dispatchNumber }}
            </h2>
            <p class="text-xs text-slate-500">
              Order: <span class="font-mono font-semibold">{{ selectedDispatch.salesOrder.orderNumber }}</span> • Status: {{ selectedDispatch.status }}
            </p>
          </div>
          <button type="button" @click="closeScanModal" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <!-- Target Product Selector -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <label class="text-xs font-semibold text-slate-700 whitespace-nowrap">Target Product:</label>
          <select
            v-model="targetItemId"
            class="flex-1 bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="auto">⚡ Auto-Assign Next Unallocated Serialized Item</option>
            <option
              v-for="item in selectedDispatch.items.filter(i => i.product.serialized)"
              :key="item.id"
              :value="item.id.toString()"
            >
              {{ item.product.name }} ({{ item.serialNumber ? '✓ ' + item.serialNumber.serialCode : 'Pending Barcode' }})
            </option>
          </select>
        </div>

        <!-- Scan Feedback -->
        <div
          v-if="scanMessage"
          :class="[
            'p-3 rounded-xl text-xs mb-3 flex items-center space-x-2 transition-all',
            scanMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          ]"
        >
          <CheckCircle2 v-if="scanMessage.type === 'success'" class="w-4 h-4 text-emerald-600 shrink-0" />
          <AlertCircle v-else class="w-4 h-4 text-rose-600 shrink-0" />
          <span class="font-semibold">{{ scanMessage.text }}</span>
        </div>

        <!-- Camera Error Banner -->
        <div v-if="cameraError" class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs mb-3 flex items-start gap-2.5">
          <AlertCircle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="font-semibold">{{ cameraError }}</p>
            <div class="mt-2 flex gap-2">
              <button
                type="button"
                @click="startCamera(selectedDeviceId || undefined)"
                class="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-[11px] font-semibold cursor-pointer"
              >
                Retry Camera
              </button>
              <button
                type="button"
                @click="triggerFileInput"
                class="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 rounded text-[11px] font-semibold hover:bg-amber-100 cursor-pointer"
              >
                Upload Barcode Image
              </button>
            </div>
          </div>
        </div>

        <!-- Live Camera Barcode Reader Container -->
        <div class="mb-4 bg-slate-900 rounded-xl overflow-hidden p-3 text-white shadow-inner">
          <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800 text-xs">
            <span class="flex items-center gap-1.5 font-semibold text-emerald-400">
              <Camera class="w-4 h-4" /> Live Camera Scanner
            </span>

            <div class="flex items-center gap-2">
              <!-- Camera Switcher (if multiple cameras) -->
              <select
                v-if="availableDevices.length > 1"
                v-model="selectedDeviceId"
                @change="handleDeviceChange"
                class="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 text-[11px] focus:outline-none"
              >
                <option v-for="dev in availableDevices" :key="dev.deviceId" :value="dev.deviceId">
                  {{ dev.label }}
                </option>
              </select>

              <!-- Torch Toggle -->
              <button
                v-if="hasTorch && cameraActive"
                type="button"
                @click="toggleTorch"
                :class="[
                  'px-2 py-1 rounded text-[11px] font-semibold cursor-pointer flex items-center gap-1 transition',
                  isTorchOn ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                ]"
                title="Toggle Flashlight / Torch"
              >
                <Zap class="w-3.5 h-3.5" />
                <span>{{ isTorchOn ? 'Torch On' : 'Torch' }}</span>
              </button>

              <!-- Photo Upload Fallback Button -->
              <button
                type="button"
                @click="triggerFileInput"
                class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium cursor-pointer flex items-center gap-1"
                title="Upload or snap photo of barcode"
              >
                <Upload class="w-3.5 h-3.5 text-slate-400" />
                <span>Photo Upload</span>
              </button>

              <!-- Camera Toggle Button -->
              <button
                type="button"
                @click="cameraActive ? stopCamera() : startCamera(selectedDeviceId || undefined)"
                :class="[
                  'px-3 py-1 rounded text-[11px] font-semibold cursor-pointer transition flex items-center gap-1.5',
                  cameraActive ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                ]"
              >
                <CameraOff v-if="cameraActive" class="w-3.5 h-3.5" />
                <Camera v-else class="w-3.5 h-3.5" />
                <span>{{ cameraActive ? 'Turn Off Camera' : 'Turn On Camera' }}</span>
              </button>
            </div>
          </div>

          <!-- Hidden File Input for Mobile / Photo Scan Fallback -->
          <input
            type="file"
            ref="fileInputRef"
            accept="image/*"
            capture="environment"
            @change="handleImageUpload"
            class="hidden"
          />

          <!-- Viewport Box -->
          <div class="relative mt-2 aspect-16/9 bg-black rounded-lg overflow-hidden flex items-center justify-center">
            <!-- Loading Indicator -->
            <div v-if="cameraLoading" class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
              <Loader2 class="w-8 h-8 text-emerald-400 animate-spin mb-2" />
              <p class="text-xs text-slate-300 font-medium">Starting camera video stream & detector...</p>
            </div>

            <!-- Active Video Stream with HUD Viewfinder -->
            <template v-if="cameraActive">
              <video
                ref="videoRef"
                playsinline
                autoplay
                muted
                class="w-full h-full object-cover"
              ></video>

              <!-- HUD Target Box & Animated Laser Line -->
              <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div class="relative w-64 h-36 border border-emerald-400/40 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                  <!-- Corner Brackets -->
                  <div class="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-emerald-400"></div>
                  <div class="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-emerald-400"></div>
                  <div class="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-emerald-400"></div>
                  <div class="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-emerald-400"></div>

                  <!-- Animated Green Laser Scan Line -->
                  <div class="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#34d399] scanner-laser"></div>
                </div>

                <div class="absolute bottom-3 bg-black/60 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] text-emerald-300 font-medium border border-emerald-500/30">
                  Align 1D Barcode or 2D QR Code inside target box
                </div>
              </div>
            </template>

            <!-- Inactive State -->
            <div v-else class="text-center p-6 space-y-3">
              <div class="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                <Barcode class="w-6 h-6 text-emerald-400" />
              </div>
              <p class="text-xs text-slate-400 max-w-sm mx-auto">
                Use your device camera (laptop webcam, smartphone, or tablet rear camera) to scan product serial barcodes in real-time.
              </p>
              <div class="flex justify-center gap-2 pt-1">
                <button
                  type="button"
                  @click="startCamera(selectedDeviceId || undefined)"
                  class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Camera class="w-3.5 h-3.5" />
                  <span>Start Camera Scanner</span>
                </button>
                <button
                  type="button"
                  @click="triggerFileInput"
                  class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Upload class="w-3.5 h-3.5 text-slate-400" />
                  <span>Upload / Snap Photo</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Manual Barcode Entry Form -->
        <form @submit.prevent="handleManualScanSubmit" class="flex gap-2 mb-4">
          <input
            type="text"
            v-model="scannerInput"
            placeholder="Scan USB barcode gun or enter serial code (e.g. SN-INV-5KW-001)..."
            class="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            :disabled="!scannerInput.trim() || isScanning"
            class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {{ isScanning ? 'Registering...' : 'Register Serial' }}
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
              <tr
                v-for="item in selectedDispatch.items"
                :key="item.id"
                :class="{'bg-emerald-50/40': targetItemId === item.id.toString()}"
              >
                <td class="py-2.5 px-3 font-semibold text-slate-800">
                  <div class="flex items-center gap-1.5">
                    <span>{{ item.product.name }}</span>
                    <button
                      v-if="item.product.serialized && !item.serialNumber"
                      type="button"
                      @click="targetItemId = item.id.toString()"
                      class="text-[10px] text-emerald-600 hover:text-emerald-800 underline font-normal cursor-pointer"
                    >
                      (select as target)
                    </button>
                  </div>
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
                  <span v-if="item.serialNumber" class="text-emerald-700 font-bold text-[11px] inline-flex items-center gap-1">
                    <Check class="w-3.5 h-3.5 text-emerald-600" /> Picked
                  </span>
                  <span v-else class="text-slate-400 text-[11px]">Unallocated</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end pt-4 border-t border-slate-100 mt-4">
          <button
            type="button"
            @click="closeScanModal"
            class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes scanLaser {
  0% {
    top: 8%;
    opacity: 0.85;
  }
  50% {
    top: 88%;
    opacity: 1;
  }
  100% {
    top: 8%;
    opacity: 0.85;
  }
}

.scanner-laser {
  animation: scanLaser 2.2s ease-in-out infinite;
}
</style>
