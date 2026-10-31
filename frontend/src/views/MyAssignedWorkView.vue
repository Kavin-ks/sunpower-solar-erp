<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '../api/client';
import StatusBadge from '../components/ui/StatusBadge.vue';
import CameraPhotoUpload from '../components/common/CameraPhotoUpload.vue';
import { useAuthStore } from '../stores/auth';
import { formatFaultCode } from '../utils/faultCatalog';
import {
  Compass,
  Wrench,
  Headphones,
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
  Calendar,
  Layers,
  Check,
  RefreshCw
} from 'lucide-vue-next';

const authStore = useAuthStore();

// Tab state: 'surveys' | 'installations' | 'services'
const activeTab = ref<'surveys' | 'installations' | 'services'>('surveys');

// Data
const surveys = ref<any[]>([]);
const installations = ref<any[]>([]);
const serviceTickets = ref<any[]>([]);
const products = ref<any[]>([]);
const loading = ref(true);

// Modals
const showSurveyModal = ref(false);
const selectedSurvey = ref<any | null>(null);
const surveyForm = ref({
  roofDirection: 'South',
  roofTilt: '15 degrees',
  roofCondition: 'RCC Flat Concrete Slab - Excellent structural integrity',
  availableRoofAreaSqFt: '450',
  cableDistanceMeters: '20',
  shadingAssessment: '100% Shadow-Free all seasons',
  gridSuitability: 'Single Phase 230V / 3-Phase 415V Suitable for Net-Metering',
  structuralObservations: 'RCC slab solid, suitable for HDG modular mounting frame without penetration.',
  surveyNotes: 'Rooftop surveyed. Verified clear solar access and earthing conduit path.',
  inspectionRecommendation: 'APPROVED',
});

// Installation modals
const showInstallCompleteModal = ref(false);
const selectedInstallation = ref<any | null>(null);
const installCompleteForm = ref({
  installedCapacityKw: '5.0',
  panelMountingConfirmed: true,
  wiringConfirmed: true,
  earthingConfirmed: true,
  testingPassed: true,
  testingNotes: 'String open-circuit voltage Voc = 380V. Short-circuit current Isc = 11.2A. Inverter grid sync test passed.',
  customerSigneeName: '',
  hoursWorked: '8.0',
});

const showInstallPhotoModal = ref(false);
const photoStage = ref('PANEL_MOUNTING');

// Service ticket complete modal
const showServiceCompleteModal = ref(false);
const selectedServiceTicket = ref<any | null>(null);
const serviceCompleteForm = ref({
  diagnosisNotes: '',
  resolutionNotes: '',
  testingResults: 'Solar string inverter synchronized with grid. Verified generation at 4.6 kW under full irradiance. No earth leakage detected.',
  beforePhotoUrl: '',
  afterPhotoUrl: '',
  laborCharges: 0,
  replacedParts: [] as Array<{ productId: number; productName: string; quantity: number; unitPrice: number; }>,
});
const selectedPartId = ref('');
const selectedPartQty = ref(1);

const fetchMyWork = async () => {
  loading.value = true;
  try {
    const [surveysRes, installsRes, servicesRes, prodsRes] = await Promise.all([
      api.get('/surveys/my-assigned'),
      api.get('/installations/my-assigned'),
      api.get('/service-tickets/my-assigned'),
      api.get('/products').catch(() => ({ data: [] })),
    ]);
    surveys.value = surveysRes.data;
    installations.value = installsRes.data;
    serviceTickets.value = servicesRes.data;
    products.value = prodsRes.data;
  } catch (err) {
    console.error('Failed to fetch assigned technician work', err);
  } finally {
    loading.value = false;
  }
};

