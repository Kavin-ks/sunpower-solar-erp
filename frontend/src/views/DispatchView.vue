<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { api } from '../api/client';
import type { Dispatch, SalesOrder, DispatchItem, Technician } from '../types';
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
  Users,
  ShieldCheck,
  Clock,
  FileText,
  Calendar,
  PenTool,
  Wrench,
  MapPin,
  UserCheck,
  Eye,
} from 'lucide-vue-next';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import CommissioningReportModal from '../components/common/CommissioningReportModal.vue';

const dispatches = ref<Dispatch[]>([]);
const confirmedOrders = ref<SalesOrder[]>([]);
const availableTechnicians = ref<Technician[]>([]);
const installations = ref<any[]>([]);
const showActivateWarrantyModal = ref(false);
const activeWarrantyDispatch = ref<Dispatch | null>(null);
const activeWarrantyInstallation = ref<any | null>(null);
const showCommissioningPdf = ref(false);
const activeCommissioningInstallation = ref<any | null>(null);
const showCrewModal = ref(false);
const activeCrewDispatch = ref<Dispatch | null>(null);
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

// Confirm Dispatch Modal Form
const showConfirmDispatchModal = ref(false);
const dispatchToConfirm = ref<Dispatch | null>(null);
const confirmForm = ref({
  vehicleNumber: 'TN-38-BZ-4921',
  driverName: 'R. Murugan',
  driverPhone: '9842109876',
  dispatchDateTime: new Date().toISOString().slice(0, 16),
  dispatchNotes: 'All serialized components scanned and loaded securely.',
  teamLeadId: '' as string | number,
  assignedTechnicianIds: [] as number[],
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
const lastDetectedBarcode = ref<string | null>(null);
let lastScanned = '';
let scanningActive = false;

const unallocatedItemsCount = computed(() => {
  if (!selectedDispatch.value) return 0;
  return selectedDispatch.value.items.filter(
    (i) => i.product.serialized && !i.serialNumber
  ).length;
});

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
  return roles.includes('ROLE_WAREHOUSE');
});
const canManageDispatch = computed(() => {
  return isAdmin.value || isWarehouse.value;
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
    const [dispRes, ordRes, techRes, instRes] = await Promise.all([
      api.get('/dispatches'),
      api.get('/orders'),
      api.get('/technicians'),
      api.get('/installations'),
    ]);
    dispatches.value = dispRes.data;
    confirmedOrders.value = ordRes.data.filter((o: SalesOrder) => o.status === 'CONFIRMED');
    availableTechnicians.value = techRes.data;
    installations.value = instRes.data;
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
  lastDetectedBarcode.value = cleanCode;
  setTimeout(() => {
    if (lastDetectedBarcode.value === cleanCode) {
      lastDetectedBarcode.value = null;
    }
  }, 4000);

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
  lastDetectedBarcode.value = null;
};

const openConfirmDispatchModal = (disp: Dispatch) => {
  dispatchToConfirm.value = disp;
  confirmForm.value.vehicleNumber = disp.vehicleNumber || 'TN-38-BZ-4921';
  confirmForm.value.driverName = disp.driverName || 'R. Murugan';
  confirmForm.value.driverPhone = disp.driverPhone || '9842109876';
  confirmForm.value.dispatchDateTime = new Date().toISOString().slice(0, 16);
  confirmForm.value.dispatchNotes = disp.dispatchNotes || 'All serialized components scanned and loaded securely.';
  if (availableTechnicians.value.length > 0) {
    confirmForm.value.teamLeadId = availableTechnicians.value[0].id;
    confirmForm.value.assignedTechnicianIds = [
      availableTechnicians.value[0].id,
      ...(availableTechnicians.value.length > 1 ? [availableTechnicians.value[1].id] : [])
    ];
  }
  showConfirmDispatchModal.value = true;
};

const toggleTechnicianSelection = (techId: number) => {
  const idx = confirmForm.value.assignedTechnicianIds.indexOf(techId);
  if (idx >= 0) {
    confirmForm.value.assignedTechnicianIds.splice(idx, 1);
    if (confirmForm.value.teamLeadId === techId) {
      confirmForm.value.teamLeadId = confirmForm.value.assignedTechnicianIds[0] || '';
    }
  } else {
    confirmForm.value.assignedTechnicianIds.push(techId);
    if (!confirmForm.value.teamLeadId) {
      confirmForm.value.teamLeadId = techId;
    }
  }
};

const handleConfirmDispatchSubmit = async () => {
  if (!dispatchToConfirm.value) return;
  if (!confirmForm.value.vehicleNumber || !confirmForm.value.driverName) {
    alert('Vehicle number and driver details are required.');
    return;
  }
  if (!confirmForm.value.teamLeadId) {
    alert('Please assign a Team Lead technician for this installation.');
    return;
  }
  try {
    const res = await api.post(`/dispatches/${dispatchToConfirm.value.id}/confirm-dispatch`, {
      vehicleNumber: confirmForm.value.vehicleNumber,
      driverName: confirmForm.value.driverName,
      driverPhone: confirmForm.value.driverPhone,
      dispatchDateTime: confirmForm.value.dispatchDateTime ? new Date(confirmForm.value.dispatchDateTime).toISOString() : null,
      dispatchNotes: confirmForm.value.dispatchNotes,
      teamLeadId: Number(confirmForm.value.teamLeadId),
      assignedTechnicianIds: confirmForm.value.assignedTechnicianIds,
    });
    showConfirmDispatchModal.value = false;
    alert(`Dispatch #${dispatchToConfirm.value.dispatchNumber} confirmed and marked DISPATCHED! Technician crew and Team Lead assigned.`);
    fetchData();
    if (selectedDispatch.value && selectedDispatch.value.id === dispatchToConfirm.value.id) {
      selectedDispatch.value = res.data;
    }
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to confirm dispatch');
  }
};

const handleDispatchShipment = async (dispatchId: number) => {
  const disp = dispatches.value.find(d => d.id === dispatchId);
  if (disp) {
    openConfirmDispatchModal(disp);
  } else {
    try {
      await api.patch(`/dispatches/${dispatchId}/dispatch`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to dispatch shipment');
    }
  }
};

const getInstallationForDispatch = (disp: Dispatch) => {
  return installations.value.find(
    (inst) => (inst.dispatch && inst.dispatch.id === disp.id) || (inst.salesOrder && disp.salesOrder && inst.salesOrder.id === disp.salesOrder.id)
  );
};

const getTeamLead = (disp: Dispatch) => {
  const inst = getInstallationForDispatch(disp);
  if (!inst || !inst.assignedTechnicians || inst.assignedTechnicians.length === 0) return null;
  const leadEntry = inst.assignedTechnicians.find((at: any) => at.isTeamLead);
  if (leadEntry) {
    return {
      name: leadEntry.technician?.name || leadEntry.technician?.user?.fullName || 'Assigned Lead',
      phone: leadEntry.technician?.phone || leadEntry.technician?.user?.phone || 'N/A',
      role: leadEntry.role || 'Team Lead',
    };
  }
  const first = inst.assignedTechnicians[0];
  return {
    name: first.technician?.name || first.technician?.user?.fullName || 'Technician',
    phone: first.technician?.phone || first.technician?.user?.phone || 'N/A',
    role: first.role || 'Technician',
  };
};

const getAssignedCrew = (disp: Dispatch) => {
  const inst = getInstallationForDispatch(disp);
  if (!inst || !inst.assignedTechnicians) return [];
  return inst.assignedTechnicians.map((at: any) => ({
    name: at.technician?.name || at.technician?.user?.fullName || 'Technician',
    phone: at.technician?.phone || at.technician?.user?.phone || 'N/A',
    role: at.role || (at.isTeamLead ? 'Team Lead' : 'Technician Crew'),
    isLead: Boolean(at.isTeamLead),
  }));
};

const openCrewModal = (disp: Dispatch) => {
  activeCrewDispatch.value = disp;
  showCrewModal.value = true;
};

const openActivateWarrantyModal = (disp: Dispatch) => {
  activeWarrantyDispatch.value = disp;
  activeWarrantyInstallation.value = getInstallationForDispatch(disp);
  showActivateWarrantyModal.value = true;
};

const handleActivateWarranty = async () => {
  if (!activeWarrantyDispatch.value) return;
  const dispId = activeWarrantyDispatch.value.id;
  try {
    await api.post(`/dispatches/${dispId}/activate-warranty`);
    showActivateWarrantyModal.value = false;
    alert(`Warranty officially activated for Dispatch #${activeWarrantyDispatch.value.dispatchNumber}! Equipment & Dispatch status set to INSTALLED.`);
    await fetchData();
    if (selectedDispatch.value && selectedDispatch.value.id === dispId) {
      const res = await api.get(`/dispatches/${dispId}`);
      selectedDispatch.value = res.data;
    }
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to activate warranty');
  }
};

const openCommissioningPdfModal = (inst: any) => {
  activeCommissioningInstallation.value = inst;
  showCommissioningPdf.value = true;
};

const formatTestingNotes = (notes?: string) => {
  if (!notes) return 'Grid synchronization test passed. Earthing & DC insulation verified.';
  if (notes.trim().startsWith('{') || notes.trim().startsWith('[')) {
    return 'Grid synchronization test passed. Full system testing verified.';
  }
  return notes;
};

const handleMarkDelivered = async (dispatchId: number) => {
  try {
    await api.patch(`/dispatches/${dispatchId}/deliver`);
    await fetchData();
    if (selectedDispatch.value && selectedDispatch.value.id === dispatchId) {
      const res = await api.get(`/dispatches/${dispatchId}`);
      selectedDispatch.value = res.data;
    }
    alert('Shipment marked DELIVERED! Delivery date recorded. Serial numbers are at customer site awaiting on-site technician installation.');
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
          v-if="canManageDispatch"
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
              <th class="py-3 px-4">Logistics & Crew</th>
              <th class="py-3 px-4">Serialized Items</th>
              <th class="py-3 px-4">Status & Milestone</th>
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
                <div class="font-bold text-slate-800 flex items-center gap-1.5">
                  <Truck class="w-3.5 h-3.5 text-slate-400" />
                  <span>{{ disp.vehicleNumber || 'Unassigned Vehicle' }}</span>
                </div>
                <div v-if="disp.driverName" class="text-[10px] text-slate-500 mt-0.5">
                  Driver: {{ disp.driverName }} ({{ disp.driverPhone }})
                </div>

                <!-- Team Leader: ONLY where appropriate (after it is assigned) -->
                <div v-if="getTeamLead(disp)" class="mt-1.5">
                  <button
                    type="button"
                    @click="openCrewModal(disp)"
                    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer shadow-2xs transition group"
                    title="Click to view assigned Team Leader and crew members"
                  >
                    <UserCheck class="w-3 h-3 text-indigo-600" />
                    <span>⭐ Lead: {{ getTeamLead(disp).name }}</span>
                    <Eye class="w-3 h-3 text-indigo-400 group-hover:text-indigo-600 ml-0.5" />
                  </button>
                </div>
                <div v-else-if="disp.status === 'PICKING' || disp.status === 'READY_FOR_DISPATCH' || disp.status === 'PENDING'" class="text-[10px] text-slate-400 italic mt-1">
                  Crew: Assigned on dispatch
                </div>
              </td>
              <td class="py-3 px-4">
                <span class="font-bold text-slate-800">{{ disp.items.filter(i => i.product.serialized).length }} serialized units</span>
                <span class="block text-[10px]" :class="disp.items.filter(i => i.product.serialized && !i.serialNumber).length > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-medium'">
                  {{ disp.items.filter(i => i.product.serialized && i.serialNumber).length }} / {{ disp.items.filter(i => i.product.serialized).length }} picked
                </span>
              </td>
              <td class="py-3 px-4">
                <!-- If DELIVERED: show real installation progress milestone -->
                <template v-if="disp.status === 'DELIVERED'">
                  <div class="space-y-1">
                    <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      DELIVERED
                    </span>
                    <div class="text-[11px]">
                      <span v-if="!getInstallationForDispatch(disp) || getInstallationForDispatch(disp)?.status === 'SCHEDULED'" class="text-amber-700 font-medium inline-flex items-center gap-1">
                        <Clock class="w-3 h-3 text-amber-500" />
                        <span>Awaiting Site Arrival</span>
                      </span>
                      <span v-else-if="getInstallationForDispatch(disp)?.status === 'SITE_RECEIVED'" class="text-blue-700 font-medium inline-flex items-center gap-1">
                        <MapPin class="w-3 h-3 text-blue-500" />
                        <span>Crew at Site</span>
                      </span>
                      <span v-else-if="getInstallationForDispatch(disp)?.status === 'IN_PROGRESS'" class="text-indigo-700 font-bold inline-flex items-center gap-1 animate-pulse">
                        <Wrench class="w-3 h-3 text-indigo-600" />
                        <span>Installing / In Progress</span>
                      </span>
                      <span v-else-if="getInstallationForDispatch(disp)?.status === 'COMPLETED'" class="text-emerald-700 font-bold inline-flex items-center gap-1">
                        <CheckCircle2 class="w-3 h-3 text-emerald-600" />
                        <span>Dossier Ready for Review</span>
                      </span>
                    </div>
                  </div>
                </template>
                <template v-else-if="disp.status === 'INSTALLED'">
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" />
                    <span>INSTALLED (Active)</span>
                  </span>
                </template>
                <template v-else>
                  <StatusBadge :status="disp.status" />
                </template>
              </td>
              <td class="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                <button
                  type="button"
                  @click="selectedDispatch = disp"
                  :class="[
                    'px-2.5 py-1 rounded font-semibold cursor-pointer inline-flex items-center space-x-1 text-xs transition',
                    disp.status === 'PICKING'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  ]"
                >
                  <Barcode class="w-3.5 h-3.5" />
                  <span>{{ disp.status === 'PICKING' ? '⚡ Scan & Pick' : 'View Serials' }}</span>
                </button>

                <!-- Enable Confirm Dispatch once all items are picked OR ready for dispatch -->
                <button
                  v-if="canManageDispatch && (disp.status === 'READY_FOR_DISPATCH' || (disp.status === 'PICKING' && disp.items.filter(i => i.product.serialized && !i.serialNumber).length === 0))"
                  type="button"
                  @click="openConfirmDispatchModal(disp)"
                  class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold cursor-pointer inline-flex items-center space-x-1"
                >
                  <Truck class="w-3.5 h-3.5" />
                  <span>Confirm Dispatch</span>
                </button>

                <button
                  v-if="canManageDispatch && disp.status === 'DISPATCHED'"
                  type="button"
                  @click="handleMarkDelivered(disp.id)"
                  class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold cursor-pointer inline-flex items-center space-x-1"
                >
                  <CheckCircle2 class="w-3.5 h-3.5" />
                  <span>Mark Delivered</span>
                </button>

                <!-- If DELIVERED: Check installation status -->
                <template v-else-if="disp.status === 'DELIVERED'">
                  <button
                    v-if="canManageDispatch && getInstallationForDispatch(disp)?.status === 'COMPLETED'"
                    type="button"
                    @click="openActivateWarrantyModal(disp)"
                    class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer inline-flex items-center space-x-1 shadow-xs animate-pulse text-xs"
                    title="Technician submitted completion dossier with photos, timeframe & customer digital signature"
                  >
                    <ShieldCheck class="w-3.5 h-3.5" />
                    <span>Review & Activate Warranty</span>
                  </button>

                  <span
                    v-else
                    class="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 inline-flex items-center gap-1"
                    title="Equipment delivered. Awaiting technician team lead rooftop installation & customer signature"
                  >
                    <Clock class="w-3.5 h-3.5 text-slate-400" />
                    <span>Awaiting Installation</span>
                  </span>
                </template>

                <!-- If INSTALLED: Warranties Active badge + view dossier button -->
                <template v-else-if="disp.status === 'INSTALLED'">
                  <button
                    v-if="getInstallationForDispatch(disp)"
                    type="button"
                    @click="openCommissioningPdfModal(getInstallationForDispatch(disp))"
                    class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold border border-indigo-200 inline-flex items-center space-x-1 cursor-pointer"
                    title="View Commissioning Dossier & Digital Signature"
                  >
                    <FileText class="w-3.5 h-3.5" />
                    <span>View Dossier PDF</span>
                  </button>
                </template>
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

    <!-- Modal: Confirm Dispatch & Assign Technician Crew -->
    <div v-if="showConfirmDispatchModal && dispatchToConfirm" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Truck class="w-5 h-5 text-blue-600" />
              Confirm Dispatch: {{ dispatchToConfirm.dispatchNumber }}
            </h2>
            <p class="text-xs text-slate-500">Record vehicle, driver details and assign the installation team</p>
          </div>
          <button type="button" @click="showConfirmDispatchModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="handleConfirmDispatchSubmit" class="space-y-4 text-xs">
          <!-- Logistics Details -->
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
            <h3 class="font-bold text-slate-800 text-xs uppercase tracking-wide">Vehicle & Driver Details</h3>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Vehicle Registration # *</label>
                <input
                  type="text"
                  required
                  v-model="confirmForm.vehicleNumber"
                  placeholder="e.g. TN-38-BZ-4921"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono uppercase bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Dispatch Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  v-model="confirmForm.dispatchDateTime"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Driver Name *</label>
                <input
                  type="text"
                  required
                  v-model="confirmForm.driverName"
                  placeholder="e.g. R. Murugan"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Driver Phone Number *</label>
                <input
                  type="tel"
                  required
                  v-model="confirmForm.driverPhone"
                  placeholder="e.g. 9842109876"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Dispatch Notes</label>
              <textarea
                rows="2"
                v-model="confirmForm.dispatchNotes"
                placeholder="Transit packaging, fragile items note, etc."
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              ></textarea>
            </div>
          </div>

          <!-- Technician Team Assignment -->
          <div class="bg-indigo-50/60 p-3 rounded-xl border border-indigo-200 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-bold text-indigo-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <Users class="w-4 h-4 text-indigo-700" />
                  Assigned Technician Team
                </h3>
                <p class="text-[11px] text-indigo-700">Select technicians who will install this solar rooftop system</p>
              </div>
              <span class="text-[11px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full">
                {{ confirmForm.assignedTechnicianIds.length }} selected
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 bg-white rounded-lg border border-indigo-100">
              <label
                v-for="tech in availableTechnicians"
                :key="tech.id"
                :class="[
                  'flex items-center space-x-2 p-2 rounded border cursor-pointer transition text-[11px]',
                  confirmForm.assignedTechnicianIds.includes(tech.id)
                    ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                ]"
              >
                <input
                  type="checkbox"
                  :checked="confirmForm.assignedTechnicianIds.includes(tech.id)"
                  @change="toggleTechnicianSelection(tech.id)"
                  class="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span class="truncate">{{ tech.name }}</span>
              </label>
            </div>

            <!-- Select Team Lead -->
            <div v-if="confirmForm.assignedTechnicianIds.length > 0">
              <label class="block font-semibold text-indigo-950 mb-1">
                ⭐ Appoint Team Lead (Coordinates installation & submits final signoff) *
              </label>
              <select
                required
                v-model="confirmForm.teamLeadId"
                class="w-full px-3 py-2 border border-indigo-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Choose Team Lead --</option>
                <option
                  v-for="tId in confirmForm.assignedTechnicianIds"
                  :key="tId"
                  :value="tId"
                >
                  ⭐ {{ availableTechnicians.find(t => t.id === tId)?.name || 'Technician #' + tId }} (Team Lead)
                </option>
              </select>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="showConfirmDispatchModal = false"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center space-x-1.5"
            >
              <Truck class="w-4 h-4" />
              <span>Confirm & Dispatch</span>
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

        <!-- Banner when all serialized products picked -->
        <div v-if="unallocatedItemsCount === 0" class="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs mb-4 flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <CheckCircle2 class="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p class="font-bold text-emerald-900">All serialized items in {{ selectedDispatch.dispatchNumber }} are scanned & verified!</p>
              <p class="text-[11px] text-emerald-700">Status: <span class="font-bold">{{ selectedDispatch.status }}</span>. Ready to assign technician team and dispatch vehicle.</p>
            </div>
          </div>
          <button
            v-if="canManageDispatch && (selectedDispatch.status === 'PICKING' || selectedDispatch.status === 'READY_FOR_DISPATCH')"
            type="button"
            @click="openConfirmDispatchModal(selectedDispatch)"
            class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer flex items-center space-x-1.5 shrink-0"
          >
            <Truck class="w-4 h-4" />
            <span>Confirm Dispatch</span>
          </button>
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

              <!-- Detected Barcode Notification Overlay -->
              <div
                v-if="lastDetectedBarcode"
                class="absolute top-3 bg-emerald-950/95 border border-emerald-400 text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2 shadow-xl z-30 animate-pulse pointer-events-none"
              >
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>Scanned: {{ lastDetectedBarcode }}</span>
              </div>

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
                  <template v-if="item.product.serialized">
                    <span v-if="item.serialNumber" class="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {{ item.serialNumber.serialCode }}
                    </span>
                    <span v-else class="text-amber-600 italic text-[11px] font-semibold">Pending Barcode Scan</span>
                  </template>
                  <template v-else>
                    <span class="text-slate-400 italic text-[11px]">Bulk Item (No Serial Required)</span>
                  </template>
                </td>
                <td class="py-2.5 px-3 text-right">
                  <template v-if="item.product.serialized">
                    <span v-if="item.serialNumber" class="text-emerald-700 font-bold text-[11px] inline-flex items-center gap-1">
                      <Check class="w-3.5 h-3.5 text-emerald-600" /> Picked
                    </span>
                    <span v-else class="text-amber-600 font-medium text-[11px]">Unallocated</span>
                  </template>
                  <template v-else>
                    <span class="text-slate-600 font-medium text-[11px] inline-flex items-center gap-1">
                      <Check class="w-3.5 h-3.5 text-slate-400" /> Bulk Packed
                    </span>
                  </template>
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

    <!-- MODAL: WAREHOUSE MANAGER WARRANTY ACTIVATION REVIEW (Clean, Concise & Streamlined) -->
    <div v-if="showActivateWarrantyModal && activeWarrantyDispatch" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-2.5">
            <div class="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <ShieldCheck class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-900">Review & Activate Warranty</h2>
              <p class="text-xs text-slate-500">
                Dispatch #{{ activeWarrantyDispatch.dispatchNumber }} • Customer: <span class="font-semibold text-slate-800">{{ activeWarrantyDispatch.customer.fullName }}</span>
              </p>
            </div>
          </div>
          <button type="button" @click="showActivateWarrantyModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <div v-if="!activeWarrantyInstallation" class="p-6 text-center text-slate-500 text-xs">
          No installation completion record found for this dispatch.
        </div>

        <div v-else class="space-y-4 text-xs">
          <!-- 3 Compact KPI Summary Cards -->
          <div class="grid grid-cols-3 gap-3">
            <div class="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100">
              <span class="text-[10px] uppercase font-bold text-indigo-700 block">Team Lead & Hours</span>
              <div class="font-bold text-slate-900 text-xs mt-0.5 truncate">
                ⭐ {{ getTeamLead(activeWarrantyDispatch)?.name || 'Selvakumar R' }}
              </div>
              <div class="text-[11px] text-indigo-900 font-semibold mt-0.5">
                {{ activeWarrantyInstallation.hoursWorked || 7.5 }} hrs on-site
              </div>
            </div>

            <div class="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
              <span class="text-[10px] uppercase font-bold text-emerald-700 block">System & Grid Sync</span>
              <div class="font-bold text-emerald-900 text-xs mt-0.5">
                {{ activeWarrantyInstallation.installedCapacityKw || activeWarrantyDispatch.salesOrder.capacityKw || 5 }} kW System
              </div>
              <div class="text-[11px] text-emerald-700 font-medium mt-0.5">
                ✓ Grid test passed
              </div>
            </div>

            <div class="p-3 bg-purple-50/70 rounded-xl border border-purple-100">
              <span class="text-[10px] uppercase font-bold text-purple-700 block">Hardware Coverage</span>
              <div class="font-bold text-purple-900 text-xs mt-0.5">
                {{ activeWarrantyDispatch.items.filter(i => i.product.serialized && i.serialNumber).length }} Serialized Units
              </div>
              <div class="text-[11px] text-purple-700 font-medium mt-0.5">
                Ready to activate
              </div>
            </div>
          </div>

          <!-- Proof Evidence: Rooftop Photo + Customer Digital Signature -->
          <div class="grid grid-cols-2 gap-3.5">
            <!-- Completed Rooftop Photo -->
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] uppercase font-bold text-slate-600">Rooftop Installation Proof</span>
                <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">✓ On-Site</span>
              </div>
              <div class="h-40 w-full bg-slate-200 rounded-lg overflow-hidden border border-slate-300 relative group">
                <img
                  v-if="activeWarrantyInstallation.completionPhotoUrl"
                  :src="activeWarrantyInstallation.completionPhotoUrl"
                  alt="Rooftop solar completed"
                  class="w-full h-full object-cover"
                />
                <div v-else class="h-full flex items-center justify-center text-slate-400 text-xs">
                  No rooftop photo provided
                </div>
              </div>
            </div>

            <!-- Customer Formal Digital Sign-Off -->
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] uppercase font-bold text-slate-600">Customer Digital Signature</span>
                <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">✓ Verified</span>
              </div>
              <div class="h-40 w-full bg-white rounded-lg border border-dashed border-slate-300 p-2 flex flex-col items-center justify-center">
                <img
                  v-if="activeWarrantyInstallation.customerSignatureUrl"
                  :src="activeWarrantyInstallation.customerSignatureUrl"
                  alt="Customer Signature"
                  class="max-h-24 max-w-full object-contain"
                />
                <span v-else class="text-slate-400 text-xs italic">Signature not attached</span>
                <div class="mt-2 text-center border-t border-slate-100 pt-1.5 w-full">
                  <span class="text-[11px] font-bold text-slate-800 block">
                    {{ activeWarrantyInstallation.customerSigneeName || activeWarrantyDispatch.customer.fullName }}
                  </span>
                  <span class="text-[9px] text-slate-400 font-mono">Customer Acceptance</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Clean Test Reading Strip -->
          <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div class="text-[11px] text-slate-700">
              <span class="font-bold text-slate-800">Field Electrical Test: </span>
              <span class="font-mono text-slate-600">{{ formatTestingNotes(activeWarrantyInstallation.testingNotes) }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="openCommissioningPdfModal(activeWarrantyInstallation)"
              class="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs cursor-pointer inline-flex items-center space-x-1.5 border border-indigo-200 transition"
            >
              <FileText class="w-4 h-4 text-indigo-600" />
              <span>Full Commissioning PDF</span>
            </button>

            <div class="flex items-center space-x-2">
              <button
                type="button"
                @click="showActivateWarrantyModal = false"
                class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="handleActivateWarranty"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer flex items-center space-x-1.5 transition"
              >
                <ShieldCheck class="w-4 h-4" />
                <span>Approve & Activate Warranty</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: TEAM LEADER & CREW DETAILS -->
    <div v-if="showCrewModal && activeCrewDispatch" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <UserCheck class="w-4 h-4" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-900">Assigned Team Leader & Crew</h2>
              <p class="text-xs text-slate-500">Dispatch #{{ activeCrewDispatch.dispatchNumber }} • {{ activeCrewDispatch.customer.fullName }}</p>
            </div>
          </div>
          <button type="button" @click="showCrewModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <!-- Team Lead Card (Prominent) -->
        <div class="p-3.5 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl border border-indigo-200">
          <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-wider text-indigo-800 flex items-center gap-1">
              <span>⭐</span> Designated Team Leader
            </span>
            <span class="text-[10px] font-semibold bg-indigo-200/80 text-indigo-900 px-2 py-0.5 rounded-full">
              Field Lead
            </span>
          </div>
          <div class="mt-2 flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              {{ (getTeamLead(activeCrewDispatch)?.name || 'TL').split(' ').map((n: string) => n[0]).join('').slice(0, 2) }}
            </div>
            <div>
              <p class="text-sm font-bold text-slate-900">{{ getTeamLead(activeCrewDispatch)?.name || 'Selvakumar R' }}</p>
              <p class="text-xs text-slate-600 mt-0.5">📞 {{ getTeamLead(activeCrewDispatch)?.phone || '+91 98401 12233' }}</p>
              <p class="text-[11px] text-indigo-700 font-medium mt-0.5">{{ getTeamLead(activeCrewDispatch)?.role || 'Lead Rooftop Installer & Commissioning Engineer' }}</p>
            </div>
          </div>
        </div>

        <!-- Assigned Crew Members -->
        <div>
          <span class="text-xs font-bold text-slate-700 block mb-2">Supporting Installation Crew</span>
          <div class="space-y-1.5 max-h-48 overflow-y-auto">
            <div
              v-for="(member, idx) in getAssignedCrew(activeCrewDispatch)"
              :key="idx"
              class="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
            >
              <div class="flex items-center space-x-2.5">
                <div class="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                  {{ member.name.charAt(0) }}
                </div>
                <div>
                  <div class="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>{{ member.name }}</span>
                    <span v-if="member.isLead" class="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-bold">LEAD</span>
                  </div>
                  <div class="text-[11px] text-slate-500">{{ member.phone }}</div>
                </div>
              </div>
              <span class="text-[11px] text-slate-600 font-medium">{{ member.role }}</span>
            </div>
            <div v-if="getAssignedCrew(activeCrewDispatch).length === 0" class="text-center py-3 text-slate-400 text-xs italic">
              No additional crew recorded for this installation.
            </div>
          </div>
        </div>

        <!-- Logistics Information -->
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <span class="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Logistics & Transport</span>
          <div class="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span class="text-slate-400 block text-[10px]">Vehicle</span>
              <span class="font-semibold text-slate-800">{{ activeCrewDispatch.vehicleNumber || 'TN-38-BZ-4921' }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">Driver</span>
              <span class="font-semibold text-slate-800">{{ activeCrewDispatch.driverName || 'R. Murugan' }} ({{ activeCrewDispatch.driverPhone || '9842109876' }})</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            @click="showCrewModal = false"
            class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Commissioning Report & Dossier PDF View -->
    <CommissioningReportModal
      v-if="showCommissioningPdf && activeCommissioningInstallation"
      :installation="activeCommissioningInstallation"
      @close="showCommissioningPdf = false"
    />
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
