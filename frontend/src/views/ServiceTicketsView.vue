<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '../api/client';
import type { ServiceTicket, Customer, Technician, Product, TicketStatus } from '../types';
import StatusBadge from '../components/ui/StatusBadge.vue';
import CameraPhotoUpload from '../components/common/CameraPhotoUpload.vue';
import { useAuthStore } from '../stores/auth';
import { Headphones, Search, Plus, ShieldCheck, UserCheck, CheckCircle2, Clock, Camera } from 'lucide-vue-next';

const tickets = ref<ServiceTicket[]>([]);
const customers = ref<Customer[]>([]);
const technicians = ref<Technician[]>([]);
const products = ref<Product[]>([]);
const loading = ref(true);
const searchTerm = ref('');
const statusFilter = ref('ALL');

// Modals
const isCreateModalOpen = ref(false);
const isAssignModalOpen = ref(false);
const isResolveModalOpen = ref(false);
const isConfirmModalOpen = ref(false);
const selectedTicket = ref<ServiceTicket | null>(null);
const showComplaintPhotoModal = ref(false);

// Forms
const createForm = ref({
  customerId: '',
  serialCode: '',
  faultCode: 'E04 - Grid Phase Overvoltage',
  complaintDescription: '',
});

const selectDemoSerial = (serialCode: string, customerName: string) => {
  createForm.value.serialCode = serialCode;
  const match = customers.value.find((c: any) => c.fullName && c.fullName.toLowerCase().includes(customerName.toLowerCase()));
  if (match) {
    createForm.value.customerId = String(match.id);
  }
};

const assignTechId = ref('');

const resolveForm = ref({
  diagnosisNotes: '',
  resolutionNotes: '',
  laborCharges: 0,
  parts: [] as { productId: number; quantity: number }[],
});

const confirmForm = ref({
  customerSatisfactionNotes: 'Customer tested and acknowledged solar generation restored at 4.2 kW.',
  confirmedByCustomerName: '',
});

const selectedPartProduct = ref('');
const selectedPartQty = ref(1);

const authStore = useAuthStore();
const isAdmin = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_ADMIN') || roles.includes('ROLE_DIRECTOR');
});
const isSupport = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_SUPPORT') && !isAdmin.value;
});
const isTech = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_TECHNICIAN') && !isAdmin.value;
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

const handleCreateTicket = async () => {
  try {
    await api.post('/service-tickets', {
      customerId: Number(createForm.value.customerId),
      serialCode: createForm.value.serialCode.trim() || undefined,
      faultCode: createForm.value.faultCode,
      complaintDescription: createForm.value.complaintDescription,
    });
    isCreateModalOpen.value = false;
    createForm.value = {
      customerId: '',
      serialCode: '',
      faultCode: 'E04 - Grid Phase Overvoltage',
      complaintDescription: '',
    };
    fetchTickets();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to create service ticket');
  }
};

const handleAssign = async () => {
  if (!selectedTicket.value || !assignTechId.value) return;
  try {
    await api.patch(`/service-tickets/${selectedTicket.value.id}/assign/${assignTechId.value}`);
    isAssignModalOpen.value = false;
    selectedTicket.value = null;
    fetchTickets();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to assign technician');
  }
};

const handleAddPart = () => {
  if (!selectedPartProduct.value) return;
  const prod = products.value.find((p) => p.id === Number(selectedPartProduct.value));
  if (!prod) return;
  resolveForm.value.parts.push({ productId: prod.id, quantity: selectedPartQty.value });
  selectedPartProduct.value = '';
  selectedPartQty.value = 1;
};

const handleRemovePart = (index: number) => {
  resolveForm.value.parts.splice(index, 1);
};

const openResolveModal = (ticket: ServiceTicket) => {
  selectedTicket.value = ticket;
  resolveForm.value = {
    diagnosisNotes: 'Root cause identified: Grid overvoltage surge damaged DC surge protector.',
    resolutionNotes: 'Replaced DC surge protection device and calibrated inverter voltage parameters.',
    laborCharges: ticket.underWarranty ? 0 : 750,
    parts: [],
  };
  isResolveModalOpen.value = true;
};

const handleResolveSubmit = async () => {
  if (!selectedTicket.value) return;
  try {
    await api.post(`/service-tickets/${selectedTicket.value.id}/resolve`, resolveForm.value);
    isResolveModalOpen.value = false;
    selectedTicket.value = null;
    fetchTickets();
    alert('Service Ticket resolved! Replaced parts inventory automatically deducted.');
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to resolve service ticket');
  }
};

