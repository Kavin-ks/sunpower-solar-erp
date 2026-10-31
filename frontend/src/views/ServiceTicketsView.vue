<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '../api/client';
import type { ServiceTicket, Customer, Technician, Product } from '../types';
import StatusBadge from '../components/ui/StatusBadge.vue';
import { useAuthStore } from '../stores/auth';
import { formatFaultCode } from '../utils/faultCatalog';
import { Headphones, Search, ShieldCheck, UserCheck, CheckCircle2, Clock, Eye, Phone, Calendar, Wrench, AlertCircle, FileText, RotateCcw } from 'lucide-vue-next';

const tickets = ref<any[]>([]);
const customers = ref<Customer[]>([]);
const technicians = ref<Technician[]>([]);
const products = ref<Product[]>([]);
const loading = ref(true);
const searchTerm = ref('');
const statusFilter = ref('ALL');

// Modals
const isAssignModalOpen = ref(false);
const isConfirmModalOpen = ref(false);
const isDetailModalOpen = ref(false);
const isOfficerCreateModalOpen = ref(false);
const isReopenModalOpen = ref(false);
const reopenReason = ref('Customer called back stating fault recurred after heavy rain.');
const selectedTicket = ref<any | null>(null);

// Forms
const officerCreateForm = ref({
  customerId: '',
  serialCode: '',
  faultCategory: 'Inverter Error / Grid Sync Drop',
  complaintDescription: '',
  callerPhone: '',
  callerName: '',
});

const selectDemoSerial = (serialCode: string, customerName: string) => {
  createForm.value.serialCode = serialCode;
  const match = customers.value.find((c: any) => c.fullName && c.fullName.toLowerCase().includes(customerName.toLowerCase()));
  if (match) {
    createForm.value.customerId = String(match.id);
  }
};

const assignTechId = ref('');

const confirmForm = ref({
  customerSatisfactionNotes: 'Customer tested and acknowledged solar generation restored at full capacity.',
  confirmedByCustomerName: '',
});

const authStore = useAuthStore();
const isAdmin = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_ADMIN');
});
const isSupport = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_SUPPORT');
});

const fetchTickets = async () => {
  try {
    loading.value = true;
    const res = await api.get('/service-tickets');
    tickets.value = res.data;
  } catch (err) {
    console.error('Failed to load tickets', err);
  } finally {
    loading.value = false;
  }
};

const fetchAuxiliaryData = async () => {
  try {
    const [custRes, techRes, prodRes] = await Promise.all([
      api.get('/customers'),
      api.get('/technicians'),
      api.get('/products'),
    ]);
    customers.value = custRes.data;
    technicians.value = techRes.data;
    products.value = prodRes.data;
  } catch (err) {
    console.error('Failed to load auxiliary data', err);
  }
};

const handleAssign = async () => {
  if (!selectedTicket.value || !assignTechId.value) return;
  try {
    await api.patch(`/service-tickets/${selectedTicket.value.id}/assign/${assignTechId.value}`);
    isAssignModalOpen.value = false;
    selectedTicket.value = null;
    await fetchTickets();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to assign technician');
  }
};

const handleConfirmSubmit = async () => {
  if (!selectedTicket.value) return;
  try {
    await api.post(`/service-tickets/${selectedTicket.value.id}/confirm-and-close`, {
      customerSatisfactionNotes: confirmForm.value.customerSatisfactionNotes,
      confirmedByCustomerName: confirmForm.value.confirmedByCustomerName,
    });
    isConfirmModalOpen.value = false;
    selectedTicket.value = null;
    await fetchTickets();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to confirm customer satisfaction and close ticket');
  }
};

const openReopenModal = (ticket: any) => {
  selectedTicket.value = ticket;
  reopenReason.value = 'Customer reported issue remains unresolved upon testing.';
  isReopenModalOpen.value = true;
};

const handleReopenSubmit = async () => {
  if (!selectedTicket.value) return;
  try {
    await api.post(`/service-tickets/${selectedTicket.value.id}/reopen`, {
      reopenReason: reopenReason.value,
    });
    isReopenModalOpen.value = false;
    selectedTicket.value = null;
    await fetchTickets();
    alert('Complaint reopened and routed back for technician reinspection.');
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to reopen complaint');
  }
};

