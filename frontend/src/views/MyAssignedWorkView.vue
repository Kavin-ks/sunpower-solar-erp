<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import api from '../api/client';
import StatusBadge from '../components/ui/StatusBadge.vue';
import CameraPhotoUpload from '../components/common/CameraPhotoUpload.vue';
import CommissioningReportModal from '../components/common/CommissioningReportModal.vue';
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
  RefreshCw,
  FileText,
  PenTool
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
const showSiteArrivalModal = ref(false);
const siteArrivalInst = ref<any | null>(null);
const siteArrivalNotes = ref('Technician crew arrived on site. Dispatched components and rooftop structure inspected.');
const siteArrivalPhotoUrl = ref('https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800');

const showCommissioningPdf = ref(false);
const activeDossierInstallation = ref<any | null>(null);

const defaultSignature = (name: string) => {
  const cleanName = (name || 'Customer').trim();
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="340" height="95" viewBox="0 0 340 95">
    <rect width="100%" height="100%" fill="%23fdfcf9" rx="8" stroke="%23e2e8f0"/>
    <line x1="20" y1="70" x2="320" y2="70" stroke="%23cbd5e1" stroke-width="1" stroke-dasharray="4,4"/>
    <text x="24" y="85" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="9" fill="%2364748b">Verified Customer Sign-off • ${dateStr}</text>
    <text x="28" y="52" font-family="'Brush Script MT', 'Segoe Script', 'Caveat', cursive" font-size="34" font-style="italic" font-weight="600" fill="%230f172a" transform="rotate(-2 28 52)">${encodeURIComponent(cleanName)}</text>
    <path d="M 22 64 Q 100 76 195 62 T 310 66" fill="none" stroke="%231e293b" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M 220 59 Q 260 55 290 62" fill="none" stroke="%232563eb" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`;
};

// Signature Pad State & Methods
const showSignaturePad = ref(false);
const signatureCanvasRef = ref<HTMLCanvasElement | null>(null);
let isDrawing = false;
let sigCtx: CanvasRenderingContext2D | null = null;

const initSigCanvas = () => {
  if (signatureCanvasRef.value) {
    sigCtx = signatureCanvasRef.value.getContext('2d');
    if (sigCtx) {
      sigCtx.lineWidth = 2.5;
      sigCtx.lineCap = 'round';
      sigCtx.strokeStyle = '#0f172a';
    }
  }
};

const startDrawing = (e: MouseEvent) => {
  isDrawing = true;
  initSigCanvas();
  if (!sigCtx || !signatureCanvasRef.value) return;
  const rect = signatureCanvasRef.value.getBoundingClientRect();
  sigCtx.beginPath();
  sigCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
};

const draw = (e: MouseEvent) => {
  if (!isDrawing || !sigCtx || !signatureCanvasRef.value) return;
  const rect = signatureCanvasRef.value.getBoundingClientRect();
  sigCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  sigCtx.stroke();
};

const stopDrawing = () => {
  isDrawing = false;
};

const startDrawingTouch = (e: TouchEvent) => {
  e.preventDefault();
  isDrawing = true;
  initSigCanvas();
  if (!sigCtx || !signatureCanvasRef.value || e.touches.length === 0) return;
  const rect = signatureCanvasRef.value.getBoundingClientRect();
  sigCtx.beginPath();
  sigCtx.moveTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
};

const drawTouch = (e: TouchEvent) => {
  e.preventDefault();
  if (!isDrawing || !sigCtx || !signatureCanvasRef.value || e.touches.length === 0) return;
  const rect = signatureCanvasRef.value.getBoundingClientRect();
  sigCtx.lineTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
  sigCtx.stroke();
};

const clearSignatureCanvas = () => {
  if (!sigCtx || !signatureCanvasRef.value) return;
  sigCtx.clearRect(0, 0, signatureCanvasRef.value.width, signatureCanvasRef.value.height);
};