// --- SURVEY ACTIONS ---
const openSurveyInspection = (survey: any) => {
  selectedSurvey.value = survey;
  surveyForm.value = {
    roofDirection: survey.roofDirection || 'South',
    roofTilt: survey.roofTilt || '15 degrees',
    roofCondition: survey.roofCondition || 'RCC Flat Concrete Slab - Excellent structural integrity',
    availableRoofAreaSqFt: survey.availableRoofAreaSqFt ? survey.availableRoofAreaSqFt.toString() : '450',
    cableDistanceMeters: survey.cableDistanceMeters ? survey.cableDistanceMeters.toString() : '20',
    shadingAssessment: survey.shadingAssessment || '100% Shadow-Free all seasons',
    gridSuitability: survey.gridSuitability || 'Single Phase 230V / 3-Phase 415V Suitable for Net-Metering',
    structuralObservations: survey.structuralObservations || 'RCC slab solid, suitable for HDG modular mounting frame without penetration.',
    surveyNotes: survey.surveyNotes || 'Rooftop surveyed. Verified clear solar access and earthing conduit path.',
    inspectionRecommendation: survey.inspectionRecommendation || 'APPROVED',
  };
  showSurveyModal.value = true;
};

const handleSurveySubmit = async (isDraft: boolean) => {
  if (!selectedSurvey.value) return;
  try {
    await api.post(`/surveys/${selectedSurvey.value.id}/inspection-report`, {
      roofDirection: surveyForm.value.roofDirection,
      roofTilt: surveyForm.value.roofTilt,
      roofCondition: surveyForm.value.roofCondition,
      availableRoofAreaSqFt: parseFloat(surveyForm.value.availableRoofAreaSqFt),
      cableDistanceMeters: parseFloat(surveyForm.value.cableDistanceMeters),
      shadingAssessment: surveyForm.value.shadingAssessment,
      gridSuitability: surveyForm.value.gridSuitability,
      structuralObservations: surveyForm.value.structuralObservations,
      surveyNotes: surveyForm.value.surveyNotes,
      inspectionRecommendation: surveyForm.value.inspectionRecommendation,
      draft: isDraft,
    });
    showSurveyModal.value = false;
    await fetchMyWork();
    alert(isDraft ? 'Inspection draft saved.' : 'Technical Inspection Report submitted to Sales for review.');
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to submit inspection report');
  }
};

// --- INSTALLATION ACTIONS ---
const handleStartInstallation = async (inst: any) => {
  try {
    await api.patch(`/installations/${inst.id}/start`);
    await fetchMyWork();
    alert(`Installation #${inst.id} marked IN_PROGRESS on-site.`);
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to start installation');
  }
};

const openInstallationComplete = (inst: any) => {
  selectedInstallation.value = inst;
  installCompleteForm.value = {
    installedCapacityKw: inst.installedCapacityKw ? inst.installedCapacityKw.toString() : (inst.salesOrder?.capacityKw ? inst.salesOrder.capacityKw.toString() : '5.0'),
    panelMountingConfirmed: true,
    wiringConfirmed: true,
    earthingConfirmed: true,
    testingPassed: true,
    testingNotes: 'Voc and Isc measured within manufacturer tolerances. Earthing resistance verified < 2 Ohms.',
    customerSigneeName: inst.customer?.fullName || '',
    hoursWorked: '8.0',
  };
  showInstallCompleteModal.value = true;
};

const handleInstallationCompleteSubmit = async () => {
  if (!selectedInstallation.value) return;
  try {
    await api.post(`/installations/${selectedInstallation.value.id}/complete`, {
      installedCapacityKw: parseFloat(installCompleteForm.value.installedCapacityKw),
      panelMountingConfirmed: installCompleteForm.value.panelMountingConfirmed,
      wiringConfirmed: installCompleteForm.value.wiringConfirmed,
      earthingConfirmed: installCompleteForm.value.earthingConfirmed,
      testingPassed: installCompleteForm.value.testingPassed,
      testingNotes: installCompleteForm.value.testingNotes,
      customerSigneeName: installCompleteForm.value.customerSigneeName,
      hoursWorked: parseFloat(installCompleteForm.value.hoursWorked),
    });
    showInstallCompleteModal.value = false;
    await fetchMyWork();
    alert('Installation marked COMPLETED! Sign-off recorded and hours logged.');
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to complete installation');
  }
};