const handleOfficerCreate = async () => {
  try {
    await api.post('/service-tickets/public/submit', {
      customerPhone: officerCreateForm.value.callerPhone,
      customerName: officerCreateForm.value.callerName,
      serialCode: officerCreateForm.value.serialCode.trim(),
      faultCategory: officerCreateForm.value.faultCategory,
      complaintDescription: `[OFFICER-ASSISTED PHONE CALL taken by ${authStore.user?.fullName || 'Support Officer'}] ${officerCreateForm.value.complaintDescription}`,
    });
    isOfficerCreateModalOpen.value = false;
    officerCreateForm.value = {
      customerId: '',
      serialCode: '',
      faultCategory: 'Inverter Error / Grid Sync Drop',
      complaintDescription: '',
      callerPhone: '',
      callerName: '',
    };
    await fetchTickets();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to record officer-assisted ticket');
  }
};

const openDetailModal = async (ticket: any) => {
  try {
    const res = await api.get(`/service-tickets/${ticket.id}`);
    selectedTicket.value = res.data;
  } catch (e) {
    selectedTicket.value = ticket;
  }
  isDetailModalOpen.value = true;
};

const filteredTickets = computed(() => {
  return tickets.value.filter((t) => {
    const matchesSearch =
      searchTerm.value === '' ||
      t.ticketNumber?.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      t.customer?.fullName?.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      t.serialNumber?.serialCode?.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      t.faultCode?.toLowerCase().includes(searchTerm.value.toLowerCase());

    const matchesStatus =
      statusFilter.value === 'ALL' || t.status === statusFilter.value;

    return matchesSearch && matchesStatus;
  });
});