const saveCanvasSignature = () => {
  if (!signatureCanvasRef.value) return;
  installCompleteForm.value.customerSignatureUrl = signatureCanvasRef.value.toDataURL('image/png');
  showSignaturePad.value = false;
};

const installCompleteForm = ref({
  installedCapacityKw: '5.0',
  actualStartTime: '',
  actualFinishTime: '',
  panelMountingConfirmed: true,
  wiringConfirmed: true,
  earthingConfirmed: true,
  testingPassed: true,
  testingNotes: 'String open-circuit voltage Voc = 380V. Short-circuit current Isc = 11.2A. Inverter grid sync test passed at 4.9 kW peak.',
  customerSigneeName: '',
  customerSignatureUrl: '',
  hoursWorked: '7.5',
  completionPhotoUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800',
  completionReportPdfUrl: '',
});

// Survey photo modals
const photoModalSurvey = ref<any | null>(null);
const viewPhotosSurvey = ref<any | null>(null);

// Installation photo modals
const photoModalInstallation = ref<any | null>(null);
const viewPhotosInstallation = ref<any | null>(null);
const installationPhotoStage = ref('STRUCTURE_MOUNTING');

// Service ticket complete modal & camera fields
const showServiceCompleteModal = ref(false);
const selectedServiceTicket = ref<any | null>(null);
const activeCameraField = ref<'before' | 'after' | null>(null);
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
    alert(
      isDraft
        ? 'Inspection draft saved.'
        : surveyForm.value.inspectionRecommendation === 'APPROVED'
        ? 'Site Survey APPROVED successfully! Sales Lead can now proceed immediately with BOM Quotation.'
        : 'Technical Inspection Report submitted to Sales.'
    );
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to submit inspection report');
  }
};

const handleSurveyPhotoUploaded = async (photoUrl: string, caption: string) => {
  if (!photoModalSurvey.value) return;
  const sId = photoModalSurvey.value.id;
  try {
    await api.post(`/surveys/${sId}/photos`, {
      photoUrl,
      caption,
    });
    photoModalSurvey.value = null;
    await fetchMyWork();
    if (viewPhotosSurvey.value && viewPhotosSurvey.value.id === sId) {
      const updated = surveys.value.find((s) => s.id === sId);
      if (updated) viewPhotosSurvey.value = updated;
    }
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to attach photo to survey');
  }
};

const handleInstallPhotoUploaded = async (photoUrl: string, caption: string) => {
  if (!photoModalInstallation.value) return;
  const instId = photoModalInstallation.value.id;
  try {
    await api.post(`/installations/${instId}/photos`, {
      photoUrl,
      stage: installationPhotoStage.value,
      caption,
    });
    photoModalInstallation.value = null;
    await fetchMyWork();
    if (viewPhotosInstallation.value && viewPhotosInstallation.value.id === instId) {
      const updated = installations.value.find((i) => i.id === instId);
      if (updated) viewPhotosInstallation.value = updated;
    }
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to attach photo to installation');
  }
};

const onServicePhotoCaptured = (photoUrl: string) => {
  if (activeCameraField.value === 'before') {
    serviceCompleteForm.value.beforePhotoUrl = photoUrl;
  } else if (activeCameraField.value === 'after') {
    serviceCompleteForm.value.afterPhotoUrl = photoUrl;
  }
  activeCameraField.value = null;
};

// --- INSTALLATION ACTIONS ---
const isLeadForInstallation = (inst: any) => {
  const currentUsername = authStore.user?.username;
  const currentRoles = authStore.user?.roles || [];
  if (currentRoles.includes('ROLE_ADMIN') || currentRoles.includes('ROLE_DIRECTOR')) return true;
  if (!inst.assignedTechnicians || inst.assignedTechnicians.length === 0) return true;
  const match = inst.assignedTechnicians.find(
    (it: any) =>
      it.technician?.user?.username === currentUsername ||
      it.technician?.name?.toLowerCase().includes(currentUsername?.toLowerCase())
  );
  if (!match) return false;
  return Boolean(match.isTeamLead);
};

