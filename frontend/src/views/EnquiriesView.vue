<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api/client';
import type { Enquiry, EnquiryStatus } from '../types';
import StatusBadge from '../components/ui/StatusBadge.vue';
import { useAuthStore } from '../stores/auth';
import { Search, Filter, Phone, Zap, Clock, Calendar, ExternalLink, ShieldCheck, Send } from 'lucide-vue-next';

const enquiries = ref<Enquiry[]>([]);
const loading = ref(true);
const search = ref('');
const statusFilter = ref('');
const selectedEnquiry = ref<Enquiry | null>(null);
const followupNote = ref('');
const submittingNote = ref(false);

const router = useRouter();
const authStore = useAuthStore();

const isAdmin = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_ADMIN') || roles.includes('ROLE_DIRECTOR');
});

const isSales = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('ROLE_SALES') && !isAdmin.value;
});

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

const handleStatusUpdate = async (id: number, newStatus: EnquiryStatus, customNote?: string) => {
  try {
    await api.patch(`/enquiries/${id}/status`, {
      status: newStatus,
      actionNote: customNote || `Stage updated to ${newStatus}`,
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

const goToScheduleSurvey = (enq: Enquiry) => {
  router.push({
    path: '/surveys',
    query: { customerId: String(enq.customer.id), enquiryId: String(enq.id) },
  });
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
          Qualify incoming solar rooftop customer enquiries originating from the public customer portal
        </p>
      </div>

      <div class="flex items-center space-x-2">
        <a
          href="/enquiry"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition"
        >
          <ExternalLink class="w-3.5 h-3.5" />
          <span>Open Customer Enquiry Portal</span>
        </a>
      </div>
    </div>

    <!-- Compliance Callout Banner -->
    <div class="bg-blue-50/80 border border-blue-200 p-3.5 rounded-xl flex items-center space-x-3 text-xs text-blue-900">
      <ShieldCheck class="w-5 h-5 text-blue-600 shrink-0" />
      <p>
        <strong>Department Workflow Notice:</strong> Manual lead creation has been decommissioned from Sales interface.
        All customer enquiries originate automatically from the public customer submission portal to preserve customer source integrity,
        prevent duplicate phone numbers, and ensure centralized database synchronization.
      </p>
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
              <th class="py-3 px-4">Bill (₹)</th>
              <th class="py-3 px-4">Subsidy</th>
              <th class="py-3 px-4">Source</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="enquiries.length === 0">
              <td colspan="8" class="py-8 text-center text-slate-400">
                No customer enquiries found matching filter.
              </td>
            </tr>
            <tr v-for="enq in enquiries" :key="enq.id" class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ enq.enquiryNumber }}</td>
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
              </td>
              <td class="py-3 px-4 font-medium">
                {{ enq.monthlyElectricityBill ? `₹${enq.monthlyElectricityBill}` : '-' }}
              </td>
              <td class="py-3 px-4">
                <span v-if="enq.subsidyRequired" class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Yes (PM Surya Ghar)
                </span>
                <span v-else class="text-[11px] text-slate-400">No</span>
              </td>
              <td class="py-3 px-4 capitalize text-slate-500">
                <span class="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono text-slate-700">
                  {{ enq.source.toLowerCase() }}
                </span>
              </td>
              <td class="py-3 px-4">
                <StatusBadge :status="enq.status" />
              </td>
              <td class="py-3 px-4 text-right space-x-2">
                <button
                  type="button"
                  @click="selectedEnquiry = enq"
                  class="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded text-xs font-semibold cursor-pointer"
                >
                  View & Qualify
                </button>

                <button
                  v-if="enq.status === 'QUALIFIED' && isSales"
                  type="button"
                  @click="goToScheduleSurvey(enq)"
                  class="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
                >
                  <Calendar class="w-3 h-3" />
                  <span>Schedule Survey</span>
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

    <!-- Enquiry Details Modal -->
    <div v-if="selectedEnquiry" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900">{{ selectedEnquiry.enquiryNumber }}</h2>
            <p class="text-xs text-slate-500">Customer: {{ selectedEnquiry.customer.fullName }} • Source: {{ selectedEnquiry.source }}</p>
          </div>
          <button type="button" @click="selectedEnquiry = null" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">
            ✕
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <!-- Current Lead Stage & Actions -->
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span class="font-semibold text-slate-600">Current Lead Stage:</span>
              <div class="mt-1">
                <StatusBadge :status="selectedEnquiry.status" />
              </div>
            </div>

            <div v-if="isSales" class="flex items-center space-x-2">
              <span class="text-slate-500 font-medium">Update Status:</span>
              <button
                type="button"
                @click="handleStatusUpdate(selectedEnquiry.id, 'CONTACTED', 'Customer contacted by Sales phone follow-up')"
                :disabled="selectedEnquiry.status === 'CONTACTED'"
                class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-semibold text-xs cursor-pointer disabled:opacity-50"
              >
                Contacted
              </button>
              <button
                type="button"
                @click="handleStatusUpdate(selectedEnquiry.id, 'QUALIFIED', 'Lead qualified: rooftop feasible and budget verified')"
                :disabled="selectedEnquiry.status === 'QUALIFIED' || ['SURVEY_SCHEDULED', 'SURVEY_APPROVED', 'QUOTED', 'CONVERTED'].includes(selectedEnquiry.status)"
                class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded font-semibold text-xs cursor-pointer disabled:opacity-50"
              >
                Qualify
              </button>
              <button
                type="button"
                @click="handleStatusUpdate(selectedEnquiry.id, 'REJECTED', 'Customer not interested / unreachable')"
                :disabled="selectedEnquiry.status === 'REJECTED'"
                class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded font-semibold text-xs cursor-pointer disabled:opacity-50"
              >
                Lost / Reject
              </button>
            </div>
          </div>

          <!-- Customer Info -->
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
              <p class="text-slate-400">System Capacity Requested</p>
              <p class="font-semibold text-slate-800">
                {{ selectedEnquiry.requestedCapacityKw }} kW ({{ selectedEnquiry.systemType === 'ON_GRID' ? 'On-Grid' : 'Off-Grid' }})
              </p>
            </div>
            <div>
              <p class="text-slate-400">Government Subsidy</p>
              <p class="font-semibold text-emerald-700">
                {{ selectedEnquiry.subsidyRequired ? '✓ Requested (PM Surya Ghar)' : 'Not Required' }}
              </p>
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
              <p class="text-slate-500 font-semibold mb-0.5">Customer Initial Remarks / Roof Area</p>
              <p class="text-slate-700">{{ selectedEnquiry.notes }}</p>
            </div>
            <div class="col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Enquiry Source: <strong class="text-slate-600 uppercase font-mono">{{ selectedEnquiry.source }}</strong></span>
              <span>Submitted: {{ selectedEnquiry.createdAt ? new Date(selectedEnquiry.createdAt).toLocaleString() : 'N/A' }}</span>
            </div>
          </div>

          <!-- Add Follow-up Note Form -->
          <form v-if="isSales" @submit.prevent="handleAddFollowup" class="flex gap-2">
            <input
              type="text"
              v-model="followupNote"
              placeholder="Log a follow-up conversation note with customer..."
              class="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              :disabled="submittingNote || !followupNote.trim()"
              class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <Send class="w-3.5 h-3.5" />
              <span>Log</span>
            </button>
          </form>

          <!-- Audit Trail & Activity Log -->
          <div>
            <h3 class="font-bold text-slate-800 mb-2 flex items-center space-x-1.5">
              <Clock class="w-3.5 h-3.5 text-slate-400" />
              <span>Audit Trail & Activity Log</span>
            </h3>
            <div class="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2 max-h-48 overflow-y-auto">
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
              <button
                v-if="selectedEnquiry.status === 'QUALIFIED' && isSales"
                type="button"
                @click="goToScheduleSurvey(selectedEnquiry)"
                class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold inline-flex items-center space-x-1 cursor-pointer"
              >
                <Calendar class="w-3.5 h-3.5" />
                <span>Proceed to Schedule Survey</span>
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
  </div>
</template>
