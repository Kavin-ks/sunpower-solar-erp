<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '../api/client';
import StatusBadge from '../components/ui/StatusBadge.vue';
import CameraPhotoUpload from '../components/common/CameraPhotoUpload.vue';
import { useAuthStore } from '../stores/auth';
import { formatFaultCode } from '../utils/faultCatalog';
import {
  Wrench,
  Search,
  CheckCircle2,
  Clock,
  Play,
  Camera,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Package,
  Plus,
  Trash2,
  Phone,
  MapPin,
  Info
} from 'lucide-vue-next';

interface PartItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

const authStore = useAuthStore();
const jobs = ref<any[]>([]);
const products = ref<any[]>([]);
const loading = ref(true);
const searchTerm = ref('');
const statusFilter = ref('ALL');

// Modals
const selectedJob = ref<any | null>(null);
const isCompleteModalOpen = ref(false);

// Complete Job Form
const completeForm = ref({
  diagnosisNotes: '',
  resolutionNotes: '',
  testingResults: 'Solar string inverter synchronized with grid. Verified generation at 4.6 kW under full irradiance. No earth leakage detected.',
  beforePhotoUrl: '',
  afterPhotoUrl: '',
  laborCharges: 0,
  replacedParts: [] as PartItem[],
});

const selectedPartId = ref('');
const selectedPartQty = ref(1);

const fetchJobs = async () => {
  try {
    loading.value = true;
    const res = await api.get('/service-tickets/my-assigned');
    jobs.value = res.data;
  } catch (err) {
    console.error('Failed to load assigned service jobs', err);
  } finally {
    loading.value = false;
  }
};

const fetchProducts = async () => {
  try {
    const res = await api.get('/products');
    products.value = res.data;
  } catch (err) {
    console.error('Failed to load products', err);
  }
};

const handleStartWork = async (job: any) => {
  try {
    const res = await api.post(`/service-tickets/${job.id}/start-work`);
    alert(`Work started for ticket ${job.ticketNumber}. Status changed to IN_PROGRESS.`);
    await fetchJobs();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to start work on ticket');
  }
};

const openCompleteModal = (job: any) => {
  selectedJob.value = job;
  completeForm.value = {
    diagnosisNotes: job.diagnosisNotes || '',
    resolutionNotes: job.resolutionNotes || '',
    testingResults: job.testingResults || 'Solar string inverter synchronized with grid. Verified generation at 4.6 kW. No ground fault detected.',
    beforePhotoUrl: job.beforePhotoUrl || job.complaintPhotoUrl || '',
    afterPhotoUrl: job.afterPhotoUrl || '',
    laborCharges: job.underWarranty ? 0 : 500,
    replacedParts: [],
  };
  isCompleteModalOpen.value = true;
};

const addPart = () => {
  if (!selectedPartId.value) return;
  const prod = products.value.find((p) => p.id === Number(selectedPartId.value));
  if (!prod) return;

  completeForm.value.replacedParts.push({
    productId: prod.id,
    productName: prod.name,
    quantity: selectedPartQty.value,
    unitPrice: selectedJob.value?.underWarranty ? 0 : (prod.sellingPrice || 0),
  });

  selectedPartId.value = '';
  selectedPartQty.value = 1;
};

const removePart = (idx: number) => {
  completeForm.value.replacedParts.splice(idx, 1);
};

const handleCompleteSubmit = async () => {
  if (!selectedJob.value) return;
  if (!completeForm.value.diagnosisNotes.trim() || !completeForm.value.resolutionNotes.trim()) {
    alert('Please enter both diagnosis and resolution notes.');
    return;
  }

  try {
    const payload = {
      diagnosisNotes: completeForm.value.diagnosisNotes,
      resolutionNotes: completeForm.value.resolutionNotes,
      testingResults: completeForm.value.testingResults,
      beforePhotoUrl: completeForm.value.beforePhotoUrl,
      afterPhotoUrl: completeForm.value.afterPhotoUrl,
      laborCharges: completeForm.value.laborCharges,
      replacedParts: completeForm.value.replacedParts.map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
      })),
    };

    await api.post(`/service-tickets/${selectedJob.value.id}/technician-complete`, payload);
    isCompleteModalOpen.value = false;
    selectedJob.value = null;
    alert('Service job marked as TECHNICIAN_COMPLETED! Support department has been notified for customer sign-off.');
    await fetchJobs();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to submit technician completion');
  }
};

const filteredJobs = computed(() => {
  return jobs.value.filter((j) => {
    const matchesSearch =
      searchTerm.value === '' ||
      j.ticketNumber?.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      j.customer?.fullName?.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      j.serialNumber?.serialCode?.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      j.faultCode?.toLowerCase().includes(searchTerm.value.toLowerCase());

    const matchesStatus =
      statusFilter.value === 'ALL' || j.status === statusFilter.value;

    return matchesSearch && matchesStatus;
  });
});