const openSiteArrivalModal = (inst: any) => {
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
    await fetchMyWork();
    alert(`Site arrival recorded! Status updated to SITE_RECEIVED.`);
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to record site arrival');
  }
};

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
  const now = new Date();
  const start = new Date(now.getTime() - 7.5 * 3600 * 1000);
  installCompleteForm.value = {
    installedCapacityKw: inst.installedCapacityKw ? inst.installedCapacityKw.toString() : (inst.salesOrder?.capacityKw ? inst.salesOrder.capacityKw.toString() : '5.0'),
    actualStartTime: inst.actualStartTime ? new Date(inst.actualStartTime).toISOString().slice(0, 16) : start.toISOString().slice(0, 16),
    actualFinishTime: now.toISOString().slice(0, 16),
    panelMountingConfirmed: true,
    wiringConfirmed: true,
    earthingConfirmed: true,
    testingPassed: true,
    testingNotes: 'String open-circuit voltage Voc = 380V. Short-circuit current Isc = 11.2A. Inverter grid sync test passed at 4.9 kW peak.',
    customerSigneeName: inst.customer?.fullName || '',
    customerSignatureUrl: defaultSignature(inst.customer?.fullName || 'Customer Signature'),
    hoursWorked: '7.5',
    completionPhotoUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800',
    completionReportPdfUrl: `/reports/commissioning-ins-${inst.id}.pdf`
  };
  showInstallCompleteModal.value = true;
};

const openDossierModal = (inst: any) => {
  activeDossierInstallation.value = inst;
  showCommissioningPdf.value = true;
};

const previewDossierFromForm = () => {
  if (!selectedInstallation.value) return;
  if (!installCompleteForm.value.customerSignatureUrl && installCompleteForm.value.customerSigneeName) {
    installCompleteForm.value.customerSignatureUrl = defaultSignature(installCompleteForm.value.customerSigneeName);
  }
  activeDossierInstallation.value = {
    ...selectedInstallation.value,
    installedCapacityKw: parseFloat(installCompleteForm.value.installedCapacityKw) || selectedInstallation.value.installedCapacityKw,
    actualStartTime: installCompleteForm.value.actualStartTime,
    actualFinishTime: installCompleteForm.value.actualFinishTime,
    completionPhotoUrl: installCompleteForm.value.completionPhotoUrl,
    customerSigneeName: installCompleteForm.value.customerSigneeName,
    customerSignatureUrl: installCompleteForm.value.customerSignatureUrl,
    completionReportPdfUrl: installCompleteForm.value.completionReportPdfUrl,
    testingNotes: installCompleteForm.value.testingNotes,
    panelMountingConfirmed: installCompleteForm.value.panelMountingConfirmed,
    wiringConfirmed: installCompleteForm.value.wiringConfirmed,
    earthingConfirmed: installCompleteForm.value.earthingConfirmed,
    testingPassed: installCompleteForm.value.testingPassed,
    status: 'COMPLETED',
  };
  showCommissioningPdf.value = true;
};