const openConfirmModal = (ticket: ServiceTicket) => {
  selectedTicket.value = ticket;
  confirmForm.value = {
    customerSatisfactionNotes: 'Customer tested and acknowledged solar generation restored at 4.2 kW.',
    confirmedByCustomerName: ticket.customer.fullName,
  };
  isConfirmModalOpen.value = true;
};

const handleConfirmSubmit = async () => {
  if (!selectedTicket.value) return;
  try {
    await api.post(`/service-tickets/${selectedTicket.value.id}/confirm-customer`, {
      customerSatisfactionNotes: confirmForm.value.customerSatisfactionNotes,
      confirmedByCustomerName: confirmForm.value.confirmedByCustomerName,
    });
    isConfirmModalOpen.value = false;
    selectedTicket.value = null;
    fetchTickets();
    alert('Customer confirmation logged! Ticket moved to CLOSED.');
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to log customer confirmation');
  }
};

const filteredTickets = computed(() => {
  return tickets.value.filter((t) => {
    const matchesSearch =
      !searchTerm.value ||
      t.ticketNumber.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      t.customer.fullName.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      (t.serialNumber && t.serialNumber.serialCode.toLowerCase().includes(searchTerm.value.toLowerCase()));
    const matchesStatus = statusFilter.value === 'ALL' || t.status === statusFilter.value;
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
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Customer Service & Field Support</h1>
        <p class="text-sm text-slate-500">
          Post-installation complaints • Serialized warranty verification • Technician dispatch & parts replacement
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="isAdmin || isSupport"
          type="button"
          @click="isCreateModalOpen = true"
          class="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>Register New Complaint</span>
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
          placeholder="Search ticket #, customer name, serial number..."
          class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <select
        v-model="statusFilter"
        class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
      >
        <option value="ALL">All Statuses</option>
        <option value="OPEN">Open</option>
        <option value="ASSIGNED">Assigned</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="RESOLVED">Resolved</option>
        <option value="CUSTOMER_CONFIRMED">Customer Confirmed</option>
        <option value="CLOSED">Closed</option>
      </select>
    </div>

    <!-- Tickets Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">Ticket #</th>
              <th class="py-3 px-4">Customer</th>
              <th class="py-3 px-4">Serial / Warranty</th>
              <th class="py-3 px-4">Fault Code</th>
              <th class="py-3 px-4">Assigned Tech</th>
              <th class="py-3 px-4">Charges</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredTickets.length === 0">
              <td colspan="8" class="py-8 text-center text-slate-400">
                No service tickets found matching search criteria.
              </td>
            </tr>
            <tr v-for="t in filteredTickets" :key="t.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ t.ticketNumber }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">
                <div>{{ t.customer.fullName }}</div>
                <div class="text-[11px] text-slate-400 font-normal">{{ t.customer.phone }}</div>
              </td>
              <td class="py-3 px-4">
                <span v-if="t.underWarranty" class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ✓ Active Warranty
                </span>
                <span v-else class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  Out of Warranty
                </span>
                <span v-if="t.serialNumber" class="block font-mono text-[10px] text-slate-500 mt-0.5">
                  {{ t.serialNumber.serialCode }}
                </span>
              </td>
              <td class="py-3 px-4">
                <span class="font-medium text-slate-800">{{ t.faultCode || 'General Defect' }}</span>
              </td>
              <td class="py-3 px-4">
                <span v-if="t.assignedTechnician" class="font-semibold text-slate-800">{{ t.assignedTechnician.name }}</span>
                <span v-else class="text-slate-400 italic">Unassigned</span>
              </td>
              <td class="py-3 px-4">
                <span v-if="t.totalCustomerCharges > 0" class="font-bold text-slate-900">₹{{ t.totalCustomerCharges }}</span>
                <span v-else class="text-emerald-700 font-semibold">₹0 (Warranty)</span>
              </td>
              <td class="py-3 px-4">
                <StatusBadge :status="t.status" />
              </td>
              <td class="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                <button
                  v-if="(isAdmin || isSupport) && t.status === 'OPEN'"
                  type="button"
                  @click="selectedTicket = t; isAssignModalOpen = true"
                  class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold cursor-pointer text-xs"
                >
                  Assign Tech
                </button>

                <button
                  v-if="(isAdmin || isTech) && ['ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_PARTS'].includes(t.status)"
                  type="button"
                  @click="openResolveModal(t)"
                  class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold cursor-pointer text-xs"
                >
                  Resolve & Add Parts
                </button>

                <button
                  v-if="(isAdmin || isSupport) && t.status === 'RESOLVED'"
                  type="button"
                  @click="openConfirmModal(t)"
                  class="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded font-semibold cursor-pointer text-xs"
                >
                  Customer Confirm
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Register Complaint -->
    <div v-if="isCreateModalOpen" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h2 class="text-lg font-bold text-slate-900">Register Support Ticket & Complaint</h2>
          <button type="button" @click="isCreateModalOpen = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="handleCreateTicket" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Select Customer *</label>
            <select
              required
              v-model="createForm.customerId"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">-- Choose Customer --</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">
                {{ c.fullName }} ({{ c.phone }})
              </option>
            </select>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block font-semibold text-slate-700">Defective Component Serial Code</label>
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
              v-model="createForm.serialCode"
              placeholder="e.g. SN-INV-5KW-001 (Automatic warranty verification)"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Fault Code / Category *</label>
            <select v-model="createForm.faultCode" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
              <option value="E04 - Grid Phase Overvoltage">E04 - Grid Phase Overvoltage</option>
              <option value="E01 - Inverter Grounding Fault">E01 - Inverter Grounding Fault</option>
              <option value="E09 - PV String Underperformance">E09 - PV String Underperformance</option>
              <option value="E15 - Battery Communication Loss">E15 - Battery Communication Loss</option>
              <option value="PHY - Physical Frame / Cable Damage">PHY - Physical Frame / Cable Damage</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Customer Complaint Description *</label>
            <textarea
              rows="3"
              required
              v-model="createForm.complaintDescription"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. Inverter displaying red LED warning and zero kWh generation since morning."
            ></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="isCreateModalOpen = false"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs cursor-pointer"
            >
              Register Ticket
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Assign Technician -->
    <div v-if="isAssignModalOpen && selectedTicket" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 class="text-lg font-bold text-slate-900 mb-1">Assign Service Technician</h2>
        <p class="text-xs text-slate-500 mb-4">Ticket: {{ selectedTicket.ticketNumber }} • Customer: {{ selectedTicket.customer.fullName }}</p>

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

    <!-- Modal: Resolve Ticket & Replace Parts -->
    <div v-if="isResolveModalOpen && selectedTicket" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Resolve Service Ticket</h2>
            <p class="text-xs text-slate-500">Ticket: {{ selectedTicket.ticketNumber }} • Coverage: {{ selectedTicket.underWarranty ? 'UNDER WARRANTY (Free Parts)' : 'CHARGEABLE' }}</p>
          </div>
          <button type="button" @click="isResolveModalOpen = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="handleResolveSubmit" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Diagnosis Notes *</label>
            <textarea rows="2" required v-model="resolveForm.diagnosisNotes" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"></textarea>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Action / Resolution Notes *</label>
            <textarea rows="2" required v-model="resolveForm.resolutionNotes" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"></textarea>
          </div>

          <!-- Parts Replacement from Inventory -->
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Replace Hardware Parts from Warehouse Inventory</label>
            <div class="flex gap-2 mb-2">
              <select v-model="selectedPartProduct" class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="">-- Choose Spare Product --</option>
                <option v-for="p in products" :key="p.id" :value="p.id">
                  {{ p.name }} (Available: {{ p.currentStock }})
                </option>
              </select>
              <input
                type="number"
                min="1"
                v-model="selectedPartQty"
                class="w-16 px-2 py-2 border border-slate-200 rounded-lg text-xs text-center"
              />
              <button
                type="button"
                @click="handleAddPart"
                class="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Add Part
              </button>
            </div>

            <div v-if="resolveForm.parts.length > 0" class="border border-slate-200 rounded-lg divide-y divide-slate-100">
              <div v-for="(part, idx) in resolveForm.parts" :key="idx" class="p-2 flex justify-between items-center">
                <span>Product ID: {{ part.productId }} (Qty: {{ part.quantity }})</span>
                <button type="button" @click="handleRemovePart(idx)" class="text-rose-600 font-bold hover:text-rose-800 cursor-pointer">Remove</button>
              </div>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="isResolveModalOpen = false"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs cursor-pointer"
            >
              Submit Ticket Resolution
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Customer Confirmation -->
    <div v-if="isConfirmModalOpen && selectedTicket" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 class="text-lg font-bold text-slate-900 mb-1">Customer Sign-Off Confirmation</h2>
        <p class="text-xs text-slate-500 mb-4">Ticket: {{ selectedTicket.ticketNumber }}</p>

        <form @submit.prevent="handleConfirmSubmit" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Customer Signee Name *</label>
            <input type="text" required v-model="confirmForm.confirmedByCustomerName" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Satisfaction & Restoration Notes *</label>
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
  </div>
</template>
