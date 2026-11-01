<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { api } from '../api/client';
import type { Installation, SalesOrder, Technician, SerialNumber } from '../types';
import StatusBadge from '../components/ui/StatusBadge.vue';
import CameraPhotoUpload from '../components/common/CameraPhotoUpload.vue';
import { useAuthStore } from '../stores/auth';
import { Wrench, Plus, CheckCircle2, Camera, UserCheck, Play, RotateCcw, FileText, Check, MapPin, Users, Award } from 'lucide-vue-next';

const installations = ref<Installation[]>([]);
const eligibleOrders = ref<SalesOrder[]>([]);
const technicians = ref<Technician[]>([]);
const loading = ref(true);

// Modals
const showScheduleModal = ref(false);
const showCompleteModal = ref(false);
const showSiteArrivalModal = ref(false);
const siteArrivalInst = ref<Installation | null>(null);
const siteArrivalNotes = ref('Technician crew arrived on site. Dispatched components and rooftop structure inspected.');
const siteArrivalPhotoUrl = ref('https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800');

const selectedInstallation = ref<Installation | null>(null);
const photoModalInstallation = ref<Installation | null>(null);
const viewPhotosInstallation = ref<Installation | null>(null);
const installationPhotoStage = ref('STRUCTURE_MOUNTING');

// Schedule Form State
const selectedOrderId = ref('');
const scheduledDate = ref(new Date().toISOString().split('T')[0]);
const selectedTechIds = ref<number[]>([]);
const teamLeadTechId = ref<number | ''>('');
const workNotes = ref('');

// Complete Form State
const installedCapacityKw = ref('');
const panelMounting = ref(true);
const wiringConfirmed = ref(true);
const earthingConfirmed = ref(true);
const testingPassed = ref(true);
const testingNotes = ref('String open-circuit voltage Voc = 380V. Short-circuit current Isc = 11.2A. Inverter grid sync test passed.');
const customerSigneeName = ref('');
const customerAcceptanceNote = ref('Satisfied with rooftop solar mounting and inverter operation.');
const hoursWorked = ref('8.0');
const completionPhotoUrl = ref('https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800');

// Digital Signature Canvas
const signatureCanvasRef = ref<HTMLCanvasElement | null>(null);
let isDrawing = false;
const hasSignature = ref(false);

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isAdmin = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_ADMIN') || roles.includes('ROLE_DIRECTOR');
});
const isTech = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_TECHNICIAN') && !isAdmin.value;
});

const startDrawing = (e: MouseEvent | TouchEvent) => {
  const canvas = signatureCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  isDrawing = true;
  hasSignature.value = true;
  const rect = canvas.getBoundingClientRect();
  const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as MouseEvent).clientX - rect.left;
  const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as MouseEvent).clientY - rect.top;
  ctx.beginPath();
  ctx.moveTo(x, y);
};

const draw = (e: MouseEvent | TouchEvent) => {
  if (!isDrawing) return;
  const canvas = signatureCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const rect = canvas.getBoundingClientRect();
  const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as MouseEvent).clientX - rect.left;
  const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as MouseEvent).clientY - rect.top;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#0f172a';
  ctx.lineTo(x, y);
  ctx.stroke();
};

const stopDrawing = () => {
  isDrawing = false;
};

const clearSignature = () => {
  const canvas = signatureCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hasSignature.value = false;
};

