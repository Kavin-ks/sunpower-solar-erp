<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { api } from '../api/client';
import type { SiteSurvey, Customer, Technician, SurveyStatus, Enquiry } from '../types';
import StatusBadge from '../components/ui/StatusBadge.vue';
import CameraPhotoUpload from '../components/common/CameraPhotoUpload.vue';
import { useAuthStore } from '../stores/auth';
import { Plus, ShieldCheck, Camera, FileText, CheckCircle2, Zap } from 'lucide-vue-next';

const surveys = ref<SiteSurvey[]>([]);
const customers = ref<Customer[]>([]);
const technicians = ref<Technician[]>([]);
const enquiries = ref<Enquiry[]>([]);
const loading = ref(true);

// Modals
const showScheduleModal = ref(false);
const inspectionModalSurvey = ref<SiteSurvey | null>(null);
const reviewModalSurvey = ref<SiteSurvey | null>(null);
const viewReportSurvey = ref<SiteSurvey | null>(null);
const photoModalSurvey = ref<SiteSurvey | null>(null);
const viewPhotosSurvey = ref<SiteSurvey | null>(null);

// Review Form State
const reviewNotes = ref('');
const reviewAction = ref<SurveyStatus>('APPROVED');

// Sales Scheduling Form
const scheduleData = ref({
  customerId: '',
  enquiryId: '',
  technicianId: '',
  scheduledDate: new Date().toISOString().split('T')[0],
  surveyNotes: '',
});

// Technician Inspection Report Form
const inspectionData = ref({
  roofDirection: 'South',
  roofTilt: '15 degrees',
  roofCondition: 'RCC Flat Concrete Slab - Excellent structural integrity',
  availableRoofAreaSqFt: '450',
  cableDistanceMeters: '20',
  shadingAssessment: '100% Shadow-Free all seasons',
  gridSuitability: 'Single Phase 230V / 3-Phase 415V Suitable for Net-Metering',
  structuralObservations: 'Slab thickness 6 inches, easily supports standard HDG modular mounting frames without roof penetration leaks.',
  surveyNotes: 'Client confirmed roof access stairs available. Earthing pit location finalized in north corner.',
  inspectionRecommendation: 'APPROVED',
});

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isAdmin = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_ADMIN') || roles.includes('ROLE_DIRECTOR');
});

const isSales = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_SALES') && !isAdmin.value;
});

const isTech = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_TECHNICIAN') && !isAdmin.value;
});