// --- SERVICE VISIT ACTIONS ---
const handleStartService = async (ticket: any) => {
  try {
    await api.post(`/service-tickets/${ticket.id}/start-work`);
    await fetchMyWork();
    alert(`Service work started on ticket ${ticket.ticketNumber}. Status changed to IN_PROGRESS.`);
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to start service work');
  }
};

const openServiceComplete = (ticket: any) => {
  selectedServiceTicket.value = ticket;
  serviceCompleteForm.value = {
    diagnosisNotes: ticket.diagnosisNotes || '',
    resolutionNotes: ticket.resolutionNotes || '',
    testingResults: ticket.testingResults || 'Solar string inverter synchronized with grid. Verified generation at 4.6 kW under full irradiance. No earth leakage detected.',
    beforePhotoUrl: ticket.beforePhotoUrl || ticket.complaintPhotoUrl || '',
    afterPhotoUrl: ticket.afterPhotoUrl || '',
    laborCharges: ticket.underWarranty ? 0 : 500,
    replacedParts: [],
  };
  showServiceCompleteModal.value = true;
};

const addServicePart = () => {
  if (!selectedPartId.value) return;
  const prod = products.value.find((p) => p.id === parseInt(selectedPartId.value));
  if (!prod) return;
  const existing = serviceCompleteForm.value.replacedParts.find((p) => p.productId === prod.id);
  if (existing) {
    existing.quantity += selectedPartQty.value;
  } else {
    serviceCompleteForm.value.replacedParts.push({
      productId: prod.id,
      productName: prod.name,
      quantity: selectedPartQty.value,
      unitPrice: prod.unitPrice || 0,
    });
  }
  selectedPartId.value = '';
  selectedPartQty.value = 1;
};

const removeServicePart = (index: number) => {
  serviceCompleteForm.value.replacedParts.splice(index, 1);
};

const handleServiceCompleteSubmit = async () => {
  if (!selectedServiceTicket.value) return;
  try {
    await api.post(`/service-tickets/${selectedServiceTicket.value.id}/complete-work`, {
      diagnosisNotes: serviceCompleteForm.value.diagnosisNotes,
      resolutionNotes: serviceCompleteForm.value.resolutionNotes,
      testingResults: serviceCompleteForm.value.testingResults,
      beforePhotoUrl: serviceCompleteForm.value.beforePhotoUrl,
      afterPhotoUrl: serviceCompleteForm.value.afterPhotoUrl,
      laborCharges: serviceCompleteForm.value.laborCharges,
      replacedParts: serviceCompleteForm.value.replacedParts.map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
      })),
    });
    showServiceCompleteModal.value = false;
    await fetchMyWork();
    alert('Repair completion submitted! Support officer will review evidence and obtain customer confirmation.');
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to submit service completion');
  }
};

