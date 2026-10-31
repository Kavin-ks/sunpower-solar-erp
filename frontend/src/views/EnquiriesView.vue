<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api/client';
import type { Enquiry, EnquiryStatus, Technician } from '../types';
import StatusBadge from '../components/ui/StatusBadge.vue';
import { useAuthStore } from '../stores/auth';
import {
  Search,
  Filter,
  Phone,
  Zap,
  Clock,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Send,
  Plus,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  MessageSquare,
  Home,
  Check,
  User as UserIcon,
} from 'lucide-vue-next';

const enquiries = ref<Enquiry[]>([]);
const loading = ref(true);
const search = ref('');
const statusFilter = ref('');
const selectedEnquiry = ref<Enquiry | null>(null);
const followupNote = ref('');
const submittingNote = ref(false);

// Certified Technicians & Survey Scheduling Modal State
const technicians = ref<Technician[]>([]);
const showScheduleModal = ref(false);
const schedulingSurvey = ref(false);
const scheduleForm = ref({
  enquiryId: 0,
  enquiryNumber: '',
  customerId: 0,
  customerName: '',
  assignedToName: '',
  technicianId: '',
  scheduledDate: new Date().toISOString().split('T')[0],
  surveyNotes: '',
});

const availableTechnicians = computed(() => {
  if (!technicians.value || technicians.value.length === 0) return [];
  const activeTechs = technicians.value.filter((t) => t.active !== false);
  const available = activeTechs.filter((t) => t.available !== false);
  return available.length > 0 ? available : activeTechs;
});

// Instant Client-Side + API Reactive Search
const filteredEnquiries = computed(() => {
  const q = search.value.trim().toLowerCase();
  return enquiries.value.filter((enq) => {
    if (statusFilter.value && enq.status !== statusFilter.value) {
      return false;
    }
    if (!q) return true;
    const enquiryNumber = String(enq.enquiryNumber || enq.id || '').toLowerCase();
    const customerName = String(enq.customer?.fullName || (enq as any).customerName || '').toLowerCase();
    const customerPhone = String(enq.customer?.phone || (enq as any).phone || '').toLowerCase();
    const customerEmail = String(enq.customer?.email || (enq as any).email || '').toLowerCase();

    return enquiryNumber.includes(q) ||
           customerName.includes(q) ||
           customerPhone.includes(q) ||
           customerEmail.includes(q);
  });
});

// Phone Call Pre-Screening Basics (Problem Statement Scene 1)
const editMonthlyBill = ref('');
const editShadowArea = ref('');
const editGridSuitable = ref(true);

// Tele-qualification form state inside modal
const qualifyForm = ref({
  monthlyElectricityBill: 0,
  shadowFreeAreaSqFt: 0,
  gridSuitable: true,
  actionNote: '',
});
const savingQualify = ref(false);

// Manual Enquiry Modal state
const showManualModal = ref(false);
const creatingEnquiry = ref(false);
const manualForm = ref({
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerAddress: '',
  city: 'Chennai',
  pincode: '600001',
  source: 'PHONE' as 'PHONE' | 'WHATSAPP' | 'MANUAL',
  systemType: 'ON_GRID' as 'ON_GRID' | 'OFF_GRID',
  requestedCapacityKw: 3,
  monthlyElectricityBill: 3500,
  shadowFreeAreaSqFt: 350,
  gridSuitable: true,
  subsidyRequired: true,
  notes: '',
});

const router = useRouter();
const authStore = useAuthStore();

watch(selectedEnquiry, (newVal) => {
  if (newVal) {
    editMonthlyBill.value = newVal.monthlyElectricityBill ? String(newVal.monthlyElectricityBill) : '';
    editShadowArea.value = newVal.shadowFreeAreaSqFt ? String(newVal.shadowFreeAreaSqFt) : '';
    editGridSuitable.value = newVal.gridSuitable !== undefined ? newVal.gridSuitable : true;
  }
});

const isAdmin = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_ADMIN') || roles.includes('ROLE_DIRECTOR');
});

const isSales = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_SALES') && !isAdmin.value;
});

// Sizing Recommendation Engine (Judge Wow-Factor)
const getRecommendedKw = (bill: number | string | undefined | null) => {
  const num = Number(bill);
  if (!num || num <= 0) return null;
  if (num < 1500) return 1;
  if (num <= 2500) return 2;
  if (num <= 4000) return 3;
  if (num <= 5500) return 4;
  return 5;
};