const handleInstallationCompleteSubmit = async () => {
  if (!selectedInstallation.value) return;
  if (!installCompleteForm.value.panelMountingConfirmed || !installCompleteForm.value.wiringConfirmed || !installCompleteForm.value.earthingConfirmed) {
    alert('Validation Error: All physical checks (Panel Mounting, Wiring, Earthing) must be confirmed.');
    return;
  }
  if (!installCompleteForm.value.testingPassed || !installCompleteForm.value.testingNotes.trim()) {
    alert('Validation Error: Electrical testing passed status and detailed notes (Voc, Isc, grid sync) are mandatory.');
    return;
  }
  if (!installCompleteForm.value.customerSigneeName.trim()) {
    alert('Validation Error: Customer signee full name is required for formal sign-off.');
    return;
  }
  if (!installCompleteForm.value.customerSignatureUrl.trim()) {
    installCompleteForm.value.customerSignatureUrl = defaultSignature(installCompleteForm.value.customerSigneeName);
  }
  if (!installCompleteForm.value.completionPhotoUrl.trim()) {
    alert('Validation Error: Photo evidence of the completed rooftop solar setup is required.');
    return;
  }

  try {
    await api.post(`/installations/${selectedInstallation.value.id}/complete`, {
      actualStartTime: installCompleteForm.value.actualStartTime,
      actualFinishTime: installCompleteForm.value.actualFinishTime,
      installedCapacityKw: parseFloat(installCompleteForm.value.installedCapacityKw),
      panelMountingConfirmed: installCompleteForm.value.panelMountingConfirmed,
      wiringConfirmed: installCompleteForm.value.wiringConfirmed,
      earthingConfirmed: installCompleteForm.value.earthingConfirmed,
      testingPassed: installCompleteForm.value.testingPassed,
      testingNotes: installCompleteForm.value.testingNotes,
      customerSigneeName: installCompleteForm.value.customerSigneeName,
      customerSignatureUrl: installCompleteForm.value.customerSignatureUrl,
      hoursWorked: parseFloat(installCompleteForm.value.hoursWorked),
      completionPhotoUrl: installCompleteForm.value.completionPhotoUrl,
      completionReportPdfUrl: installCompleteForm.value.completionReportPdfUrl
    });
    showInstallCompleteModal.value = false;
    await fetchMyWork();
    alert('Installation marked COMPLETED! Final rooftop commissioning photos, timeframe, PDF report, and customer digital signature submitted to Warehouse Manager for warranty activation.');
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

watch(() => authStore.user?.username, () => {
  fetchMyWork();
});

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
                    type="button"
                    @click="viewPhotosSurvey = surv"
                    class="px-2.5 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium cursor-pointer inline-flex items-center space-x-1 text-xs"
                  >
                    <Camera class="w-3.5 h-3.5" />
                    <span>Photos ({{ surv.photos ? surv.photos.length : 0 }})</span>
                  </button>

                  <button
                    type="button"
                    @click="photoModalSurvey = surv"
                    class="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg font-semibold cursor-pointer inline-flex items-center space-x-1 text-xs"
                  >
                    <Plus class="w-3.5 h-3.5" />
                    <span>Attach Photo</span>
                  </button>

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
                <th class="py-3 px-4">My Role</th>
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
                <td class="py-3 px-4">
                  <span v-if="isLeadForInstallation(inst)" class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    ⭐ Team Lead
                  </span>
                  <span v-else class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    Crew Member
                  </span>
                </td>
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
                  <button
                    type="button"
                    @click="viewPhotosInstallation = inst"
                    class="px-2.5 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium cursor-pointer inline-flex items-center space-x-1 text-xs"
                  >
                    <Camera class="w-3.5 h-3.5" />
                    <span>Photos ({{ inst.photos ? inst.photos.length : 0 }})</span>
                  </button>

                  <button
                    type="button"
                    @click="photoModalInstallation = inst"
                    class="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg font-semibold cursor-pointer inline-flex items-center space-x-1 text-xs"
                  >
                    <Plus class="w-3.5 h-3.5" />
                    <span>Attach Photo</span>
                  </button>

                  <!-- Status-dependent installation actions -->
                  <template v-if="inst.status === 'SCHEDULED'">
                    <button
                      type="button"
                      @click="openSiteArrivalModal(inst)"
                      class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-2xs transition cursor-pointer text-xs inline-flex items-center space-x-1"
                    >
                      <MapPin class="w-3.5 h-3.5 mr-1" />
                      <span>Site Arrival</span>
                    </button>
                  </template>

                  <template v-else-if="inst.status === 'SITE_RECEIVED'">
                    <button
                      type="button"
                      @click="handleStartInstallation(inst)"
                      class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-2xs transition cursor-pointer text-xs inline-flex items-center space-x-1"
                    >
                      <Play class="w-3.5 h-3.5 mr-1" />
                      <span>Start Installation</span>
                    </button>
                  </template>

                  <template v-else-if="inst.status === 'IN_PROGRESS'">
                    <button
                      type="button"
                      @click="openInstallationComplete(inst)"
                      class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-2xs transition cursor-pointer text-xs inline-flex items-center space-x-1"
                    >
                      <CheckCircle2 class="w-3.5 h-3.5 mr-1" />
                      <span>Submit Commissioning & Sign-Off</span>
                    </button>
                  </template>

                  <template v-else>
                    <div class="inline-flex items-center space-x-1.5">
                      <span
                        v-if="inst.warrantyActivated"
                        class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 inline-flex items-center gap-1"
                        title="Warranty officially activated by Warehouse Manager"
                      >
                        <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" />
                        <span>Warranty Active</span>
                      </span>
                      <span
                        v-else
                        class="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 inline-flex items-center gap-1"
                        title="Commissioning dossier submitted to Warehouse Manager for warranty activation"
                      >
                        <Clock class="w-3.5 h-3.5 text-amber-600" />
                        <span>Awaiting Activation</span>
                      </span>

                      <button
                        type="button"
                        @click="openDossierModal(inst)"
                        class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 inline-flex items-center space-x-1 cursor-pointer transition shadow-2xs"
                        title="View Commissioning Dossier, Customer Signature & Warranties"
                      >
                        <FileText class="w-3.5 h-3.5" />
                        <span>Dossier / PDF</span>
                      </button>
                    </div>
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

          <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
            <span class="font-bold text-emerald-900 block mb-0.5">Approval & Quotation Workflow Notice:</span>
            <p class="text-emerald-700 text-[11px]">
              Submitting recommendation <strong>APPROVED</strong> automatically marks this survey as APPROVED in the system, authorizing the Sales Lead to proceed immediately with BOM Quotation generation.
            </p>
          </div>

          <div class="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button type="button" @click="handleSurveySubmit(true)" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer">
              Save Draft
            </button>
            <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-2xs cursor-pointer">
              {{ surveyForm.inspectionRecommendation === 'APPROVED' ? '✓ Approve & Send to Sales (Ready for Quotation)' : 'Submit Inspection' }}
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
          <!-- Timeframe Section -->
          <div class="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-2">
            <span class="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock class="w-3.5 h-3.5 text-indigo-600" />
              Installation Timeframe & Capacity
            </span>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div>
                <label class="block font-semibold text-slate-700 text-[10px] mb-1">Work Started At *</label>
                <input
                  type="datetime-local"
                  v-model="installCompleteForm.actualStartTime"
                  class="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono bg-white"
                  required
                />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 text-[10px] mb-1">Work Completed At *</label>
                <input
                  type="datetime-local"
                  v-model="installCompleteForm.actualFinishTime"
                  class="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono bg-white"
                  required
                />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-semibold text-slate-700 text-[10px] mb-1">Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    v-model="installCompleteForm.hoursWorked"
                    class="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono bg-white"
                    required
                  />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 text-[10px] mb-1">Capacity (kW)</label>
                  <input
                    type="number"
                    step="0.1"
                    v-model="installCompleteForm.installedCapacityKw"
                    class="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold bg-white"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Quality Checklist -->
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <span class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quality Checklist & Standards</span>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" v-model="installCompleteForm.panelMountingConfirmed" class="rounded text-emerald-600 focus:ring-emerald-500" />
              <span>Solar panels securely mounted, torque-checked, and structural clamps tightened</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" v-model="installCompleteForm.wiringConfirmed" class="rounded text-emerald-600 focus:ring-emerald-500" />
              <span>DC/AC cabling routed through UV-resistant conduits with MC4 waterproof joints</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" v-model="installCompleteForm.earthingConfirmed" class="rounded text-emerald-600 focus:ring-emerald-500" />
              <span>Dual-ground earthing pit connected and resistance verified (&lt; 5 Ohms)</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" v-model="installCompleteForm.testingPassed" class="rounded text-emerald-600 focus:ring-emerald-500" />
              <span>Inverter generation and anti-islanding test passed</span>
            </label>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Testing Notes & Voltage Readings *</label>
            <textarea v-model="installCompleteForm.testingNotes" rows="2" class="w-full border border-slate-200 rounded-lg p-2 text-xs" required></textarea>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Rooftop Commissioning Photo URL *</label>
            <div class="flex gap-2">
              <input
                type="url"
                v-model="installCompleteForm.completionPhotoUrl"
                class="flex-1 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="https://... photo of completed panels & inverter"
                required
              />
              <button
                type="button"
                @click="installCompleteForm.completionPhotoUrl = 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800'"
                class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-[11px] whitespace-nowrap cursor-pointer"
              >
                Sample Photo
              </button>
            </div>
            <div v-if="installCompleteForm.completionPhotoUrl" class="mt-2 h-24 w-full max-w-sm rounded-lg overflow-hidden border border-slate-200">
              <img :src="installCompleteForm.completionPhotoUrl" class="w-full h-full object-cover" alt="Commissioning Rooftop" />
            </div>
          </div>

          <!-- Customer Sign-Off & Digital Signature -->
          <div class="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <PenTool class="w-3.5 h-3.5 text-amber-600" />
                Customer Formal Sign-off & Realistic Digital Signature
              </span>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="installCompleteForm.customerSignatureUrl = defaultSignature(installCompleteForm.customerSigneeName)"
                  class="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded text-[10px] cursor-pointer"
                >
                  Adopt Pen Signature
                </button>
                <button
                  type="button"
                  @click="showSignaturePad = !showSignaturePad"
                  class="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold rounded text-[10px] cursor-pointer flex items-center gap-1"
                >
                  <PenTool class="w-3 h-3 text-indigo-600" />
                  <span>{{ showSignaturePad ? 'Hide Draw Pad' : '✍️ Draw on Screen' }}</span>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              <div>
                <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Customer Signee Full Name *</label>
                <input
                  type="text"
                  v-model="installCompleteForm.customerSigneeName"
                  @input="installCompleteForm.customerSignatureUrl = defaultSignature(installCompleteForm.customerSigneeName)"
                  class="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                  placeholder="e.g. Ramesh Sharma"
                  required
                />
                <span class="text-[10px] text-slate-500 mt-1 block">Customer representative who inspected and accepted the solar setup.</span>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 uppercase text-[10px] mb-1">Customer Digital Signature Preview</label>
                <div class="h-20 w-full bg-white border border-slate-300 rounded-lg flex items-center justify-center p-1.5 relative overflow-hidden shadow-2xs">
                  <img
                    v-if="installCompleteForm.customerSignatureUrl"
                    :src="installCompleteForm.customerSignatureUrl"
                    alt="Customer Digital Signature"
                    class="h-full w-auto object-contain"
                  />
                  <span v-else class="text-[10px] text-slate-400">Enter customer name or draw signature</span>
                </div>
              </div>
            </div>

            <!-- Draw Signature Pad Dropdown -->
            <div v-show="showSignaturePad" class="p-2.5 bg-white rounded-xl border border-slate-300 space-y-2">
              <div class="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span>Draw Signature with finger, stylus, or mouse:</span>
                <button type="button" @click="clearSignatureCanvas" class="text-rose-600 hover:text-rose-700 text-[10px] underline cursor-pointer">
                  Clear Pad
                </button>
              </div>
              <canvas
                ref="signatureCanvasRef"
                width="360"
                height="100"
                class="w-full h-24 border border-dashed border-slate-300 rounded-lg cursor-crosshair touch-none bg-slate-50"
                @mousedown="startDrawing"
                @mousemove="draw"
                @mouseup="stopDrawing"
                @mouseleave="stopDrawing"
                @touchstart="startDrawingTouch"
                @touchmove="drawTouch"
                @touchend="stopDrawing"
              ></canvas>
              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  @click="saveCanvasSignature"
                  class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Apply Drawn Signature
                </button>
              </div>
            </div>
          </div>

          <!-- Commissioning Dossier Report Document Notice -->
          <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <FileCheck class="w-4 h-4 text-emerald-600" />
              <div>
                <span class="text-[11px] font-bold text-slate-800 block">Commissioning Dossier PDF Generated</span>
                <span class="text-[10px] text-slate-500 font-mono">{{ installCompleteForm.completionReportPdfUrl }}</span>
              </div>
            </div>
            <button
              type="button"
              @click="previewDossierFromForm"
              class="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold cursor-pointer inline-flex items-center space-x-1"
            >
              <FileText class="w-3 h-3 text-indigo-600" />
              <span>Preview Dossier PDF</span>
            </button>
          </div>

          <div class="flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="previewDossierFromForm"
              class="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs cursor-pointer inline-flex items-center space-x-1 border border-indigo-200"
            >
              <FileText class="w-3.5 h-3.5" />
              <span>Preview Commissioning PDF</span>
            </button>
            <div class="flex space-x-2">
              <button type="button" @click="showInstallCompleteModal = false" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer">
                Cancel
              </button>
              <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-2xs cursor-pointer flex items-center space-x-1">
                <CheckCircle2 class="w-4 h-4" />
                <span>Submit Dossier to Warehouse Manager</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: SITE ARRIVAL CONFIRMATION -->
    <div v-if="showSiteArrivalModal && siteArrivalInst" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin class="w-5 h-5 text-indigo-600" />
              Confirm Site Arrival: INST-{{ siteArrivalInst.id }}
            </h2>
            <p class="text-xs text-slate-500">
              Customer: {{ siteArrivalInst.customer?.fullName }} • {{ siteArrivalInst.customer?.address || siteArrivalInst.customer?.city }}
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
              <MapPin class="w-4 h-4" />
              <span>Record Site Arrival (SITE_RECEIVED)</span>
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
            <div class="border border-slate-200 rounded-xl p-3 bg-slate-50 text-center">
              <label class="block font-bold text-slate-700 uppercase text-[10px] mb-2">1. Pre-Repair Photograph</label>
              <div v-if="serviceCompleteForm.beforePhotoUrl" class="mb-2">
                <img :src="serviceCompleteForm.beforePhotoUrl" class="w-full h-24 object-cover rounded-lg border border-slate-200" />
                <button type="button" @click="serviceCompleteForm.beforePhotoUrl = ''" class="text-[10px] text-rose-600 hover:underline mt-1 cursor-pointer">Remove</button>
              </div>
              <button
                type="button"
                @click="activeCameraField = 'before'"
                class="w-full py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Camera class="w-3.5 h-3.5" />
                <span>{{ serviceCompleteForm.beforePhotoUrl ? 'Change Photo' : 'Capture / Upload Photo' }}</span>
              </button>
            </div>

            <div class="border border-slate-200 rounded-xl p-3 bg-slate-50 text-center">
              <label class="block font-bold text-slate-700 uppercase text-[10px] mb-2">2. Post-Repair Verification Photo</label>
              <div v-if="serviceCompleteForm.afterPhotoUrl" class="mb-2">
                <img :src="serviceCompleteForm.afterPhotoUrl" class="w-full h-24 object-cover rounded-lg border border-slate-200" />
                <button type="button" @click="serviceCompleteForm.afterPhotoUrl = ''" class="text-[10px] text-rose-600 hover:underline mt-1 cursor-pointer">Remove</button>
              </div>
              <button
                type="button"
                @click="activeCameraField = 'after'"
                class="w-full py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Camera class="w-3.5 h-3.5" />
                <span>{{ serviceCompleteForm.afterPhotoUrl ? 'Change Photo' : 'Capture / Upload Photo' }}</span>
              </button>
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

    <!-- Modal: Service Complaint On-Demand Camera / File Upload -->
    <CameraPhotoUpload
      v-if="activeCameraField"
      :title="activeCameraField === 'before' ? 'Pre-Repair Photo Evidence' : 'Post-Repair Evidence'"
      subtitle="Capture or upload photo using camera or file picker"
      @photo-uploaded="onServicePhotoCaptured"
      @close="activeCameraField = null"
    />

    <!-- Modal: View Site Survey Photos Gallery -->
    <div v-if="viewPhotosSurvey" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center space-x-2">
              <Camera class="w-5 h-5 text-emerald-600" />
              <h2 class="text-lg font-bold text-slate-900">Rooftop Site Survey Photographs</h2>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Survey {{ viewPhotosSurvey.surveyNumber }} • Customer: <span class="font-semibold text-slate-700">{{ viewPhotosSurvey.customer?.fullName }}</span>
            </p>
          </div>
          <button type="button" @click="viewPhotosSurvey = null" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <div v-if="!viewPhotosSurvey.photos || viewPhotosSurvey.photos.length === 0" class="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Camera class="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p class="text-xs font-semibold text-slate-600">No rooftop photographs attached yet</p>
          <p class="text-[11px] text-slate-400 mt-1">Attach photos of the terrace, azimuth angle, and shading obstacles.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div v-for="p in viewPhotosSurvey.photos" :key="p.id" class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-2xs hover:shadow-md transition">
            <a :href="p.photoUrl" target="_blank" rel="noopener noreferrer" class="block group relative">
              <img :src="p.photoUrl" :alt="p.caption || 'Site survey photo'" class="w-full h-40 object-cover group-hover:opacity-95 transition" />
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs font-medium">
                Click to view
              </div>
            </a>
            <div class="p-2.5">
              <p class="text-xs font-semibold text-slate-800 line-clamp-2">{{ p.caption || 'Rooftop inspection photo' }}</p>
              <p class="text-[10px] text-slate-400 mt-1">{{ p.uploadedAt ? new Date(p.uploadedAt).toLocaleString() : '' }}</p>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            @click="photoModalSurvey = viewPhotosSurvey"
            class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Attach Another Photo</span>
          </button>
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

    <!-- Modal: Live Camera & Photo Upload for Site Survey -->
    <CameraPhotoUpload
      v-if="photoModalSurvey"
      title="Attach Rooftop Survey Photograph"
      subtitle="Take photo using camera or choose image file from device"
      caption-placeholder="e.g. South azimuth shadow analysis or terrace parapet angle"
      @photo-uploaded="handleSurveyPhotoUploaded"
      @close="photoModalSurvey = null"
    />

    <!-- Modal: View Installation Photos Gallery -->
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
          <p class="text-[11px] text-slate-400 mt-1">Upload milestone photos for structural mounting and inverter cabling.</p>
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
          <button
            type="button"
            @click="photoModalInstallation = viewPhotosInstallation"
            class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Attach Another Photo</span>
          </button>
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

    <!-- Modal: Live Camera Photo Upload for Installation -->
    <CameraPhotoUpload
      v-if="photoModalInstallation"
      title="Attach Installation Milestone Photograph"
      subtitle="Take photo using camera or choose image file from device"
      caption-placeholder="e.g. Structure anchor bolts or inverter terminal wiring"
      :allowed-stages="['STRUCTURE_MOUNTING', 'PANEL_INSTALLATION', 'INVERTER_WIRING', 'TESTING_COMMISSIONING']"
      :selected-stage="installationPhotoStage"
      @stage-change="(s) => installationPhotoStage = s"
      @photo-uploaded="handleInstallPhotoUploaded"
      @close="photoModalInstallation = null"
    />

    <!-- Modal: Commissioning Report & Dossier PDF View -->
    <CommissioningReportModal
      v-if="showCommissioningPdf && activeDossierInstallation"
      :installation="activeDossierInstallation"
      @close="showCommissioningPdf = false"
    />
  </div>
</template>