onMounted(() => {
  fetchMyWork();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">My Assigned Work</h1>
        <p class="text-sm text-slate-500">
          Unified technician field portal • Site Surveys • Installations • Service Complaints
        </p>
      </div>

      <div class="flex items-center space-x-3">
        <span class="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-200">
          Authenticated: {{ authStore.user?.fullName }} ({{ authStore.user?.username }})
        </span>
        <button
          type="button"
          @click="fetchMyWork"
          class="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer shadow-2xs"
          title="Refresh Work Queue"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <!-- Section Navigation Tabs -->
    <div class="flex items-center space-x-2 border-b border-slate-200">
      <button
        type="button"
        @click="activeTab = 'surveys'"
        :class="[
          'flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer',
          activeTab === 'surveys'
            ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
            : 'border-transparent text-slate-500 hover:text-slate-900'
        ]"
      >
        <Compass class="w-4 h-4" />
        <span>1. Site Surveys</span>
        <span class="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
          {{ surveys.length }}
        </span>
      </button>

      <button
        type="button"
        @click="activeTab = 'installations'"
        :class="[
          'flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer',
          activeTab === 'installations'
            ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
            : 'border-transparent text-slate-500 hover:text-slate-900'
        ]"
      >
        <Wrench class="w-4 h-4" />
        <span>2. Installations</span>
        <span class="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
          {{ installations.length }}
        </span>
      </button>

      <button
        type="button"
        @click="activeTab = 'services'"
        :class="[
          'flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer',
          activeTab === 'services'
            ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
            : 'border-transparent text-slate-500 hover:text-slate-900'
        ]"
      >
        <Headphones class="w-4 h-4" />
        <span>3. Service Visits</span>
        <span class="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
          {{ serviceTickets.length }}
        </span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-16 text-slate-400 text-xs">
      Loading your assigned records directly from MySQL...
    </div>

    <!-- ========================================== -->
    <!-- SECTION 1: SITE SURVEYS                    -->
    <!-- ========================================== -->
    <div v-else-if="activeTab === 'surveys'" class="space-y-4">
      <div v-if="surveys.length === 0" class="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Compass class="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 class="text-sm font-bold text-slate-700">No Site Surveys Assigned</h3>
        <p class="text-xs text-slate-400 mt-1">There are currently no rooftop feasibility inspections assigned to your account.</p>
      </div>

      <div v-else class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">Survey #</th>
                <th class="py-3 px-4">Customer</th>
                <th class="py-3 px-4">Scheduled Date</th>
                <th class="py-3 px-4">Rooftop Area</th>
                <th class="py-3 px-4">Recommendation</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="surv in surveys" :key="surv.id" class="hover:bg-slate-50/70 transition">
                <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ surv.surveyNumber }}</td>
                <td class="py-3 px-4 font-semibold text-slate-800">
                  <div>{{ surv.customer?.fullName }}</div>
                  <div class="text-[11px] text-slate-400 font-normal">{{ surv.customer?.phone }}</div>
                </td>
                <td class="py-3 px-4">
                  <div class="flex items-center space-x-1.5 text-slate-700">
                    <Calendar class="w-3.5 h-3.5 text-slate-400" />
                    <span>{{ surv.scheduledDate || 'Immediate' }}</span>
                  </div>
                </td>
                <td class="py-3 px-4 font-mono">
                  {{ surv.availableRoofAreaSqFt ? surv.availableRoofAreaSqFt + ' sq ft' : 'Pending Survey' }}
                </td>
                <td class="py-3 px-4">
                  <span v-if="surv.inspectionRecommendation === 'APPROVED'" class="text-emerald-700 font-semibold">✓ Recommended</span>
                  <span v-else-if="surv.inspectionRecommendation === 'REJECTED'" class="text-rose-700 font-semibold">✗ Not Feasible</span>
                  <span v-else class="text-slate-400 italic">Not evaluated</span>
                </td>
                <td class="py-3 px-4">
                  <StatusBadge :status="surv.status" />
                </td>
                <td class="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                  <button
                    v-if="['SCHEDULED', 'IN_PROGRESS', 'DRAFT'].includes(surv.status)"
                    type="button"
                    @click="openSurveyInspection(surv)"
                    class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-2xs transition cursor-pointer text-xs"
                  >
                    Submit Technical Findings
                  </button>
                  <button
                    v-else
                    type="button"
                    @click="openSurveyInspection(surv)"
                    class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition cursor-pointer text-xs"
                  >
                    View Report
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- SECTION 2: INSTALLATIONS                   -->
    <!-- ========================================== -->
    <div v-else-if="activeTab === 'installations'" class="space-y-4">
      <div v-if="installations.length === 0" class="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Wrench class="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 class="text-sm font-bold text-slate-700">No Installations Assigned</h3>
        <p class="text-xs text-slate-400 mt-1">There are currently no rooftop solar installations assigned to your account.</p>
      </div>

      <div v-else class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">Installation #</th>
                <th class="py-3 px-4">Customer & Phone</th>
                <th class="py-3 px-4">System Capacity</th>
                <th class="py-3 px-4">Scheduled Date</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="inst in installations" :key="inst.id" class="hover:bg-slate-50/70 transition">
                <td class="py-3 px-4 font-mono font-bold text-slate-900">INST-{{ inst.id }}</td>
                <td class="py-3 px-4 font-semibold text-slate-800">
                  <div>{{ inst.customer?.fullName }}</div>
                  <div class="text-[11px] text-slate-400 font-normal">{{ inst.customer?.phone }}</div>
                </td>
                <td class="py-3 px-4 font-mono font-semibold text-slate-900">
                  {{ inst.salesOrder?.capacityKw || inst.installedCapacityKw || 5.0 }} kW
                </td>
                <td class="py-3 px-4 text-slate-700">
                  {{ inst.scheduledDate || 'Immediate' }}
                </td>
                <td class="py-3 px-4">
                  <StatusBadge :status="inst.status" />
                </td>
                <td class="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                  <!-- Status-dependent installation actions -->
                  <template v-if="inst.status === 'SCHEDULED'">
                    <button
                      type="button"
                      @click="handleStartInstallation(inst)"
                      class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-2xs transition cursor-pointer text-xs flex-inline items-center space-x-1"
                    >
                      <Play class="w-3.5 h-3.5 inline mr-1" />
                      <span>Start Installation</span>
                    </button>
                  </template>

                  <template v-else-if="inst.status === 'IN_PROGRESS'">
                    <button
                      type="button"
                      @click="openInstallationComplete(inst)"
                      class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-2xs transition cursor-pointer text-xs"
                    >
                      <CheckCircle2 class="w-3.5 h-3.5 inline mr-1" />
                      <span>Submit Commissioning & Sign-Off</span>
                    </button>
                  </template>

                  <template v-else>
                    <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      ✓ Commissioned
                    </span>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- SECTION 3: SERVICE VISITS                  -->
    <!-- ========================================== -->
    <div v-else-if="activeTab === 'services'" class="space-y-4">
      <div v-if="serviceTickets.length === 0" class="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Headphones class="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 class="text-sm font-bold text-slate-700">No Service Visits Assigned</h3>
        <p class="text-xs text-slate-400 mt-1">There are currently no customer breakdown complaints assigned to your account.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="job in serviceTickets"
          :key="job.id"
          class="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition p-5 space-y-4"
        >
          <div class="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <div class="flex items-center space-x-2">
                <span class="font-mono font-bold text-sm text-slate-900">{{ job.ticketNumber }}</span>
                <StatusBadge :status="job.status" />
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">Reported: {{ job.reportedDate }} • Source: {{ job.submissionSource || 'Customer Portal' }}</p>
            </div>
            <!-- Authoritative Warranty & Charges Display -->
            <div class="text-right">
              <div v-if="job.underWarranty" class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                ✓ Active Warranty (₹0 Customer Charge)
              </div>
              <div v-else class="text-right">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
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

          <!-- Customer & Equipment Info -->
          <div class="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Customer</span>
              <span class="font-bold text-slate-800">{{ job.customer?.fullName }}</span>
              <span class="text-slate-500 block text-[11px] flex items-center space-x-1 mt-0.5">
                <Phone class="w-3 h-3 text-slate-400" />
                <span>{{ job.customer?.phone }}</span>
              </span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Equipment & Serial</span>
              <span class="font-bold text-slate-800">{{ job.serialNumber?.product?.name || 'Solar Equipment' }}</span>
              <span class="font-mono text-slate-600 block text-[11px] mt-0.5">{{ job.serialNumber?.serialCode || 'N/A' }}</span>
            </div>
          </div>

          <!-- Meaningful Fault Code Description -->
          <div class="text-xs space-y-1">
            <div class="flex items-center space-x-1.5 text-amber-700 font-semibold">
              <AlertTriangle class="w-3.5 h-3.5" />
              <span>{{ formatFaultCode(job.faultCode) }}</span>
            </div>
            <p class="text-slate-600 bg-slate-50/70 p-2.5 rounded-lg border border-slate-200 text-xs">
              {{ job.complaintDescription }}
            </p>
          </div>

          <!-- Status-dependent Actions for Service Visit -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div class="text-[11px] text-slate-500 font-medium">
              <span v-if="job.status === 'ASSIGNED'">Arrived on-site? Click Start Work</span>
              <span v-else-if="job.status === 'IN_PROGRESS'" class="text-amber-600 font-semibold">Repair in progress on-site</span>
              <span v-else-if="['RESOLVED', 'TECHNICIAN_COMPLETED'].includes(job.status)" class="text-emerald-700 font-semibold">✓ Completed — Awaiting Customer Sign-Off</span>
              <span v-else-if="job.status === 'CLOSED'" class="text-slate-400">Complaint closed & verified</span>
            </div>

            <div class="flex space-x-2">
              <button
                v-if="job.status === 'ASSIGNED'"
                type="button"
                @click="handleStartService(job)"
                class="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <Play class="w-3.5 h-3.5" />
                <span>Start Work</span>
              </button>

              <button
                v-if="job.status === 'IN_PROGRESS'"
                type="button"
                @click="openServiceComplete(job)"
                class="flex items-center space-x-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <CheckCircle2 class="w-3.5 h-3.5" />
                <span>Submit Repair & Testing</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: SITE SURVEY INSPECTION REPORT -->
    <div v-if="showSurveyModal && selectedSurvey" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Site Survey Inspection Report</h2>
            <p class="text-xs text-slate-500">Survey {{ selectedSurvey.surveyNumber }} • Customer: {{ selectedSurvey.customer?.fullName }}</p>
          </div>
          <button type="button" @click="showSurveyModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="handleSurveySubmit(false)" class="space-y-4 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Roof Direction</label>
              <input type="text" v-model="surveyForm.roofDirection" class="w-full border border-slate-200 rounded-lg p-2 text-xs" required />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Roof Tilt</label>
              <input type="text" v-model="surveyForm.roofTilt" class="w-full border border-slate-200 rounded-lg p-2 text-xs" required />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Available Area (sq ft)</label>
              <input type="number" step="any" v-model="surveyForm.availableRoofAreaSqFt" class="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono" required />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Cable Distance (m)</label>
              <input type="number" step="any" v-model="surveyForm.cableDistanceMeters" class="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono" required />
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Rooftop Structural Condition</label>
            <input type="text" v-model="surveyForm.roofCondition" class="w-full border border-slate-200 rounded-lg p-2 text-xs" required />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Shading Assessment</label>
            <input type="text" v-model="surveyForm.shadingAssessment" class="w-full border border-slate-200 rounded-lg p-2 text-xs" required />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Feasibility Recommendation</label>
            <select v-model="surveyForm.inspectionRecommendation" class="w-full border border-slate-200 rounded-lg p-2 text-xs font-semibold">
              <option value="APPROVED">APPROVED (Feasible for Solar Installation)</option>
              <option value="REJECTED">REJECTED (Structural / Severe Shading Issue)</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Technician Notes</label>
            <textarea v-model="surveyForm.surveyNotes" rows="2" class="w-full border border-slate-200 rounded-lg p-2 text-xs"></textarea>
          </div>

          <div class="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button type="button" @click="handleSurveySubmit(true)" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer">
              Save Draft
            </button>
            <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-2xs cursor-pointer">
              Submit Final Inspection
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: INSTALLATION COMMISSIONING -->
    <div v-if="showInstallCompleteModal && selectedInstallation" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Commission Installation & Sign-Off</h2>
            <p class="text-xs text-slate-500">Installation #{{ selectedInstallation.id }} • Customer: {{ selectedInstallation.customer?.fullName }}</p>
          </div>
          <button type="button" @click="showInstallCompleteModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="handleInstallationCompleteSubmit" class="space-y-4 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Installed Capacity (kW)</label>
              <input type="number" step="0.1" v-model="installCompleteForm.installedCapacityKw" class="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold" required />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Hours Worked</label>
              <input type="number" step="0.5" v-model="installCompleteForm.hoursWorked" class="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono" required />
            </div>
          </div>

          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <span class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quality Checklist</span>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" v-model="installCompleteForm.panelMountingConfirmed" class="rounded text-emerald-600 focus:ring-emerald-500" />
              <span>Solar panels securely mounted and torque-checked</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" v-model="installCompleteForm.wiringConfirmed" class="rounded text-emerald-600 focus:ring-emerald-500" />
              <span>DC/AC cabling routed through UV-resistant conduits</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" v-model="installCompleteForm.earthingConfirmed" class="rounded text-emerald-600 focus:ring-emerald-500" />
              <span>Dual-ground earthing pit connected and resistance verified</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" v-model="installCompleteForm.testingPassed" class="rounded text-emerald-600 focus:ring-emerald-500" />
              <span>Inverter generation and anti-islanding test passed</span>
            </label>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Testing Notes & Voltage Readings</label>
            <textarea v-model="installCompleteForm.testingNotes" rows="2" class="w-full border border-slate-200 rounded-lg p-2 text-xs" required></textarea>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Customer Signee Full Name</label>
            <input type="text" v-model="installCompleteForm.customerSigneeName" class="w-full border border-slate-200 rounded-lg p-2 text-xs" required />
          </div>

          <div class="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button type="button" @click="showInstallCompleteModal = false" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer">
              Cancel
            </button>
            <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-2xs cursor-pointer">
              Confirm Commissioning
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: SERVICE VISIT COMPLETION -->
    <div v-if="showServiceCompleteModal && selectedServiceTicket" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Record Repair & Submit Completion</h2>
            <p class="text-xs text-slate-500">Ticket: {{ selectedServiceTicket.ticketNumber }} • Customer: {{ selectedServiceTicket.customer?.fullName }}</p>
          </div>
          <button type="button" @click="showServiceCompleteModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="handleServiceCompleteSubmit" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Root Cause Diagnosis *</label>
            <textarea
              v-model="serviceCompleteForm.diagnosisNotes"
              rows="2"
              required
              placeholder="e.g., Grid phase overvoltage tripped inverter AC contactor. Terminal block connection had slight oxidation."
              class="w-full border border-slate-200 rounded-lg p-2 text-xs"
            ></textarea>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Corrective Action Taken *</label>
            <textarea
              v-model="serviceCompleteForm.resolutionNotes"
              rows="2"
              required
              placeholder="e.g., Cleaned terminals, updated inverter firmware, re-calibrated overvoltage threshold according to TANGEDCO grid parameters."
              class="w-full border border-slate-200 rounded-lg p-2 text-xs"
            ></textarea>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Generation & Electrical Testing Results *</label>
            <textarea
              v-model="serviceCompleteForm.testingResults"
              rows="2"
              required
              class="w-full border border-slate-200 rounded-lg p-2 text-xs"
            ></textarea>
          </div>

          <!-- Replaced Parts from Inventory -->
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
            <span class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Replaced Spare Parts (Auto-deducted from Inventory)</span>
            <div class="flex gap-2">
              <select v-model="selectedPartId" class="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs">
                <option value="">-- Select replacement part --</option>
                <option v-for="p in products" :key="p.id" :value="p.id">
                  {{ p.name }} (Stock: {{ p.stockQuantity }})
                </option>
              </select>
              <input type="number" min="1" v-model.number="selectedPartQty" class="w-20 bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono" />
              <button type="button" @click="addServicePart" class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer">
                Add Part
              </button>
            </div>

            <div v-if="serviceCompleteForm.replacedParts.length > 0" class="space-y-1">
              <div v-for="(part, idx) in serviceCompleteForm.replacedParts" :key="idx" class="flex items-center justify-between bg-white p-2 rounded border border-slate-200 text-xs">
                <span>{{ part.productName }} × {{ part.quantity }}</span>
                <button type="button" @click="removeServicePart(idx)" class="text-rose-500 hover:text-rose-700 cursor-pointer">✕</button>
              </div>
            </div>
          </div>

          <!-- Photographs & Evidence -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Pre-Repair Photo</label>
              <CameraPhotoUpload v-model="serviceCompleteForm.beforePhotoUrl" label="Capture/Upload Before Photo" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Post-Repair Evidence Photo</label>
              <CameraPhotoUpload v-model="serviceCompleteForm.afterPhotoUrl" label="Capture/Upload After Photo" />
            </div>
          </div>

          <div class="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button type="button" @click="showServiceCompleteModal = false" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer">
              Cancel
            </button>
            <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-2xs cursor-pointer">
              Submit Repair For Review
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