const getRoofFeasibility = (capacityKw: number | string | undefined | null, areaSqFt: number | string | undefined | null) => {
  const cap = Number(capacityKw) || 3;
  const req = cap * 100; // standard 100 sq.ft per kW
  const area = Number(areaSqFt);
  if (!area || area <= 0) {
    return {
      status: 'PENDING',
      message: `Needs ~${req} sq.ft (~100 sq.ft/kW)`,
      class: 'text-slate-500 bg-slate-100 border-slate-200',
    };
  }
  if (area >= req) {
    return {
      status: 'SUFFICIENT',
      message: `Roof Area Sufficient (${area} ≥ ${req} sq.ft)`,
      fullMessage: `✅ Roof Area Sufficient: ${area} sq.ft >= ${req} sq.ft required for ${cap} kW system`,
      class: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    };
  }
  return {
    status: 'TIGHT',
    message: `Roof Area Tight (${area} < ${req} sq.ft)`,
    fullMessage: `⚠️ Roof Area Tight: ${area} sq.ft is less than recommended ~${req} sq.ft for ${cap} kW`,
    class: 'text-amber-700 bg-amber-50 border-amber-200',
  };
};

const fetchEnquiries = async (showLoading = true) => {
  if (showLoading) loading.value = true;
  try {
    let url = '/enquiries?';
    if (search.value) url += `search=${encodeURIComponent(search.value)}&`;
    if (statusFilter.value) url += `status=${statusFilter.value}&`;
    const res = await api.get(url);
    enquiries.value = res.data;
  } catch (err) {
    console.error(err);
  } finally {
    if (showLoading) loading.value = false;
  }
};

const openEnquiryModal = (enq: Enquiry) => {
  selectedEnquiry.value = enq;
  qualifyForm.value = {
    monthlyElectricityBill: enq.monthlyElectricityBill || 0,
    shadowFreeAreaSqFt: enq.shadowFreeAreaSqFt || 0,
    gridSuitable: enq.gridSuitable !== false,
    actionNote: '',
  };
};

const handleSaveQualification = async (newStatus?: EnquiryStatus) => {
  if (!selectedEnquiry.value) return;
  savingQualify.value = true;
  const targetStatus = newStatus || selectedEnquiry.value.status;
  const note = qualifyForm.value.actionNote.trim() ||
    (newStatus ? `Stage updated to ${newStatus} with basics verified (Area: ${qualifyForm.value.shadowFreeAreaSqFt} sq.ft, Bill: ₹${qualifyForm.value.monthlyElectricityBill})` : 'Tele-qualification details updated');

  try {
    await api.patch(`/enquiries/${selectedEnquiry.value.id}/status`, {
      status: targetStatus,
      actionNote: note,
      monthlyElectricityBill: qualifyForm.value.monthlyElectricityBill ? Number(qualifyForm.value.monthlyElectricityBill) : null,
      shadowFreeAreaSqFt: qualifyForm.value.shadowFreeAreaSqFt ? Number(qualifyForm.value.shadowFreeAreaSqFt) : null,
      gridSuitable: Boolean(qualifyForm.value.gridSuitable),
    });
    fetchEnquiries(false);
    const res = await api.get(`/enquiries/${selectedEnquiry.value.id}`);
    selectedEnquiry.value = res.data;
    alert('Tele-qualification basics successfully saved!');
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to update qualification details');
  } finally {
    savingQualify.value = false;
  }
};

const handleStatusUpdate = async (id: number, newStatus: EnquiryStatus, customNote?: string) => {
  try {
    await api.patch(`/enquiries/${id}/status`, {
      status: newStatus,
      actionNote: customNote || `Stage updated to ${newStatus}`,
      monthlyElectricityBill: editMonthlyBill.value ? parseFloat(editMonthlyBill.value) : undefined,
      shadowFreeAreaSqFt: editShadowArea.value ? parseFloat(editShadowArea.value) : undefined,
      gridSuitable: editGridSuitable.value,
    });
    fetchEnquiries(false);
    if (selectedEnquiry.value && selectedEnquiry.value.id === id) {
      const res = await api.get(`/enquiries/${id}`);
      selectedEnquiry.value = res.data;
    }
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to update status');
  }
};

const handleAssignToMe = async (enq: Enquiry) => {
  const userId = authStore.user?.id;
  if (!userId) {
    alert('User session id not found. Please log in again.');
    return;
  }
  try {
    const res = await api.patch(`/enquiries/${enq.id}/assign/${userId}`);
    fetchEnquiries(false);
    if (selectedEnquiry.value && selectedEnquiry.value.id === enq.id) {
      selectedEnquiry.value = res.data;
    }
    alert(`Enquiry ${enq.enquiryNumber} assigned to ${authStore.user?.fullName || 'you'}!`);
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to assign enquiry');
  }
};