onMounted(() => {
  fetchTickets();
  fetchAuxiliaryData();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header: Notice Register New Complaint is removed for Support department as complaints originate from customer portal -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Customer Service & Complaint Management</h1>
        <p class="text-sm text-slate-500">
          Inbound customer portal complaints • Warranty adjudication • Field technician dispatch & sign-off
        </p>
      </div>

      <!-- Support officers can record an officer-assisted call when a customer calls in -->
      <div class="flex items-center gap-2">
        <button
          v-if="isAdmin || isSupport"
          type="button"
          @click="isOfficerCreateModalOpen = true"
          class="flex items-center space-x-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
        >
          <Phone class="w-3.5 h-3.5 text-slate-500" />
          <span>Record Officer-Assisted Call</span>
        </button>
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
        <option value="ALL">All Statuses</option>
        <option value="OPEN">Open (Awaiting Assignment)</option>
        <option value="ASSIGNED">Assigned to Technician</option>
        <option value="IN_PROGRESS">In Progress on Site</option>
        <option value="RESOLVED">Technician Completed</option>
        <option value="CLOSED">Customer Confirmed & Closed</option>
      </select>
    </div>

    <!-- Tickets Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">Ticket #</th>
              <th class="py-3 px-4">Origin / Source</th>
              <th class="py-3 px-4">Customer</th>
              <th class="py-3 px-4">Serial / Warranty</th>
              <th class="py-3 px-4">Fault Category</th>
              <th class="py-3 px-4">Assigned Tech</th>
              <th class="py-3 px-4">Customer Charge</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredTickets.length === 0">
              <td colspan="9" class="py-8 text-center text-slate-400">
                No service tickets found matching search criteria.
              </td>
            </tr>
            <tr v-for="t in filteredTickets" :key="t.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">
                {{ t.ticketNumber }}
              </td>
              <td class="py-3 px-4">
                <span v-if="t.submissionSource === 'CUSTOMER_PORTAL'" class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Customer Portal
                </span>
                <span v-else class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Officer-Assisted
                </span>
              </td>
              <td class="py-3 px-4 font-semibold text-slate-800">
                <div>{{ t.customer?.fullName }}</div>
                <div class="text-[11px] text-slate-400 font-normal">{{ t.customer?.phone }}</div>
              </td>
              <td class="py-3 px-4">
                <div v-if="t.underWarranty" class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ✓ Active Warranty
                </div>
                <div v-else class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  Out of Warranty
                </div>
                <div v-if="t.serialNumber" class="block font-mono text-[10px] text-slate-500 mt-0.5">
                  {{ t.serialNumber.serialCode }}
                </div>
              </td>
              <td class="py-3 px-4">
                <span class="font-medium text-slate-800">{{ formatFaultCode(t.faultCode) }}</span>
              </td>
              <td class="py-3 px-4">
                <span v-if="t.assignedTechnician" class="font-semibold text-slate-800">{{ t.assignedTechnician.name }}</span>
                <span v-else class="text-slate-400 italic">Unassigned</span>
              </td>
              <td class="py-3 px-4">
                <!-- Authoritative charge display: No ₹0 (Warranty) for Out of Warranty -->
                <div v-if="t.underWarranty" class="text-emerald-700 font-bold">
                  ₹0 (Warranty)
                </div>
                <div v-else-if="t.totalCustomerCharges > 0" class="font-bold text-slate-900">
                  ₹{{ t.totalCustomerCharges }} <span class="text-[10px] text-rose-600 font-medium">(Chargeable)</span>
                </div>
                <div v-else class="text-amber-700 font-medium">
                  Pending Estimation
                </div>
                <div class="text-[10px] text-slate-400 font-mono">{{ t.chargeStatusText || '' }}</div>
              </td>
              <td class="py-3 px-4">
                <StatusBadge :status="t.status" />
              </td>
              <td class="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                <!-- Status-dependent actions as required by section 7 -->
                <template v-if="t.status === 'OPEN'">
                  <button
                    type="button"
                    @click="openDetailModal(t)"
                    class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer text-xs"
                  >
                    View Complaint
                  </button>
                  <button
                    v-if="isAdmin || isSupport"
                    type="button"
                    @click="selectedTicket = t; isAssignModalOpen = true"
                    class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold cursor-pointer text-xs"
                  >
                    Assign Tech
                  </button>
                </template>

                <template v-else-if="t.status === 'ASSIGNED'">
                  <button
                    type="button"
                    @click="openDetailModal(t)"
                    class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer text-xs"
                  >
                    View Details
                  </button>
                </template>

                <template v-else-if="t.status === 'IN_PROGRESS'">
                  <button
                    type="button"
                    @click="openDetailModal(t)"
                    class="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded font-semibold cursor-pointer text-xs"
                  >
                    View Work Progress
                  </button>
                </template>

                <template v-else-if="t.status === 'RESOLVED'">
                  <button
                    type="button"
                    @click="openDetailModal(t)"
                    class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer text-xs"
                  >
                    Review Repair
                  </button>
                  <button
                    v-if="isAdmin || isSupport"
                    type="button"
                    @click="selectedTicket = t; isConfirmModalOpen = true"
                    class="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded font-semibold cursor-pointer text-xs"
                  >
                    Confirm & Close
                  </button>
                </template>

                <template v-else-if="t.status === 'CLOSED'">
                  <button
                    type="button"
                    @click="openDetailModal(t)"
                    class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer text-xs"
                  >
                    View Complete History
                  </button>
                  <button
                    v-if="isAdmin || isSupport"
                    type="button"
                    @click="openReopenModal(t)"
                    class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-semibold cursor-pointer text-xs"
                    title="Authorized reopening if customer reports recurring issue"
                  >
                    Reopen Complaint
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: View Complaint / History Details -->
    <div v-if="isDetailModalOpen && selectedTicket" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-mono text-base font-bold text-slate-900">{{ selectedTicket.ticketNumber }}</span>
              <StatusBadge :status="selectedTicket.status" />
            </div>
            <p class="text-xs text-slate-500">Source: {{ selectedTicket.submissionSource }} • Reported: {{ selectedTicket.reportedDate }}</p>
          </div>
          <button type="button" @click="isDetailModalOpen = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <div class="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <span class="text-slate-400 block">Customer</span>
            <span class="font-bold text-slate-900">{{ selectedTicket.customer?.fullName }}</span>
            <span class="text-slate-500 block">{{ selectedTicket.customer?.phone }}</span>
          </div>
          <div>
            <span class="text-slate-400 block">Equipment & Serial</span>
            <span class="font-bold text-slate-900">{{ selectedTicket.serialNumber?.product?.name || 'Solar Equipment' }}</span>
            <span class="font-mono text-slate-600 block">{{ selectedTicket.serialNumber?.serialCode || 'N/A' }}</span>
          </div>
          <div>
            <span class="text-slate-400 block">Warranty Adjudication</span>
            <span :class="selectedTicket.underWarranty ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'">
              {{ selectedTicket.warrantyCoverageStatus || (selectedTicket.underWarranty ? 'Active Warranty' : 'Out of Warranty') }}
            </span>
          </div>
          <div>
            <span class="text-slate-400 block">Assigned Technician</span>
            <span class="font-bold text-slate-900">{{ selectedTicket.assignedTechnician?.name || 'Not yet assigned' }}</span>
          </div>
        </div>

        <div class="text-xs">
          <label class="font-bold text-slate-700 block mb-1">Customer Problem Description</label>
          <div class="bg-white p-3 rounded-lg border border-slate-200 text-slate-700">
            {{ selectedTicket.complaintDescription }}
          </div>
        </div>

        <div v-if="selectedTicket.complaintPhotoUrl" class="text-xs">
          <label class="font-bold text-slate-700 block mb-1">Complaint Photo Uploaded by Customer</label>
          <img :src="selectedTicket.complaintPhotoUrl" alt="Complaint evidence" class="w-48 h-32 object-cover rounded-lg border border-slate-200" />
        </div>

        <div v-if="selectedTicket.diagnosisNotes" class="text-xs space-y-2">
          <label class="font-bold text-slate-700 block">Technician On-Site Diagnostics & Resolution</label>
          <div class="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-slate-800 space-y-1">
            <p><strong>Diagnosis:</strong> {{ selectedTicket.diagnosisNotes }}</p>
            <p><strong>Resolution:</strong> {{ selectedTicket.resolutionNotes }}</p>
            <p v-if="selectedTicket.testingResults"><strong>Testing Results:</strong> {{ selectedTicket.testingResults }}</p>
          </div>
        </div>

        <div v-if="selectedTicket.beforePhotoUrl || selectedTicket.afterPhotoUrl" class="text-xs">
          <label class="font-bold text-slate-700 block mb-1">Technician Repair Evidence</label>
          <div class="flex gap-4">
            <div v-if="selectedTicket.beforePhotoUrl">
              <span class="text-[10px] text-slate-400 block">Before Repair</span>
              <img :src="selectedTicket.beforePhotoUrl" alt="Before" class="w-40 h-28 object-cover rounded border" />
            </div>
            <div v-if="selectedTicket.afterPhotoUrl">
              <span class="text-[10px] text-slate-400 block">After Repair</span>
              <img :src="selectedTicket.afterPhotoUrl" alt="After" class="w-40 h-28 object-cover rounded border" />
            </div>
          </div>
        </div>

        <div v-if="selectedTicket.customerConfirmationNotes" class="text-xs bg-teal-50 p-3 rounded-lg border border-teal-200 text-teal-900">
          <p class="font-bold">✓ Customer Digital Confirmation Recorded</p>
          <p>{{ selectedTicket.customerConfirmationNotes }}</p>
          <p class="text-[10px] text-teal-600 mt-1">Confirmed at: {{ selectedTicket.customerConfirmedAt }}</p>
        </div>

        <div v-if="selectedTicket.activities && selectedTicket.activities.length > 0" class="text-xs">
          <label class="font-bold text-slate-700 block mb-2">Audit Trail</label>
          <div class="space-y-1.5 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2.5 bg-slate-50">
            <div v-for="act in selectedTicket.activities" :key="act.id" class="text-[11px] pb-1 border-b border-slate-200 last:border-b-0">
              <div class="flex justify-between font-semibold text-slate-800">
                <span>{{ act.activityType }}</span>
                <span class="text-slate-400 text-[10px]">{{ act.timestamp }}</span>
              </div>
              <p class="text-slate-600">{{ act.notes }}</p>
              <span class="text-[10px] text-slate-400">By: {{ act.performedBy }}</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-3 border-t border-slate-100">
          <button type="button" @click="isDetailModalOpen = false" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Record Officer-Assisted Complaint -->
    <div v-if="isOfficerCreateModalOpen" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Record Officer-Assisted Complaint</h2>
            <p class="text-xs text-slate-500">Explicitly logged as telephone intake by {{ authStore.user?.fullName }}</p>
          </div>
          <button type="button" @click="isOfficerCreateModalOpen = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="handleOfficerCreate" class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Customer Phone Number *</label>
            <input
              type="text"
              required
              v-model="officerCreateForm.callerPhone"
              placeholder="e.g. 9876543210"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Customer Contact Name</label>
            <input
              type="text"
              v-model="officerCreateForm.callerName"
              placeholder="Customer Full Name"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block font-semibold text-slate-700">Equipment Serial Number *</label>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="selectDemoSerial('INV-2025-1801', 'Vikram')"
                  class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer transition-colors"
                  title="Auto-selects Vikram Nair (18m old, In-Warranty -> ₹0 Free)"
                >
                  🟢 Demo In-Warranty: INV-2025-1801
                </button>
                <button
                  type="button"
                  @click="selectDemoSerial('INV-2023-9901', 'Meera')"
                  class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-colors"
                  title="Auto-selects Meera Krishnan (30m old, Expired -> Auto-Bill)"
                >
                  🔴 Demo Expired: INV-2023-9901
                </button>
              </div>
            </div>
            <input
              type="text"
              required
              v-model="officerCreateForm.serialCode"
              placeholder="e.g. SN-INV-5KW-001 or ITRK-PNL-ORD00001-1"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Reported Fault Category *</label>
            <select v-model="officerCreateForm.faultCategory" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
              <option value="Inverter Error / Grid Sync Drop">Inverter Error / Grid Sync Drop</option>
              <option value="Solar Panel Generation Defect">Solar Panel Generation Defect</option>
              <option value="Battery Storage Underperformance">Battery Storage Underperformance</option>
              <option value="Physical / Weather Damage (Excluded)">Physical / Weather Damage (Excluded)</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Issue Description *</label>
            <textarea
              rows="3"
              required
              v-model="officerCreateForm.complaintDescription"
              placeholder="Details conveyed by customer during telephone intake..."
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            ></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="isOfficerCreateModalOpen = false"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs cursor-pointer"
            >
              Submit Inbound Complaint
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Assign Technician -->
    <div v-if="isAssignModalOpen && selectedTicket" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 class="text-lg font-bold text-slate-900 mb-1">Assign Service Technician</h2>
        <p class="text-xs text-slate-500 mb-4">Ticket: {{ selectedTicket.ticketNumber }} • Customer: {{ selectedTicket.customer?.fullName }}</p>

        <form @submit.prevent="handleAssign" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Select Field Engineer *</label>
            <select
              required
              v-model="assignTechId"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">-- Choose Technician --</option>
              <option v-for="t in technicians" :key="t.id" :value="t.id">
                {{ t.name }} ({{ t.skills }})
              </option>
            </select>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="isAssignModalOpen = false"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-xs cursor-pointer"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Customer Confirmation and Close -->
    <div v-if="isConfirmModalOpen && selectedTicket" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 class="text-lg font-bold text-slate-900 mb-1">Customer Sign-Off & Ticket Closure</h2>
        <p class="text-xs text-slate-500 mb-4">Ticket: {{ selectedTicket.ticketNumber }} • Technician has completed repair</p>

        <form @submit.prevent="handleConfirmSubmit" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Confirmed Customer Name *</label>
            <input type="text" required v-model="confirmForm.confirmedByCustomerName" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Satisfaction & Verification Notes *</label>
            <textarea rows="3" required v-model="confirmForm.customerSatisfactionNotes" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="isConfirmModalOpen = false"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-semibold shadow-xs cursor-pointer"
            >
              Close & Archive Ticket
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Reopen Complaint -->
    <div v-if="isReopenModalOpen && selectedTicket" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 class="text-lg font-bold text-slate-900 mb-1">Authorized Complaint Reopening</h2>
        <p class="text-xs text-slate-500 mb-4">Ticket: {{ selectedTicket.ticketNumber }} • Customer: {{ selectedTicket.customer?.fullName }}</p>

        <form @submit.prevent="handleReopenSubmit" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Reason for Reopening *</label>
            <textarea rows="3" required v-model="reopenReason" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none" placeholder="Provide customer statement or recurrence details..."></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="isReopenModalOpen = false"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-semibold shadow-xs cursor-pointer"
            >
              Reopen & Route to Field
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