const fetchInitialData = async () => {
  loading.value = true;
  try {
    const [instRes, orderRes, techRes] = await Promise.all([
      api.get('/installations'),
      api.get('/orders'),
      api.get('/technicians'),
    ]);
    installations.value = instRes.data;
    technicians.value = techRes.data;
    eligibleOrders.value = orderRes.data.filter((o: SalesOrder) =>
      ['CONFIRMED', 'DISPATCHED'].includes(o.status)
    );
    if (eligibleOrders.value.length > 0 && !selectedOrderId.value) {
      selectedOrderId.value = eligibleOrders.value[0].id.toString();
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleScheduleSubmit = async () => {
  if (!selectedOrderId.value || selectedTechIds.value.length === 0) {
    alert('Please select an order and at least one technician.');
    return;
  }
  const leadId = teamLeadTechId.value || selectedTechIds.value[0];
  const techRequests = selectedTechIds.value.map((tId) => ({
    technicianId: tId,
    isTeamLead: tId === leadId,
    roleInCrew: tId === leadId ? 'Team Lead / Electrician' : 'Installer',
  }));
  try {
    await api.post('/installations', {
      salesOrderId: parseInt(selectedOrderId.value),
      scheduledDate: scheduledDate.value,
      technicians: techRequests,
      workNotes: workNotes.value,
    });
    showScheduleModal.value = false;
    fetchInitialData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to schedule installation');
  }
};

const openSiteArrivalModal = (inst: Installation) => {
  siteArrivalInst.value = inst;
  siteArrivalNotes.value = 'Technician crew arrived on site. Dispatched components and rooftop structure inspected.';
  siteArrivalPhotoUrl.value = 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800';
  showSiteArrivalModal.value = true;
};

const handleSiteArrivalSubmit = async () => {
  if (!siteArrivalInst.value) return;
  try {
    await api.post(`/installations/${siteArrivalInst.value.id}/site-received`, {
      arrivalPhotoUrl: siteArrivalPhotoUrl.value,
      notes: siteArrivalNotes.value,
    });
    showSiteArrivalModal.value = false;
    alert(`Site arrival recorded! Status transitioned to SITE_RECEIVED.`);
    fetchInitialData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to record site arrival');
  }
};

const handleStartInstallation = async (id: number) => {
  try {
    await api.patch(`/installations/${id}/start`);
    fetchInitialData();
    alert(`Installation marked IN_PROGRESS on-site. Work timer running.`);
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to start installation');
  }
};

const openCompleteModal = (inst: Installation) => {
  selectedInstallation.value = inst;
  installedCapacityKw.value = inst.installedCapacityKw ? inst.installedCapacityKw.toString() : (inst.salesOrder.capacityKw ? inst.salesOrder.capacityKw.toString() : '5.0');
  customerSigneeName.value = inst.customer.fullName;
  completionPhotoUrl.value = 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800';
  showCompleteModal.value = true;
  setTimeout(() => {
    clearSignature();
  }, 100);
};

const handleCompleteSubmit = async () => {
  if (!selectedInstallation.value) return;
  if (!panelMounting.value || !wiringConfirmed.value || !earthingConfirmed.value) {
    alert('Validation Error: All physical safety checks (Mounting, Cabling, Earthing) must be confirmed.');
    return;
  }
  if (!testingPassed.value || !testingNotes.value.trim()) {
    alert('Validation Error: Electrical testing (Voc, Isc, inverter grid sync) must be confirmed with test notes.');
    return;
  }
  if (!customerSigneeName.value.trim()) {
    alert('Validation Error: Customer signee full name is required for sign-off.');
    return;
  }
  if (!completionPhotoUrl.value.trim()) {
    alert('Validation Error: Photo evidence of the completed rooftop installation is required.');
    return;
  }

  let signatureUrl = '';
  if (signatureCanvasRef.value && hasSignature.value) {
    signatureUrl = signatureCanvasRef.value.toDataURL('image/png');
  }

  try {
    await api.post(`/installations/${selectedInstallation.value.id}/complete`, {
      installedCapacityKw: parseFloat(installedCapacityKw.value),
      panelMountingConfirmed: panelMounting.value,
      wiringConfirmed: wiringConfirmed.value,
      earthingConfirmed: earthingConfirmed.value,
      testingPassed: testingPassed.value,
      testingNotes: testingNotes.value,
      customerSigneeName: customerSigneeName.value,
      customerSignatureUrl: signatureUrl,
      customerAcceptanceNote: customerAcceptanceNote.value,
      hoursWorked: parseFloat(hoursWorked.value),
      completionPhotoUrl: completionPhotoUrl.value,
    });
    showCompleteModal.value = false;
    fetchInitialData();
    alert('Installation marked COMPLETED! Final rooftop commissioning photos archived, warranties linked and technician hours credited.');
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to complete installation');
  }
};

const handlePhotoUploaded = async (photoUrl: string, caption: string) => {
  if (!photoModalInstallation.value) return;
  const currentInstId = photoModalInstallation.value.id;
  try {
    await api.post(`/installations/${currentInstId}/photos`, {
      photoUrl,
      stage: installationPhotoStage.value,
      caption,
    });
    photoModalInstallation.value = null;
    await fetchInitialData();
    if (viewPhotosInstallation.value && viewPhotosInstallation.value.id === currentInstId) {
      const refreshed = installations.value.find((i) => i.id === currentInstId);
      if (refreshed) viewPhotosInstallation.value = refreshed;
    }
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to attach installation photo');
  }
};

const toggleTechSelection = (id: number) => {
  if (selectedTechIds.value.includes(id)) {
    selectedTechIds.value = selectedTechIds.value.filter((t) => t !== id);
  } else {
    selectedTechIds.value.push(id);
  }
};

onMounted(() => {
  fetchInitialData();
  if (route.query.orderId) {
    selectedOrderId.value = String(route.query.orderId);
    showScheduleModal.value = true;
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Installation & Commissioning</h1>
        <p class="text-sm text-slate-500">
          Field technician crew coordination • Milestone checklist • Digital touch sign-off & photo verification
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="isAdmin || isTech"
          type="button"
          @click="showScheduleModal = true"
          class="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>Schedule Installation</span>
        </button>
      </div>
    </div>

    <!-- Installations Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">Job #</th>
              <th class="py-3 px-4">Sales Order</th>
              <th class="py-3 px-4">Customer</th>
              <th class="py-3 px-4">Scheduled Date</th>
              <th class="py-3 px-4">Assigned Crew</th>
              <th class="py-3 px-4">Testing Passed?</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="installations.length === 0">
              <td colspan="8" class="py-8 text-center text-slate-400">
                No installation jobs scheduled yet.
              </td>
            </tr>
            <tr v-for="inst in installations" :key="inst.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ inst.installationNumber }}</td>
              <td class="py-3 px-4 font-mono font-semibold text-slate-700">{{ inst.salesOrder.orderNumber }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">
                <div>{{ inst.customer.fullName }}</div>
                <div class="text-[11px] text-slate-400 font-normal">{{ inst.customer.city || inst.customer.phone }}</div>
              </td>
              <td class="py-3 px-4 whitespace-nowrap">{{ inst.scheduledDate }}</td>
              <td class="py-3 px-4">
                <div v-if="inst.assignedTechnicians && inst.assignedTechnicians.length > 0" class="flex flex-wrap gap-1">
                  <span
                    v-for="t in inst.assignedTechnicians"
                    :key="t.id"
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1',
                      t.isTeamLead ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold' : 'bg-slate-100 text-slate-700'
                    ]"
                  >
                    <span v-if="t.isTeamLead" class="text-[9px] bg-amber-500 text-white px-1 py-0.2 rounded font-bold">LEAD</span>
                    {{ t.technician.name }}
                  </span>
                </div>
                <span v-else class="text-slate-400 italic">No Crew Assigned</span>
              </td>
              <td class="py-3 px-4">
                <span v-if="inst.testingPassed" class="text-emerald-700 font-bold text-xs inline-flex items-center gap-1">
                  <Check class="w-3.5 h-3.5" /> Passed
                </span>
                <span v-else class="text-slate-400">Pending</span>
              </td>
              <td class="py-3 px-4">
                <StatusBadge :status="inst.status" />
              </td>
              <td class="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                <!-- Action: Attach Photo -->
                <button
                  v-if="isAdmin || isTech"
                  type="button"
                  @click="photoModalInstallation = inst"
                  class="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded font-semibold cursor-pointer inline-flex items-center space-x-1"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>Attach Photo</span>
                </button>

                <!-- Action: View Photos (Visible to all: Warehouse, Sales, Support, Admin) -->
                <button
                  type="button"
                  @click="viewPhotosInstallation = inst"
                  class="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium cursor-pointer inline-flex items-center space-x-1"
                >
                  <Camera class="w-3.5 h-3.5" />
                  <span>Photos ({{ inst.photos ? inst.photos.length : 0 }})</span>
                </button>

                <!-- Action: Site Arrival (SCHEDULED -> SITE_RECEIVED) -->
                <button
                  v-if="inst.status === 'SCHEDULED' && (isAdmin || isTech)"
                  type="button"
                  @click="openSiteArrivalModal(inst)"
                  class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold cursor-pointer inline-flex items-center space-x-1"
                >
                  <MapPin class="w-3.5 h-3.5" />
                  <span>Site Arrival</span>
                </button>

                <!-- Action: Start Work (SITE_RECEIVED or SCHEDULED -> IN_PROGRESS) -->
                <button
                  v-if="(inst.status === 'SITE_RECEIVED' || inst.status === 'SCHEDULED') && (isAdmin || isTech)"
                  type="button"
                  @click="handleStartInstallation(inst.id)"
                  class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold cursor-pointer inline-flex items-center space-x-1"
                >
                  <Play class="w-3.5 h-3.5" />
                  <span>Start Work</span>
                </button>

                <!-- Action: Sign-Off & Complete -->
                <button
                  v-if="inst.status === 'IN_PROGRESS' && (isAdmin || isTech)"
                  type="button"
                  @click="openCompleteModal(inst)"
                  class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold cursor-pointer inline-flex items-center space-x-1"
                >
                  <CheckCircle2 class="w-3.5 h-3.5" />
                  <span>Sign-Off & Complete</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Schedule Installation -->
    <div v-if="showScheduleModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h2 class="text-lg font-bold text-slate-900">Schedule Installation Job</h2>
          <button type="button" @click="showScheduleModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="handleScheduleSubmit" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Select Order *</label>
            <select
              required
              v-model="selectedOrderId"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">-- Choose Sales Order --</option>
              <option v-for="o in eligibleOrders" :key="o.id" :value="o.id">
                {{ o.orderNumber }} - {{ o.customer.fullName }} ({{ o.capacityKw }} kW)
              </option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Scheduled Date *</label>
            <input
              type="date"
              required
              v-model="scheduledDate"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Assign Technician Crew Members *</label>
            <div class="grid grid-cols-2 gap-2 border border-slate-200 p-2.5 rounded-xl max-h-36 overflow-y-auto">
              <label
                v-for="t in technicians"
                :key="t.id"
                class="flex items-center space-x-2 text-slate-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  :checked="selectedTechIds.includes(t.id)"
                  @change="toggleTechSelection(t.id)"
                  class="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>{{ t.name }}</span>
              </label>
            </div>
          </div>

          <div v-if="selectedTechIds.length > 0" class="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
            <label class="block font-semibold text-indigo-950">
              ⭐ Select Team Lead Technician *
            </label>
            <select
              v-model="teamLeadTechId"
              class="w-full px-3 py-1.5 border border-indigo-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">-- Choose Team Lead --</option>
              <option v-for="tId in selectedTechIds" :key="tId" :value="tId">
                ⭐ {{ technicians.find(t => t.id === tId)?.name }} (Lead Electrician)
              </option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Work Instructions</label>
            <textarea
              rows="2"
              v-model="workNotes"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. Roof safety harnesses required; battery rack to be mounted in electrical room."
            ></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="showScheduleModal = false"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs cursor-pointer"
            >
              Schedule Job
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Complete Installation & Digital Touch Sign-off -->
    <div v-if="showCompleteModal && selectedInstallation" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Installation Sign-Off & Commissioning</h2>
            <p class="text-xs text-slate-500">Order: {{ selectedInstallation.salesOrder.orderNumber }} • Customer: {{ selectedInstallation.customer.fullName }}</p>
          </div>
          <button type="button" @click="showCompleteModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="handleCompleteSubmit" class="space-y-4 text-xs">
          <!-- Quality Checklist -->
          <div class="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span class="font-bold text-slate-800 block text-[11px] uppercase tracking-wider mb-1">
              Field Quality & Electrical Safety Checklist (All Required) *
            </span>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" v-model="panelMounting" class="rounded text-emerald-600" />
              <span class="font-medium text-slate-800">Panel Mounting Frames securely anchored with zero roof leaks</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" v-model="wiringConfirmed" class="rounded text-emerald-600" />
              <span class="font-medium text-slate-800">DC & AC Cabling routed through UV-resistant PVC conduits with MC4 connectors</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" v-model="earthingConfirmed" class="rounded text-emerald-600" />
              <span class="font-medium text-slate-800">Dual Earthing Pit resistance verified (< 2 Ohms) & Lightning Arrester connected</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" v-model="testingPassed" class="rounded text-emerald-600" />
              <span class="font-medium text-slate-800">Inverter grid-synchronization and peak generation testing PASSED</span>
            </label>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Installed Capacity (kW) *</label>
              <input type="number" step="0.1" required v-model="installedCapacityKw" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Crew Hours Worked *</label>
              <input type="number" step="0.5" required v-model="hoursWorked" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Grid Commissioning & Generation Testing Notes *</label>
            <input type="text" required v-model="testingNotes" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Customer Signee Full Name *</label>
            <input type="text" required v-model="customerSigneeName" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>

          <!-- Completed Rooftop Photo Evidence -->
          <div>
            <label class="block font-semibold text-slate-700 mb-1">
              📸 Completed Rooftop Solar Photo / Evidence (Required) *
            </label>
            <input
              type="url"
              required
              v-model="completionPhotoUrl"
              placeholder="https://... URL of completed commissioned rooftop setup"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <div class="mt-1 flex items-center justify-between">
              <span class="text-[10px] text-slate-400">Must show all installed panels & cabling</span>
              <button
                type="button"
                @click="completionPhotoUrl = 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800'"
                class="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
              >
                Use sample photo
              </button>
            </div>
          </div>

          <!-- Touch / Mouse Signature Canvas -->
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="font-semibold text-slate-700">Customer Digital Sign-Off Canvas *</label>
              <button
                type="button"
                @click="clearSignature"
                class="text-[11px] text-rose-600 hover:text-rose-800 cursor-pointer font-medium"
              >
                Clear Signature
              </button>
            </div>
            <div class="border border-slate-300 rounded-xl overflow-hidden bg-slate-50 touch-none">
              <canvas
                ref="signatureCanvasRef"
                width="500"
                height="120"
                class="w-full h-28 bg-white cursor-crosshair"
                @mousedown="startDrawing"
                @mousemove="draw"
                @mouseup="stopDrawing"
                @mouseleave="stopDrawing"
                @touchstart.prevent="startDrawing"
                @touchmove.prevent="draw"
                @touchend.prevent="stopDrawing"
              ></canvas>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="showCompleteModal = false"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs cursor-pointer"
            >
              Submit Formal Commissioning
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Site Arrival Confirmation -->
    <div v-if="showSiteArrivalModal && siteArrivalInst" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin class="w-5 h-5 text-indigo-600" />
              Confirm Site Arrival: {{ siteArrivalInst.installationNumber }}
            </h2>
            <p class="text-xs text-slate-500">
              Customer: {{ siteArrivalInst.customer.fullName }} • {{ siteArrivalInst.customer.address }}
            </p>
          </div>
          <button type="button" @click="showSiteArrivalModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="handleSiteArrivalSubmit" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Site Arrival Notes / Preliminary Inspection *</label>
            <textarea
              rows="3"
              required
              v-model="siteArrivalNotes"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            ></textarea>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Arrival Photo Evidence URL *</label>
            <input
              type="url"
              required
              v-model="siteArrivalPhotoUrl"
              placeholder="https://... photo of team/truck at site"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <div class="mt-1 flex items-center justify-between">
              <span class="text-[10px] text-slate-400">Verifies crew arrival at customer rooftop</span>
              <button
                type="button"
                @click="siteArrivalPhotoUrl = 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800'"
                class="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
              >
                Use sample arrival photo
              </button>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="showSiteArrivalModal = false"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center space-x-1.5"
            >
              <Check class="w-4 h-4" />
              <span>Confirm Site Arrival</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: View Installation Photos -->
    <div v-if="viewPhotosInstallation" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center space-x-2">
              <Camera class="w-5 h-5 text-emerald-600" />
              <h2 class="text-lg font-bold text-slate-900">Installation Photographic Evidence</h2>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Installation #{{ viewPhotosInstallation.id }} • Customer: <span class="font-semibold text-slate-700">{{ viewPhotosInstallation.customer?.fullName }}</span> • Capacity: <span class="font-semibold text-slate-700">{{ viewPhotosInstallation.salesOrder?.capacityKw || viewPhotosInstallation.installedCapacityKw || 5 }} kW</span>
            </p>
          </div>
          <button type="button" @click="viewPhotosInstallation = null" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <div v-if="!viewPhotosInstallation.photos || viewPhotosInstallation.photos.length === 0" class="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Camera class="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p class="text-xs font-semibold text-slate-600">No installation photographs attached yet</p>
          <p class="text-[11px] text-slate-400 mt-1">Technicians will submit structural mounting and inverter cabling photos during on-site execution.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div v-for="p in viewPhotosInstallation.photos" :key="p.id" class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-2xs hover:shadow-md transition">
            <a :href="p.photoUrl" target="_blank" rel="noopener noreferrer" class="block group relative">
              <img :src="p.photoUrl" :alt="p.caption || 'Installation photo'" class="w-full h-36 object-cover group-hover:opacity-95 transition" />
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs font-medium">
                Click to view
              </div>
            </a>
            <div class="p-2.5">
              <span class="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px] uppercase block w-fit mb-1">{{ p.stage }}</span>
              <p class="text-xs text-slate-700 line-clamp-2">{{ p.caption || 'Field installation evidence' }}</p>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <button
              v-if="isAdmin || isTech"
              type="button"
              @click="photoModalInstallation = viewPhotosInstallation"
              class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Attach Another Photo</span>
            </button>
          </div>
          <button
            type="button"
            @click="viewPhotosInstallation = null"
            class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Live Camera Photo Upload -->
    <CameraPhotoUpload
      v-if="photoModalInstallation"
      title="Attach Installation Milestone Photograph"
      subtitle="Take photo using camera or choose image file from device"
      caption-placeholder="e.g. Structure anchor bolts or inverter terminal wiring"
      :allowed-stages="['STRUCTURE_MOUNTING', 'PANEL_INSTALLATION', 'INVERTER_WIRING', 'TESTING_COMMISSIONING']"
      :selected-stage="installationPhotoStage"
      @stage-change="(s) => installationPhotoStage = s"
      @photo-uploaded="handlePhotoUploaded"
      @close="photoModalInstallation = null"
    />
  </div>
</template>