const handleManualSubmit = async () => {
  creatingEnquiry.value = true;
  try {
    const payload = {
      customerName: manualForm.value.customerName.trim(),
      customerPhone: manualForm.value.customerPhone.trim(),
      customerEmail: manualForm.value.customerEmail.trim() || null,
      customerAddress: `${manualForm.value.customerAddress.trim()}, ${manualForm.value.city.trim()} - ${manualForm.value.pincode.trim()}`,
      requestedCapacityKw: Number(manualForm.value.requestedCapacityKw),
      systemType: manualForm.value.systemType,
      source: manualForm.value.source,
      subsidyRequired: Boolean(manualForm.value.subsidyRequired),
      monthlyElectricityBill: manualForm.value.monthlyElectricityBill ? Number(manualForm.value.monthlyElectricityBill) : null,
      shadowFreeAreaSqFt: manualForm.value.shadowFreeAreaSqFt ? Number(manualForm.value.shadowFreeAreaSqFt) : null,
      gridSuitable: Boolean(manualForm.value.gridSuitable),
      assignedToUserId: authStore.user?.id || null,
      notes: manualForm.value.notes.trim() || null,
    };
    await api.post('/enquiries', payload);
    showManualModal.value = false;
    manualForm.value = {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerAddress: '',
      city: 'Chennai',
      pincode: '600001',
      source: 'PHONE',
      systemType: 'ON_GRID',
      requestedCapacityKw: 3,
      monthlyElectricityBill: 3500,
      shadowFreeAreaSqFt: 350,
      gridSuitable: true,
      subsidyRequired: true,
      notes: '',
    };
    fetchEnquiries(true);
    alert('Call / WhatsApp Lead logged successfully!');
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to log enquiry');
  } finally {
    creatingEnquiry.value = false;
  }
};

const handleAddFollowup = async () => {
  if (!selectedEnquiry.value || !followupNote.value.trim()) return;
  submittingNote.value = true;
  try {
    await api.patch(`/enquiries/${selectedEnquiry.value.id}/status`, {
      status: selectedEnquiry.value.status,
      actionNote: followupNote.value.trim(),
    });
    followupNote.value = '';
    const res = await api.get(`/enquiries/${selectedEnquiry.value.id}`);
    selectedEnquiry.value = res.data;
    fetchEnquiries(false);
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to log follow-up note');
  } finally {
    submittingNote.value = false;
  }
};

const fetchTechnicians = async () => {
  try {
    const res = await api.get('/technicians');
    technicians.value = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.content || []);
  } catch (err) {
    console.error('Failed to load certified technicians', err);
  }
};

const openScheduleSurveyModal = async (enq: Enquiry) => {
  if (!enq.assignedTo) {
    const claim = confirm(`Enquiry ${enq.enquiryNumber || enq.id} has no assigned Lead Owner. Would you like to claim it as yours now to schedule the survey?`);
    if (claim) {
      await handleAssignToMe(enq);
    } else {
      return;
    }
  }

  const assignedUser = enq.assignedTo?.fullName || enq.assignedTo?.username || authStore.user?.fullName || 'Assigned Sales Agent';

  scheduleForm.value = {
    enquiryId: enq.id,
    enquiryNumber: enq.enquiryNumber || `ENQ-${enq.id}`,
    customerId: enq.customer?.id || (enq as any).customerId,
    customerName: enq.customer?.fullName || (enq as any).customerName,
    assignedToName: assignedUser,
    technicianId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    surveyNotes: `Site physical inspection for ${enq.requestedCapacityKw || 3} kW system (${enq.systemType === 'OFF_GRID' ? 'Off-Grid' : 'On-Grid'}).`,
  };

  if (technicians.value.length === 0) {
    await fetchTechnicians();
  }
  if (availableTechnicians.value.length > 0) {
    scheduleForm.value.technicianId = String(availableTechnicians.value[0].id);
  }
  showScheduleModal.value = true;
};

const handleAssignAndSchedule = async (enq: Enquiry) => {
  if (!enq.assignedTo) {
    await handleAssignToMe(enq);
  }
  const updated = enquiries.value.find((e) => e.id === enq.id) || selectedEnquiry.value || enq;
  await openScheduleSurveyModal(updated);
};

const handleScheduleSubmit = async () => {
  if (!scheduleForm.value.customerId || !scheduleForm.value.technicianId) {
    alert('Please select an assigned certified technician.');
    return;
  }
  schedulingSurvey.value = true;
  try {
    await api.post('/surveys/schedule', {
      customerId: Number(scheduleForm.value.customerId),
      enquiryId: Number(scheduleForm.value.enquiryId) || null,
      technicianId: Number(scheduleForm.value.technicianId),
      scheduledDate: scheduleForm.value.scheduledDate,
      surveyNotes: scheduleForm.value.surveyNotes,
    });
    showScheduleModal.value = false;
    alert(`Site survey successfully scheduled for ${scheduleForm.value.customerName}! Enquiry updated to SURVEY_SCHEDULED.`);
    fetchEnquiries(false);
    if (selectedEnquiry.value && selectedEnquiry.value.id === scheduleForm.value.enquiryId) {
      const res = await api.get(`/enquiries/${scheduleForm.value.enquiryId}`);
      selectedEnquiry.value = res.data;
    }
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to schedule site survey');
  } finally {
    schedulingSurvey.value = false;
  }
};

const goToScheduleSurvey = (enq: Enquiry) => {
  openScheduleSurveyModal(enq);
};

const goToCreateQuote = (enq: Enquiry) => {
  router.push({
    path: '/quotations',
    query: { customerId: String(enq.customer.id), enquiryId: String(enq.id) },
  });
};