const fetchInitialData = async () => {
  loading.value = true;
  try {
    const [survRes, custRes, techRes, enqRes] = await Promise.all([
      api.get('/surveys'),
      api.get('/customers'),
      api.get('/technicians'),
      api.get('/enquiries'),
    ]);
    surveys.value = survRes.data;
    customers.value = custRes.data;
    technicians.value = techRes.data;
    enquiries.value = enqRes.data;
    if (techRes.data.length > 0 && !scheduleData.value.technicianId) {
      scheduleData.value.technicianId = techRes.data[0].id.toString();
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleScheduleSubmit = async () => {
  try {
    await api.post('/surveys/schedule', {
      customerId: parseInt(scheduleData.value.customerId),
      enquiryId: scheduleData.value.enquiryId ? parseInt(scheduleData.value.enquiryId) : null,
      technicianId: parseInt(scheduleData.value.technicianId),
      scheduledDate: scheduleData.value.scheduledDate,
      surveyNotes: scheduleData.value.surveyNotes,
    });
    showScheduleModal.value = false;
    scheduleData.value = {
      customerId: '',
      enquiryId: '',
      technicianId: technicians.value.length > 0 ? technicians.value[0].id.toString() : '',
      scheduledDate: new Date().toISOString().split('T')[0],
      surveyNotes: '',
    };
    fetchInitialData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to schedule survey');
  }
};

const openInspectionModal = (surv: SiteSurvey) => {
  inspectionModalSurvey.value = surv;
  inspectionData.value = {
    roofDirection: surv.roofDirection || 'South',
    roofTilt: surv.roofTilt || '15 degrees',
    roofCondition: surv.roofCondition || 'RCC Flat Concrete Slab - Excellent structural integrity',
    availableRoofAreaSqFt: surv.availableRoofAreaSqFt ? surv.availableRoofAreaSqFt.toString() : '450',
    cableDistanceMeters: surv.cableDistanceMeters ? surv.cableDistanceMeters.toString() : '20',
    shadingAssessment: surv.shadingAssessment || '100% Shadow-Free all seasons',
    gridSuitability: surv.gridSuitability || 'Single Phase 230V / 3-Phase 415V Suitable for Net-Metering',
    structuralObservations: surv.structuralObservations || 'RCC slab solid, suitable for HDG modular mounting frame without penetration.',
    surveyNotes: surv.surveyNotes || 'Rooftop surveyed. Verified clear solar access and earthing conduit path.',
    inspectionRecommendation: (surv.inspectionRecommendation as any) || 'APPROVED',
  };
};

const handleInspectionSubmit = async (isDraft: boolean) => {
  if (!inspectionModalSurvey.value) return;
  try {
    await api.post(`/surveys/${inspectionModalSurvey.value.id}/inspection-report`, {
      roofDirection: inspectionData.value.roofDirection,
      roofTilt: inspectionData.value.roofTilt,
      roofCondition: inspectionData.value.roofCondition,
      availableRoofAreaSqFt: parseFloat(inspectionData.value.availableRoofAreaSqFt),
      cableDistanceMeters: parseFloat(inspectionData.value.cableDistanceMeters),
      shadingAssessment: inspectionData.value.shadingAssessment,
      gridSuitability: inspectionData.value.gridSuitability,
      structuralObservations: inspectionData.value.structuralObservations,
      surveyNotes: inspectionData.value.surveyNotes,
      inspectionRecommendation: inspectionData.value.inspectionRecommendation,
      draft: isDraft,
    });
    inspectionModalSurvey.value = null;
    fetchInitialData();
    alert(isDraft ? 'Inspection report draft saved successfully.' : 'Site Inspection Report successfully submitted to Sales for technical review!');
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to submit inspection report');
  }
};

const handleReviewSubmit = async () => {
  if (!reviewModalSurvey.value) return;
  try {
    await api.patch(`/surveys/${reviewModalSurvey.value.id}/approval`, {
      status: reviewAction.value,
      approvalNotes: reviewNotes.value,
    });
    reviewModalSurvey.value = null;
    reviewNotes.value = '';
    fetchInitialData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to review survey');
  }
};

const handlePhotoUploaded = async (photoUrl: string, caption: string) => {
  if (!photoModalSurvey.value) return;
  const currentSurvId = photoModalSurvey.value.id;
  try {
    await api.post(`/surveys/${currentSurvId}/photos`, {
      photoUrl,
      caption,
    });
    photoModalSurvey.value = null;
    await fetchInitialData();
    if (viewPhotosSurvey.value && viewPhotosSurvey.value.id === currentSurvId) {
      const refreshed = surveys.value.find((s) => s.id === currentSurvId);
      if (refreshed) viewPhotosSurvey.value = refreshed;
    }
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to attach photo to survey');
  }
};

const proceedToQuotation = (surv: SiteSurvey) => {
  router.push({
    path: '/quotations',
    query: { siteSurveyId: String(surv.id) },
  });
};

onMounted(() => {
  fetchInitialData();
  if (route.query.customerId) {
    scheduleData.value.customerId = String(route.query.customerId);
    if (route.query.enquiryId) {
      scheduleData.value.enquiryId = String(route.query.enquiryId);
    }
    showScheduleModal.value = true;
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Rooftop Site Surveys</h1>
        <p class="text-sm text-slate-500">
          Separated responsibilities: Sales schedules appointments • Technician conducts physical inspection • Sales reviews & generates quotations
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="isSales"
          type="button"
          @click="showScheduleModal = true"
          class="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>Schedule Site Survey</span>
        </button>
      </div>
    </div>


    <!-- Surveys List Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">Survey #</th>
              <th class="py-3 px-4">Customer</th>
              <th class="py-3 px-4">Assigned Tech</th>
              <th class="py-3 px-4">Scheduled Date</th>
              <th class="py-3 px-4">Roof Specs</th>
              <th class="py-3 px-4">Recommendation</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="surveys.length === 0">
              <td colspan="8" class="py-8 text-center text-slate-400">
                No site surveys scheduled yet.
              </td>
            </tr>
            <tr v-for="surv in surveys" :key="surv.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ surv.surveyNumber }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">
                <div>{{ surv.customer.fullName }}</div>
                <div class="text-[11px] text-slate-400 font-normal">{{ surv.customer.city || surv.customer.phone }}</div>
              </td>
              <td class="py-3 px-4">
                <span class="font-medium text-slate-700">{{ surv.technician.name }}</span>
                <span class="block text-[10px] text-slate-400">{{ surv.technician.phone }}</span>
              </td>
              <td class="py-3 px-4 whitespace-nowrap">{{ surv.scheduledDate }}</td>
              <td class="py-3 px-4">
                <template v-if="surv.availableRoofAreaSqFt">
                  <span class="font-bold text-slate-800">{{ surv.availableRoofAreaSqFt }} sq.ft</span>
                  <span class="ml-1 text-[11px] text-slate-500">({{ surv.roofDirection }})</span>
                </template>
                <span v-else class="text-slate-400 italic">Pending Inspection</span>
              </td>
              <td class="py-3 px-4">
                <span v-if="surv.inspectionRecommendation" class="font-semibold text-slate-700">
                  {{ surv.inspectionRecommendation }}
                </span>
                <span v-else class="text-slate-400">-</span>
              </td>
              <td class="py-3 px-4">
                <StatusBadge :status="surv.status" />
              </td>
              <td class="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                <!-- Action: View Photos (Sales Lead & All) -->
                <button
                  type="button"
                  @click="viewPhotosSurvey = surv"
                  class="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium cursor-pointer inline-flex items-center space-x-1"
                >
                  <Camera class="w-3.5 h-3.5" />
                  <span>Photos ({{ surv.photos ? surv.photos.length : 0 }})</span>
                </button>

                <!-- Action: Attach Photo (Technician / Admin only - Sales does not upload survey photos) -->
                <button
                  v-if="isTech || isAdmin"
                  type="button"
                  @click="photoModalSurvey = surv"
                  class="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded font-semibold cursor-pointer inline-flex items-center space-x-1"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>Attach Photo</span>
                </button>

                <!-- Action: View Report -->
                <button
                  v-if="surv.availableRoofAreaSqFt"
                  type="button"
                  @click="viewReportSurvey = surv"
                  class="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium cursor-pointer inline-flex items-center space-x-1"
                >
                  <FileText class="w-3.5 h-3.5" />
                  <span>View Findings</span>
                </button>

                <!-- Action: Technician Conducts Physical Inspection -->
                <button
                  v-if="isTech && ['SCHEDULED', 'IN_PROGRESS', 'REVISIT_REQUIRED'].includes(surv.status)"
                  type="button"
                  @click="openInspectionModal(surv)"
                  class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold shadow-xs cursor-pointer inline-flex items-center space-x-1"
                >
                  <Camera class="w-3 h-3" />
                  <span>Conduct Physical Inspection</span>
                </button>

                <!-- Action: Sales Lead Reviews Findings -->
                <button
                  v-if="isSales && surv.status === 'REPORT_SUBMITTED'"
                  type="button"
                  @click="reviewModalSurvey = surv; reviewAction = 'APPROVED'; reviewNotes = ''"
                  class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold shadow-xs cursor-pointer inline-flex items-center space-x-1"
                >
                  <CheckCircle2 class="w-3 h-3" />
                  <span>Review & Approve</span>
                </button>

                <!-- Action: Sales Proceeds to Generate Quote -->
                <button
                  v-if="isSales && surv.status === 'APPROVED'"
                  type="button"
                  @click="proceedToQuotation(surv)"
                  class="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold shadow-xs cursor-pointer inline-flex items-center space-x-1"
                >
                  <Zap class="w-3 h-3" />
                  <span>Generate Quote</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Schedule Site Survey (Sales Lead) -->
    <div v-if="showScheduleModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h2 class="text-lg font-bold text-slate-900">Schedule Physical Site Survey</h2>
          <button type="button" @click="showScheduleModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="handleScheduleSubmit" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Select Customer *</label>
            <select
              required
              v-model="scheduleData.customerId"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">-- Choose Customer --</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">
                {{ c.fullName }} ({{ c.phone }}) - {{ c.city }}
              </option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Associated Enquiry / Lead (Optional)</label>
            <select
              v-model="scheduleData.enquiryId"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">-- Direct Booking (No Prior Enquiry) --</option>
              <option v-for="e in enquiries" :key="e.id" :value="e.id">
                {{ e.enquiryNumber }} - {{ e.customer.fullName }} ({{ e.requestedCapacityKw }} kW)
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Assign Certified Technician *</label>
              <select
                required
                v-model="scheduleData.technicianId"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option v-for="t in technicians" :key="t.id" :value="t.id">
                  {{ t.name }} ({{ t.phone }})
                </option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Scheduled Inspection Date *</label>
              <input
                type="date"
                required
                v-model="scheduleData.scheduledDate"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Instructions for Technician</label>
            <textarea
              rows="2"
              v-model="scheduleData.surveyNotes"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. Inquire about terrace access, check three-phase availability..."
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
              Assign & Schedule Survey
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Technician Physical Inspection Report -->
    <div v-if="inspectionModalSurvey" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Technician Physical Site Inspection Report</h2>
            <p class="text-xs text-slate-500">Survey # {{ inspectionModalSurvey.surveyNumber }} • Customer: {{ inspectionModalSurvey.customer.fullName }}</p>
          </div>
          <button type="button" @click="inspectionModalSurvey = null" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <div class="space-y-4 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Roof Direction *</label>
              <select v-model="inspectionData.roofDirection" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="South">South (Optimal Solar Yield)</option>
                <option value="South-West">South-West</option>
                <option value="South-East">South-East</option>
                <option value="East">East</option>
                <option value="West">West</option>
                <option value="North">North (Not Recommended)</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Roof Tilt Angle *</label>
              <input type="text" v-model="inspectionData.roofTilt" placeholder="e.g. 15 degrees" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Available Shadow-Free Area (sq. ft) *</label>
              <input type="number" v-model="inspectionData.availableRoofAreaSqFt" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Inverter-to-Grid Cable Distance (Meters) *</label>
              <input type="number" v-model="inspectionData.cableDistanceMeters" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Roof Surface Type & Condition *</label>
            <input type="text" v-model="inspectionData.roofCondition" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Shading Assessment *</label>
            <input type="text" v-model="inspectionData.shadingAssessment" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Grid Suitability / Electrical Panel Phase *</label>
            <input type="text" v-model="inspectionData.gridSuitability" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Structural & Mounting Observations *</label>
            <textarea rows="2" v-model="inspectionData.structuralObservations" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"></textarea>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Technician Recommendation *</label>
            <select v-model="inspectionData.inspectionRecommendation" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
              <option value="APPROVED">APPROVED - Rooftop feasible, proceed with BOM quotation</option>
              <option value="REVISIT_REQUIRED">REVISIT_REQUIRED - Shading obstacles or parapet modification needed</option>
              <option value="REJECTED">REJECTED - Structural damage or severe obstruction, infeasible</option>
            </select>
          </div>

          <div class="flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="handleInspectionSubmit(true)"
              class="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Save as Draft
            </button>
            <div class="space-x-2">
              <button
                type="button"
                @click="inspectionModalSurvey = null"
                class="px-4 py-2 text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="handleInspectionSubmit(false)"
                class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
              >
                Submit Final Report to Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Sales Lead Reviews Findings -->
    <div v-if="reviewModalSurvey" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 class="text-lg font-bold text-slate-900 mb-1">Technical Review & Approval</h2>
        <p class="text-xs text-slate-500 mb-4">Survey # {{ reviewModalSurvey.surveyNumber }}</p>

        <form @submit.prevent="handleReviewSubmit" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Approval Decision *</label>
            <select v-model="reviewAction" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
              <option value="APPROVED">APPROVE - Grant permission to generate BOM Quotation</option>
              <option value="REVISIT_REQUIRED">REQUEST REVISIT - Demand additional photos or measurements</option>
              <option value="REJECTED">REJECT - Deny proposal due to technical unviability</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Approval Review Notes *</label>
            <textarea
              required
              rows="3"
              v-model="reviewNotes"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. Findings reviewed and validated against PM Surya Ghar rooftop norms."
            ></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="reviewModalSurvey = null"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-xs cursor-pointer"
            >
              Confirm Technical Review
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: View Comprehensive Findings Report -->
    <div v-if="viewReportSurvey" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Site Survey Findings Report</h2>
            <p class="text-xs text-slate-500">Ref: {{ viewReportSurvey.surveyNumber }} • Customer: {{ viewReportSurvey.customer.fullName }}</p>
          </div>
          <button type="button" @click="viewReportSurvey = null" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <div class="space-y-4 text-xs text-slate-700">
          <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Roof Direction</span>
              <span class="font-bold text-slate-900 text-sm">{{ viewReportSurvey.roofDirection }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Shadow-Free Area</span>
              <span class="font-bold text-emerald-800 text-sm">{{ viewReportSurvey.availableRoofAreaSqFt }} sq. ft</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Tilt Angle</span>
              <span class="font-medium text-slate-900">{{ viewReportSurvey.roofTilt || '15°' }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Cable Run Length</span>
              <span class="font-medium text-slate-900">{{ viewReportSurvey.cableDistanceMeters }} meters</span>
            </div>
          </div>

          <div class="space-y-2">
            <div>
              <span class="font-bold text-slate-900 block">Condition:</span>
              <p class="text-slate-600 bg-white p-2 rounded border border-slate-100">{{ viewReportSurvey.roofCondition }}</p>
            </div>
            <div>
              <span class="font-bold text-slate-900 block">Shading Assessment:</span>
              <p class="text-slate-600 bg-white p-2 rounded border border-slate-100">{{ viewReportSurvey.shadingAssessment }}</p>
            </div>
            <div>
              <span class="font-bold text-slate-900 block">Grid & Phase Suitability:</span>
              <p class="text-slate-600 bg-white p-2 rounded border border-slate-100">{{ viewReportSurvey.gridSuitability }}</p>
            </div>
            <div>
              <span class="font-bold text-slate-900 block">Structural Observations:</span>
              <p class="text-slate-600 bg-white p-2 rounded border border-slate-100">{{ viewReportSurvey.structuralObservations }}</p>
            </div>
          </div>

          <!-- Uploaded Photos Gallery -->
          <div v-if="viewReportSurvey.photos && viewReportSurvey.photos.length > 0">
            <h3 class="font-bold text-slate-900 mb-2">Attached Rooftop Inspection Evidence</h3>
            <div class="grid grid-cols-2 gap-2">
              <div v-for="p in viewReportSurvey.photos" :key="p.id" class="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <img :src="p.photoUrl" :alt="p.caption" class="w-full h-32 object-cover" />
                <p class="p-1.5 text-[10px] text-slate-600 truncate">{{ p.caption }}</p>
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="viewReportSurvey = null"
              class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: View Site Survey Photos (For Sales Lead & Technical Review) -->
    <div v-if="viewPhotosSurvey" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center space-x-2">
              <Camera class="w-5 h-5 text-emerald-600" />
              <h2 class="text-lg font-bold text-slate-900">Rooftop Site Survey Photographs</h2>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Survey {{ viewPhotosSurvey.surveyNumber }} • Customer: <span class="font-semibold text-slate-700">{{ viewPhotosSurvey.customer?.fullName }}</span> • Technician: <span class="font-semibold text-slate-700">{{ viewPhotosSurvey.technician?.name || 'Assigned Crew' }}</span>
            </p>
          </div>
          <button type="button" @click="viewPhotosSurvey = null" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <div v-if="!viewPhotosSurvey.photos || viewPhotosSurvey.photos.length === 0" class="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Camera class="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p class="text-xs font-semibold text-slate-600">No rooftop photographs attached yet</p>
          <p class="text-[11px] text-slate-400 mt-1">Technician will upload photos during on-site physical inspection.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div
            v-for="p in viewPhotosSurvey.photos"
            :key="p.id"
            class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-2xs hover:shadow-md transition"
          >
            <a :href="p.photoUrl" target="_blank" rel="noopener noreferrer" class="block group relative">
              <img :src="p.photoUrl" :alt="p.caption || 'Site survey photo'" class="w-full h-40 object-cover group-hover:opacity-95 transition" />
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs font-medium">
                Click to view full photo
              </div>
            </a>
            <div class="p-2.5">
              <p class="text-xs font-semibold text-slate-800 line-clamp-2">{{ p.caption || 'Rooftop inspection photo' }}</p>
              <p class="text-[10px] text-slate-400 mt-1">{{ p.uploadedAt ? new Date(p.uploadedAt).toLocaleString() : '' }}</p>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <button
              v-if="isTech || isAdmin"
              type="button"
              @click="photoModalSurvey = viewPhotosSurvey"
              class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Attach Another Photo</span>
            </button>
          </div>
          <button
            type="button"
            @click="viewPhotosSurvey = null"
            class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Live Camera & Photo Upload -->
    <CameraPhotoUpload
      v-if="photoModalSurvey"
      title="Attach Rooftop Survey Photograph"
      subtitle="Take photo using camera or choose image file from device"
      caption-placeholder="e.g. South azimuth shadow analysis or terrace parapet angle"
      @photo-uploaded="handlePhotoUploaded"
      @close="photoModalSurvey = null"
    />
  </div>
</template>