onMounted(() => {
  fetchJobs();
  fetchProducts();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">My Assigned Service Jobs</h1>
        <p class="text-sm text-slate-500">
          Field technician service queue • Diagnostic troubleshooting • Part replacement & generation testing
        </p>
      </div>

      <div class="flex items-center space-x-2">
        <span class="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-200">
          Field Technician: {{ authStore.user?.fullName }}
        </span>
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          v-model="searchTerm"
          placeholder="Search ticket #, customer name, serial number, fault code..."
          class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <select
        v-model="statusFilter"
        class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
      >
        <option value="ALL">All Assigned Jobs</option>
        <option value="ASSIGNED">Assigned (Ready to Start)</option>
        <option value="IN_PROGRESS">In Progress On-Site</option>
        <option value="RESOLVED">Technician Completed</option>
        <option value="CLOSED">Closed & Verified</option>
      </select>
    </div>

    <!-- Jobs List / Cards -->
    <div v-if="loading" class="text-center py-12 text-slate-400 text-xs">
      Loading assigned service jobs...
    </div>

    <div v-else-if="filteredJobs.length === 0" class="bg-white rounded-2xl border border-slate-200 p-12 text-center">
      <Wrench class="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <h3 class="text-sm font-bold text-slate-700">No Service Jobs Found</h3>
      <p class="text-xs text-slate-400 mt-1">There are currently no active repair visits assigned matching your filter.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="job in filteredJobs"
        :key="job.id"
        class="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition p-5 space-y-4"
      >
        <div class="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-mono font-bold text-sm text-slate-900">{{ job.ticketNumber }}</span>
              <StatusBadge :status="job.status" />
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5">Reported: {{ job.reportedDate }} • Source: {{ job.submissionSource || 'Portal' }}</p>
          </div>
          <div class="text-right">
            <div
              v-if="job.underWarranty"
              class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"
            >
              ✓ Active Warranty (₹0 Customer Charge)
            </div>
            <div v-else class="text-right">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200"
              >
                Out of Warranty
              </span>
              <div class="text-[10px] font-bold text-slate-700 mt-0.5">
                <span v-if="job.totalCustomerCharges > 0">₹{{ job.totalCustomerCharges }} (Chargeable)</span>
                <span v-else-if="job.chargeStatusText" class="text-purple-700">{{ job.chargeStatusText }}</span>
                <span v-else class="text-amber-700">Pending Verification</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Customer & Location Info -->
        <div class="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div>
            <span class="text-slate-400 block text-[10px]">Customer</span>
            <span class="font-bold text-slate-800">{{ job.customer?.fullName }}</span>
            <span class="text-slate-500 block text-[11px] flex items-center space-x-1 mt-0.5">
              <Phone class="w-3 h-3 text-slate-400" />
              <span>{{ job.customer?.phone }}</span>
            </span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">Equipment & Serial</span>
            <span class="font-bold text-slate-800">{{ job.serialNumber?.product?.name || 'Solar Equipment' }}</span>
            <span class="font-mono text-slate-600 block text-[11px] mt-0.5">{{ job.serialNumber?.serialCode || 'N/A' }}</span>
          </div>
        </div>

        <!-- Fault & Description -->
        <div class="text-xs space-y-1">
          <div class="flex items-center space-x-2">
            <AlertTriangle class="w-3.5 h-3.5 text-amber-500" />
            <span class="font-bold text-slate-800">{{ formatFaultCode(job.faultCode) }}</span>
          </div>
          <p class="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
            {{ job.complaintDescription }}
          </p>
        </div>

        <!-- Photos if uploaded by customer -->
        <div v-if="job.complaintPhotoUrl" class="text-xs">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Customer Problem Photo</span>
          <img :src="job.complaintPhotoUrl" alt="Complaint photo" class="w-32 h-24 object-cover rounded-lg border border-slate-200" />
        </div>

        <!-- Technician Actions -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div class="text-[11px] text-slate-500">
            <span v-if="job.status === 'ASSIGNED'">Click Start Work upon arrival on site</span>
            <span v-else-if="job.status === 'IN_PROGRESS'" class="text-amber-600 font-semibold">Active On-Site Repair</span>
            <span v-else-if="job.status === 'RESOLVED'" class="text-emerald-700 font-semibold">✓ Completed - Awaiting Sign-off</span>
            <span v-else-if="job.status === 'CLOSED'" class="text-slate-400">Archived & Confirmed</span>
          </div>

          <div class="flex space-x-2">
            <!-- Step 1: Start Work -->
            <button
              v-if="job.status === 'ASSIGNED'"
              type="button"
              @click="handleStartWork(job)"
              class="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <Play class="w-3.5 h-3.5" />
              <span>Start Work (On-Site)</span>
            </button>

            <!-- Step 2: Complete Work -->
            <button
              v-if="job.status === 'IN_PROGRESS'"
              type="button"
              @click="openCompleteModal(job)"
              class="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <CheckCircle2 class="w-3.5 h-3.5" />
              <span>Submit Repair & Testing</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Technician Job Completion (Workflow 8 to 14) -->
    <div v-if="isCompleteModalOpen && selectedJob" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Record Repair & Submit Completion</h2>
            <p class="text-xs text-slate-500">Ticket: {{ selectedJob.ticketNumber }} • Customer: {{ selectedJob.customer?.fullName }}</p>
          </div>
          <button type="button" @click="isCompleteModalOpen = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="handleCompleteSubmit" class="space-y-4 text-xs">
          <!-- Step 8: Diagnosis -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">Diagnosis Performed *</label>
            <textarea
              rows="2"
              required
              v-model="completeForm.diagnosisNotes"
              placeholder="e.g. Inverter internal IGBT driver module failed due to transient voltage surge on grid phase L2."
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            ></textarea>
          </div>

          <!-- Step 9: Repair Performed -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">Repair Performed & Corrective Action *</label>
            <textarea
              rows="2"
              required
              v-model="completeForm.resolutionNotes"
              placeholder="e.g. Replaced surge protector device, flashed inverter firmware to v3.14, re-terminated solar DC array inputs."
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            ></textarea>
          </div>

          <!-- Step 10: Replaced Parts from Inventory -->
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <label class="block font-bold text-slate-700">Replaced Parts & Serial Tracking</label>
            <div class="flex gap-2">
              <select
                v-model="selectedPartId"
                class="flex-1 px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">-- Select Replacement Part / Module --</option>
                <option v-for="p in products" :key="p.id" :value="p.id">
                  {{ p.name }} (Available: {{ p.currentStock }})
                </option>
              </select>
              <input
                type="number"
                min="1"
                v-model="selectedPartQty"
                class="w-16 px-2 py-2 border border-slate-200 bg-white rounded-lg text-xs text-center"
              />
              <button
                type="button"
                @click="addPart"
                class="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Add Part
              </button>
            </div>

            <div v-if="completeForm.replacedParts.length > 0" class="divide-y divide-slate-200 bg-white rounded-lg border border-slate-200">
              <div v-for="(p, idx) in completeForm.replacedParts" :key="idx" class="p-2 flex justify-between items-center text-xs">
                <div>
                  <span class="font-semibold text-slate-800">{{ p.productName }}</span>
                  <span class="text-slate-400 ml-2">Qty: {{ p.quantity }}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span :class="selectedJob.underWarranty ? 'text-emerald-700 font-bold' : 'text-slate-900 font-bold'">
                    {{ selectedJob.underWarranty ? '₹0 (Covered by Warranty)' : `₹${p.unitPrice * p.quantity}` }}
                  </span>
                  <button type="button" @click="removePart(idx)" class="text-rose-600 hover:text-rose-800 cursor-pointer">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 11: Before & After Photos -->
          <div class="space-y-3">
            <label class="block font-bold text-slate-700">Upload Before & After Repair Evidence</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <CameraPhotoUpload
                  label="Before Repair Photo"
                  :existingUrl="completeForm.beforePhotoUrl"
                  @photoCaptured="(url) => completeForm.beforePhotoUrl = url"
                />
              </div>
              <div>
                <CameraPhotoUpload
                  label="After Repair & Generation Photo"
                  :existingUrl="completeForm.afterPhotoUrl"
                  @photoCaptured="(url) => completeForm.afterPhotoUrl = url"
                />
              </div>
            </div>
          </div>

          <!-- Step 12: Testing Results -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">Testing & Restoration Results *</label>
            <input
              type="text"
              required
              v-model="completeForm.testingResults"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <!-- Labor Charges if out of warranty -->
          <div v-if="!selectedJob.underWarranty" class="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs">
            <label class="block font-bold text-amber-900 mb-1">Labour Charges (Out of Warranty)</label>
            <input
              type="number"
              min="0"
              v-model="completeForm.laborCharges"
              class="w-full px-3 py-2 border border-amber-300 bg-white rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
            />
            <p class="text-[10px] text-amber-700 mt-1">This amount will be billed to the customer on a service repair invoice.</p>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="isCompleteModalOpen = false"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs cursor-pointer"
            >
              Submit TECHNICIAN_COMPLETED
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