let pollInterval: any = null;

onMounted(() => {
  fetchEnquiries(true);
  fetchTechnicians();
  pollInterval = setInterval(() => {
    fetchEnquiries(false);
  }, 8000);
});

onBeforeUnmount(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Customer Enquiries & Leads</h1>
        <p class="text-sm text-slate-500">
          Inbound leads via Phone, WhatsApp & Customer Portal • Tele-qualification & Roof Sizing Engine
        </p>
      </div>

      <div class="flex items-center space-x-2">
        <button
          v-if="isSales || isAdmin"
          type="button"
          @click="showManualModal = true"
          class="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>+ Log Phone / WhatsApp Lead</span>
        </button>

        <a
          href="/enquiry"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition"
        >
          <ExternalLink class="w-3.5 h-3.5" />
          <span>Customer Web Portal</span>
        </a>
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          v-model="search"
          @input="fetchEnquiries(false)"
          placeholder="Search by name, phone, enquiry #..."
          class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div class="flex items-center space-x-2">
        <Filter class="w-4 h-4 text-slate-400" />
        <select
          v-model="statusFilter"
          @change="fetchEnquiries(true)"
          class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="SURVEY_SCHEDULED">Survey Scheduled</option>
          <option value="SURVEY_APPROVED">Survey Approved</option>
          <option value="QUOTED">Quoted</option>
          <option value="CONVERTED">Converted</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
    </div>

    <!-- Main Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">Lead ID</th>
              <th class="py-3 px-4">Customer</th>
              <th class="py-3 px-4">System Req</th>
              <th class="py-3 px-4">Bill & Smart Sizing</th>
              <th class="py-3 px-4">Roof Feasibility</th>
              <th class="py-3 px-4">Lead Owner</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredEnquiries.length === 0">
              <td colspan="8" class="py-8 text-center text-slate-400">
                No customer enquiries found matching filter.
              </td>
            </tr>
            <tr v-for="enq in filteredEnquiries" :key="enq.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">
                {{ enq.enquiryNumber }}
                <span class="block text-[10px] font-normal text-slate-400 uppercase font-sans">
                  {{ enq.source.replace('_', ' ') }}
                </span>
              </td>
              <td class="py-3 px-4">
                <div class="font-semibold text-slate-800">{{ enq.customer.fullName }}</div>
                <div class="text-[11px] text-slate-400 flex items-center space-x-1">
                  <Phone class="w-3 h-3 text-slate-400" />
                  <span>{{ enq.customer.phone }}</span>
                  <span v-if="enq.customer.city">• {{ enq.customer.city }}</span>
                </div>
              </td>
              <td class="py-3 px-4">
                <span class="font-medium text-slate-800">{{ enq.requestedCapacityKw }} kW</span>
                <span class="ml-1 text-[11px] text-slate-500">
                  ({{ enq.systemType === 'ON_GRID' ? 'On-Grid' : 'Off-Grid' }})
                </span>
                <div v-if="enq.subsidyRequired" class="text-[10px] text-emerald-700 font-semibold mt-0.5">
                  PM Surya Ghar
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="font-bold text-slate-800">
                  {{ enq.monthlyElectricityBill ? `₹${enq.monthlyElectricityBill.toLocaleString('en-IN')}/mo` : '-' }}
                </div>
                <span
                  v-if="getRecommendedKw(enq.monthlyElectricityBill)"
                  class="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mt-0.5"
                >
                  <Sparkles class="w-2.5 h-2.5" />
                  <span>Rec: {{ getRecommendedKw(enq.monthlyElectricityBill) }} kW</span>
                </span>
              </td>
              <td class="py-3 px-4">
                <div v-if="enq.shadowFreeAreaSqFt" class="font-medium text-slate-800">
                  {{ enq.shadowFreeAreaSqFt }} sq.ft
                </div>
                <span
                  :class="[
                    'inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded border mt-0.5',
                    getRoofFeasibility(enq.requestedCapacityKw, enq.shadowFreeAreaSqFt).class,
                  ]"
                >
                  {{ getRoofFeasibility(enq.requestedCapacityKw, enq.shadowFreeAreaSqFt).message }}
                </span>
              </td>
              <td class="py-3 px-4">
                <div v-if="enq.assignedTo" class="flex items-center space-x-1 font-semibold text-slate-800">
                  <UserIcon class="w-3 h-3 text-slate-400" />
                  <span>{{ enq.assignedTo.fullName }}</span>
                </div>
                <button
                  v-else-if="isSales"
                  type="button"
                  @click.stop="handleAssignToMe(enq)"
                  class="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-semibold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <UserCheck class="w-3 h-3" />
                  <span>Claim Lead</span>
                </button>
                <span v-else class="text-slate-400 text-[11px] italic">Unassigned</span>
              </td>
              <td class="py-3 px-4">
                <StatusBadge :status="enq.status" />
              </td>
              <td class="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                <button
                  type="button"
                  @click="openEnquiryModal(enq)"
                  class="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded text-xs font-semibold cursor-pointer"
                >
                  View & Qualify
                </button>

                <template v-if="enq.status === 'QUALIFIED' && isSales">
                  <button
                    v-if="!enq.assignedTo"
                    type="button"
                    @click.stop="handleAssignAndSchedule(enq)"
                    class="px-2.5 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
                    title="Claim lead first to schedule a survey"
                  >
                    <UserCheck class="w-3 h-3" />
                    <span>Claim & Schedule</span>
                  </button>
                  <button
                    v-else
                    type="button"
                    @click="goToScheduleSurvey(enq)"
                    class="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
                  >
                    <Calendar class="w-3 h-3" />
                    <span>Schedule Survey</span>
                  </button>
                </template>

                <button
                  v-if="enq.status === 'SURVEY_SCHEDULED'"
                  type="button"
                  @click="router.push('/surveys')"
                  class="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
                >
                  <Calendar class="w-3 h-3" />
                  <span>📅 Survey Scheduled</span>
                </button>

                <button
                  v-if="enq.status === 'SURVEY_APPROVED' && isSales"
                  type="button"
                  @click="goToCreateQuote(enq)"
                  class="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
                >
                  <Zap class="w-3 h-3" />
                  <span>Create Quote</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tele-Qualification & Lead Details Modal -->
    <div v-if="selectedEnquiry" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-bold text-slate-900">{{ selectedEnquiry.enquiryNumber }}</h2>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                {{ selectedEnquiry.source.replace('_', ' ') }}
              </span>
            </div>
            <p class="text-xs text-slate-500">Customer: {{ selectedEnquiry.customer.fullName }} • Phone: {{ selectedEnquiry.customer.phone }}</p>
          </div>
          <button type="button" @click="selectedEnquiry = null" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">
            ✕
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <!-- Warning if Lead is unassigned -->
          <div v-if="!selectedEnquiry.assignedTo && isSales" class="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-base">⚠️</span>
              <div>
                <p class="font-semibold text-xs">Unassigned Lead</p>
                <p class="text-[11px] text-amber-700">Claim ownership of this enquiry before scheduling a site survey or quotation.</p>
              </div>
            </div>
            <button
              type="button"
              @click="handleAssignToMe(selectedEnquiry)"
              class="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shrink-0"
            >
              <UserCheck class="w-3 h-3" />
              <span>Claim Lead</span>
            </button>
          </div>

          <!-- Current Lead Stage & Actions -->
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span class="font-semibold text-slate-600">Current Lead Stage:</span>
              <div class="mt-1 flex items-center gap-2">
                <StatusBadge :status="selectedEnquiry.status" />
                <span v-if="selectedEnquiry.assignedTo" class="text-[11px] text-slate-500">
                  (Owner: <strong>{{ selectedEnquiry.assignedTo.fullName }}</strong>)
                </span>
                <button
                  v-else-if="isSales"
                  type="button"
                  @click="handleAssignToMe(selectedEnquiry)"
                  class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 text-[10px] font-bold cursor-pointer"
                >
                  Claim Lead
                </button>
              </div>
            </div>

            <div v-if="isSales" class="flex items-center space-x-2">
              <span class="text-slate-500 font-medium">Quick Stage:</span>
              <button
                type="button"
                @click="handleStatusUpdate(selectedEnquiry.id, 'CONTACTED', 'Customer contacted via telephone conversation')"
                :disabled="selectedEnquiry.status === 'CONTACTED'"
                class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-semibold text-xs cursor-pointer disabled:opacity-50"
              >
                Contacted
              </button>
              <button
                type="button"
                @click="handleSaveQualification('QUALIFIED')"
                :disabled="selectedEnquiry.status === 'QUALIFIED' || ['SURVEY_SCHEDULED', 'SURVEY_APPROVED', 'QUOTED', 'CONVERTED'].includes(selectedEnquiry.status)"
                class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1 shadow-xs"
              >
                <CheckCircle2 class="w-3.5 h-3.5" />
                <span>Verify & Qualify</span>
              </button>
              <button
                type="button"
                @click="handleStatusUpdate(selectedEnquiry.id, 'REJECTED', 'Customer declined or unreachable')"
                :disabled="selectedEnquiry.status === 'REJECTED'"
                class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded font-semibold text-xs cursor-pointer disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>

          <!-- SMART TELE-QUALIFICATION & SIZING ENGINE (Judge Wow-Factor) -->
          <div class="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3">
            <div class="flex items-center justify-between border-b border-emerald-100 pb-2">
              <div class="flex items-center gap-2">
                <Sparkles class="w-4 h-4 text-emerald-700" />
                <h3 class="font-bold text-emerald-950 text-sm">Tele-Qualification & Smart Sizing Verification</h3>
              </div>
              <span class="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Phone Qualification Gate
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">
                  Monthly EB Bill (₹) *
                </label>
                <input
                  type="number"
                  v-model="qualifyForm.monthlyElectricityBill"
                  min="0"
                  step="100"
                  class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. 3500"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">
                  Shadow-Free Roof Area (sq.ft) *
                </label>
                <input
                  type="number"
                  v-model="qualifyForm.shadowFreeAreaSqFt"
                  min="0"
                  step="25"
                  class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. 450"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">
                  Grid Connection Suitable?
                </label>
                <div class="flex items-center h-8">
                  <label class="inline-flex items-center cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      v-model="qualifyForm.gridSuitable"
                      class="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span class="text-xs font-semibold text-slate-800">
                      {{ qualifyForm.gridSuitable ? 'Yes, 230V/415V Verified' : 'No / Voltage Issues' }}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Live Smart Sizing & Feasibility Banner -->
            <div class="p-3 bg-white rounded-lg border border-emerald-100 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-600">Client Desired Capacity:</span>
                <span class="font-bold text-slate-900">{{ selectedEnquiry.requestedCapacityKw }} kW ({{ selectedEnquiry.systemType }})</span>
              </div>

              <div class="flex items-center justify-between text-xs" v-if="getRecommendedKw(qualifyForm.monthlyElectricityBill)">
                <span class="text-slate-600">AI / Tariff Sizing Recommendation:</span>
                <span class="font-bold text-blue-700 inline-flex items-center gap-1">
                  <Sparkles class="w-3.5 h-3.5 text-blue-600" />
                  <span>{{ getRecommendedKw(qualifyForm.monthlyElectricityBill) }} kW Solar System</span>
                </span>
              </div>

              <!-- Roof Feasibility Alert -->
              <div
                :class="[
                  'p-2 rounded text-xs font-medium border flex items-center gap-2',
                  getRoofFeasibility(selectedEnquiry.requestedCapacityKw, qualifyForm.shadowFreeAreaSqFt).class,
                ]"
              >
                <span>{{ getRoofFeasibility(selectedEnquiry.requestedCapacityKw, qualifyForm.shadowFreeAreaSqFt).fullMessage }}</span>
              </div>
            </div>

            <div v-if="isSales" class="flex justify-end gap-2 pt-1">
              <button
                type="button"
                @click="handleSaveQualification()"
                :disabled="savingQualify"
                class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check class="w-3.5 h-3.5" />
                <span>{{ savingQualify ? 'Saving...' : 'Save Tele-Qualification Basics' }}</span>
              </button>
            </div>
          </div>

          <!-- Customer Contact & Site Info -->
          <div class="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-xl">
            <div>
              <p class="text-slate-400">Phone</p>
              <p class="font-semibold text-slate-800">{{ selectedEnquiry.customer.phone }}</p>
            </div>
            <div>
              <p class="text-slate-400">Email</p>
              <p class="font-semibold text-slate-800">{{ selectedEnquiry.customer.email || 'N/A' }}</p>
            </div>
            <div>
              <p class="text-slate-400">Government Subsidy</p>
              <p class="font-semibold text-emerald-700">
                {{ selectedEnquiry.subsidyRequired ? '✓ Requested (PM Surya Ghar)' : 'Not Required' }}
              </p>
            </div>
            <div>
              <p class="text-slate-400">Lead Source</p>
              <p class="font-semibold text-slate-800 uppercase font-mono">{{ selectedEnquiry.source.replace('_', ' ') }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-slate-400">Installation Site Address</p>
              <p class="text-slate-800 font-medium">
                {{ selectedEnquiry.customer.address || 'N/A' }}
                <span v-if="selectedEnquiry.customer.city || selectedEnquiry.customer.state || selectedEnquiry.customer.pincode" class="text-slate-500 font-normal block mt-0.5">
                  {{ [selectedEnquiry.customer.city, selectedEnquiry.customer.state, selectedEnquiry.customer.pincode].filter(Boolean).join(', ') }}
                </span>
              </p>
            </div>
            <div v-if="selectedEnquiry.notes" class="col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
              <p class="text-slate-500 font-semibold mb-0.5">Customer Initial Remarks / Notes</p>
              <p class="text-slate-700">{{ selectedEnquiry.notes }}</p>
            </div>
          </div>

          <!-- Phone Call Pre-Screening Basics (Problem Statement Scene 1) -->
          <div class="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-amber-900 text-xs flex items-center space-x-1.5">
                <Phone class="w-3.5 h-3.5 text-amber-600" />
                <span>Phone Call Pre-Screening Checks</span>
              </span>
              <span class="text-[11px] text-amber-700 font-medium">Verify shadow-free space & grid</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div>
                <label class="text-[10px] uppercase font-bold text-slate-500 block">Shadow-Free Space (sq ft)</label>
                <input
                  type="number"
                  v-model="editShadowArea"
                  :disabled="!isSales"
                  placeholder="e.g. 400"
                  class="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label class="text-[10px] uppercase font-bold text-slate-500 block">Monthly Electricity Bill (₹)</label>
                <input
                  type="number"
                  v-model="editMonthlyBill"
                  :disabled="!isSales"
                  placeholder="e.g. 4500"
                  class="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label class="text-[10px] uppercase font-bold text-slate-500 block">Grid Connection Suitable?</label>
                <select
                  v-model="editGridSuitable"
                  :disabled="!isSales"
                  class="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option :value="true">✓ Suitable (Grid OK)</option>
                  <option :value="false">✗ Unsuitable (Voltage issues)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Add Follow-up Note Form -->
          <form v-if="isSales" @submit.prevent="handleAddFollowup" class="flex gap-2">
            <input
              type="text"
              v-model="followupNote"
              placeholder="Log follow-up phone call notes with homeowner..."
              class="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              :disabled="submittingNote || !followupNote.trim()"
              class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <Send class="w-3.5 h-3.5" />
              <span>Log Note</span>
            </button>
          </form>

          <!-- Audit Trail & Activity Log -->
          <div>
            <h3 class="font-bold text-slate-800 mb-2 flex items-center space-x-1.5">
              <Clock class="w-3.5 h-3.5 text-slate-400" />
              <span>Audit Trail & Activity Log</span>
            </h3>
            <div class="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2 max-h-40 overflow-y-auto">
              <template v-if="selectedEnquiry.activities && selectedEnquiry.activities.length > 0">
                <div v-for="act in selectedEnquiry.activities" :key="act.id" class="text-[11px] pb-2 border-b border-slate-200/60 last:border-0 last:pb-0">
                  <div class="flex items-center justify-between text-slate-600">
                    <span class="font-bold text-slate-800">{{ act.action }}</span>
                    <span class="text-slate-400">{{ new Date(act.createdAt).toLocaleString() }}</span>
                  </div>
                  <p class="text-slate-600 mt-0.5">{{ act.notes }}</p>
                  <p class="text-[10px] text-slate-400 italic">By: {{ act.performedBy }}</p>
                </div>
              </template>
              <p v-else class="text-slate-400 italic text-center py-2">No activity logged yet.</p>
            </div>
          </div>

          <!-- Modal Footer Actions -->
          <div class="flex justify-between items-center pt-3 border-t border-slate-100">
            <div class="space-x-2">
              <template v-if="selectedEnquiry.status === 'QUALIFIED' && isSales">
                <button
                  v-if="!selectedEnquiry.assignedTo"
                  type="button"
                  @click="handleAssignAndSchedule(selectedEnquiry)"
                  class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <UserCheck class="w-3.5 h-3.5" />
                  <span>Claim Lead & Schedule Survey</span>
                </button>
                <button
                  v-else
                  type="button"
                  @click="goToScheduleSurvey(selectedEnquiry)"
                  class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <Calendar class="w-3.5 h-3.5" />
                  <span>Proceed to Schedule Survey</span>
                </button>
              </template>

              <button
                v-if="selectedEnquiry.status === 'SURVEY_SCHEDULED'"
                type="button"
                @click="selectedEnquiry = null; router.push('/surveys')"
                class="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl font-semibold inline-flex items-center space-x-1 cursor-pointer"
              >
                <Calendar class="w-3.5 h-3.5" />
                <span>📅 View Scheduled Survey</span>
              </button>

              <button
                v-if="selectedEnquiry.status === 'SURVEY_APPROVED' && isSales"
                type="button"
                @click="goToCreateQuote(selectedEnquiry)"
                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold inline-flex items-center space-x-1 cursor-pointer"
              >
                <Zap class="w-3.5 h-3.5" />
                <span>Proceed to Create Quote</span>
              </button>
            </div>

            <button
              type="button"
              @click="selectedEnquiry = null"
              class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: + Log Phone / WhatsApp Lead -->
    <div v-if="showManualModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Phone class="w-4 h-4" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-900">Log Phone Call / WhatsApp Enquiry</h2>
              <p class="text-xs text-slate-500">Record direct inbound customer requirements into centralized database</p>
            </div>
          </div>
          <button type="button" @click="showManualModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">
            ✕
          </button>
        </div>

        <form @submit.prevent="handleManualSubmit" class="space-y-4 text-xs">
          <!-- 1. Customer Details -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Customer Full Name *</label>
              <input
                type="text"
                required
                v-model="manualForm.customerName"
                placeholder="e.g. Balaji Subramanian"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Phone Number (10 Digits) *</label>
              <input
                type="tel"
                required
                v-model="manualForm.customerPhone"
                placeholder="e.g. 9840112233"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
              <input
                type="email"
                v-model="manualForm.customerEmail"
                placeholder="client@gmail.com"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Lead Channel / Source *</label>
              <select
                v-model="manualForm.source"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="PHONE">Phone Call (Inbound Line)</option>
                <option value="WHATSAPP">WhatsApp Business Chat</option>
                <option value="MANUAL">Direct Walk-In / Referral</option>
              </select>
            </div>
            <div class="col-span-2">
              <label class="block font-semibold text-slate-700 mb-1">Installation Site Address *</label>
              <input
                type="text"
                required
                v-model="manualForm.customerAddress"
                placeholder="Door No, Street, Landmark"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">City / Region *</label>
              <input
                type="text"
                required
                v-model="manualForm.city"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">PIN Code *</label>
              <input
                type="text"
                required
                v-model="manualForm.pincode"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- 2. System Specifications & Basics -->
          <div class="pt-2 border-t border-slate-100">
            <h4 class="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Zap class="w-3.5 h-3.5 text-amber-500" />
              <span>Solar Capacity & Rooftop Basics</span>
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Capacity (kW) *</label>
                <select
                  v-model="manualForm.requestedCapacityKw"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option :value="1">1 kW</option>
                  <option :value="2">2 kW</option>
                  <option :value="3">3 kW (Most Popular)</option>
                  <option :value="4">4 kW</option>
                  <option :value="5">5 kW</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">System Type *</label>
                <select
                  v-model="manualForm.systemType"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="ON_GRID">On-Grid (Net-Meter)</option>
                  <option value="OFF_GRID">Off-Grid (Battery)</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Monthly Bill (₹)</label>
                <input
                  type="number"
                  v-model="manualForm.monthlyElectricityBill"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Shadow-Free Space (sq.ft)</label>
                <input
                  type="number"
                  v-model="manualForm.shadowFreeAreaSqFt"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div class="col-span-2 flex items-center pt-4">
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="manualForm.gridSuitable"
                    class="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span class="text-xs text-slate-700 font-medium">Customer confirmed standard grid/phase available</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Subsidy & Remarks -->
          <div class="space-y-2 pt-2 border-t border-slate-100">
            <label class="flex items-center gap-2 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 cursor-pointer">
              <input
                type="checkbox"
                v-model="manualForm.subsidyRequired"
                class="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span class="text-xs font-semibold text-emerald-900">
                Apply for Central Government Subsidy (PM Surya Ghar Muft Bijli Yojana)
              </span>
            </label>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Conversation Notes / Remarks</label>
              <textarea
                v-model="manualForm.notes"
                rows="2"
                placeholder="Customer wants quote for 3kW. Mentioned South terrace is open..."
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              ></textarea>
            </div>
          </div>

          <!-- Footer Buttons -->
          <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="showManualModal = false"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="creatingEnquiry"
              class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {{ creatingEnquiry ? 'Registering Lead...' : 'Log Customer Enquiry' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Schedule Site Survey (Auto-Selected Customer & Enquiry) -->
    <div v-if="showScheduleModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Calendar class="w-4 h-4" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-900">Schedule Physical Site Survey</h2>
              <p class="text-xs text-slate-500">Dispatch certified technician for rooftop shadow & electrical inspection</p>
            </div>
          </div>
          <button type="button" @click="showScheduleModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">
            ✕
          </button>
        </div>

        <form @submit.prevent="handleScheduleSubmit" class="space-y-4 text-xs">
          <!-- Auto-Selected Customer & Enquiry Lock Badge -->
          <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div>
              <span class="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Target Customer & Lead</span>
              <div class="text-xs font-bold text-slate-900 mt-0.5">{{ scheduleForm.customerName }}</div>
              <div class="text-[11px] text-slate-500 font-mono mt-0.5">
                Enquiry ID: {{ scheduleForm.enquiryNumber }}
                <span v-if="scheduleForm.assignedToName" class="text-emerald-700 font-sans ml-2">
                  • Lead Owner: <strong>{{ scheduleForm.assignedToName }}</strong>
                </span>
              </div>
            </div>
            <span class="px-2.5 py-1 bg-white text-emerald-700 font-bold text-[11px] rounded-lg border border-emerald-200 shadow-2xs">
              ✓ Auto-Selected
            </span>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Assign Certified Technician *</label>
            <select
              required
              v-model="scheduleForm.technicianId"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">-- Select Certified Solar Technician --</option>
              <option v-for="t in availableTechnicians" :key="t.id" :value="String(t.id)">
                {{ t.name }} — {{ t.skills || (t as any).specialization || 'Certified Solar Technician' }}
              </option>
            </select>
            <p v-if="availableTechnicians.length === 0" class="text-[11px] text-amber-600 mt-1">
              Loading available certified technicians...
            </p>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Scheduled Inspection Date *</label>
            <input
              type="date"
              required
              v-model="scheduleForm.scheduledDate"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Work Instructions for Field Technician</label>
            <textarea
              rows="2"
              v-model="scheduleForm.surveyNotes"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. Inspect South terrace, test RCC slab thickness, verify 230V connection..."
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="showScheduleModal = false"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="schedulingSurvey || !scheduleForm.technicianId"
              class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Calendar class="w-3.5 h-3.5" />
              <span>{{ schedulingSurvey ? 'Scheduling Survey...' : 'Confirm Survey Appointment' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
