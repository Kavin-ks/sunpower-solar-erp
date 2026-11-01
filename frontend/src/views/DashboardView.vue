<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth';
import type {
  AdminDashboardData,
  SalesDashboardData,
  WarehouseDashboardData,
  TechnicianDashboardData,
  SupportDashboardData,
  FinanceDashboardData,
} from '../types';
import StatusBadge from '../components/ui/StatusBadge.vue';
import {
  Users,
  Compass,
  FileText,
  ShoppingCart,
  Boxes,
  Truck,
  Wrench,
  Headphones,
  CircleDollarSign,
  ShieldCheck,
  Search,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Clock,
  Zap,
} from 'lucide-vue-next';

const authStore = useAuthStore();
const router = useRouter();

const roles = computed(() => authStore.user?.roles || []);
const isAdmin = computed(() => roles.value.includes('ROLE_ADMIN') || roles.value.includes('ROLE_DIRECTOR'));
const isSales = computed(() => roles.value.includes('ROLE_SALES'));
const isWarehouse = computed(() => roles.value.includes('ROLE_WAREHOUSE'));
const isTechnician = computed(() => roles.value.includes('ROLE_TECHNICIAN'));
const isSupport = computed(() => roles.value.includes('ROLE_SUPPORT'));
const isFinance = computed(() => roles.value.includes('ROLE_FINANCE'));

const adminData = ref<AdminDashboardData | null>(null);
const salesData = ref<SalesDashboardData | null>(null);
const warehouseData = ref<WarehouseDashboardData | null>(null);
const technicianData = ref<TechnicianDashboardData | null>(null);
const supportData = ref<SupportDashboardData | null>(null);
const financeData = ref<FinanceDashboardData | null>(null);

const loading = ref(true);
const selectedPeriod = ref('ALL');

const formatCurrency = (val: number | undefined) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const fetchDepartmentDashboard = async () => {
  loading.value = true;
  try {
    if (isAdmin.value) {
      const res = await api.get(`/dashboard/admin?period=${selectedPeriod.value}`);
      adminData.value = res.data;
    } else if (isSales.value) {
      const res = await api.get('/dashboard/sales');
      salesData.value = res.data;
    } else if (isWarehouse.value) {
      const res = await api.get('/dashboard/warehouse');
      warehouseData.value = res.data;
    } else if (isTechnician.value) {
      const res = await api.get('/dashboard/technician');
      technicianData.value = res.data;
    } else if (isSupport.value) {
      const res = await api.get('/dashboard/support');
      supportData.value = res.data;
    } else if (isFinance.value) {
      const res = await api.get('/dashboard/finance');
      financeData.value = res.data;
    } else {
      const res = await api.get(`/dashboard/admin?period=${selectedPeriod.value}`);
      adminData.value = res.data;
    }
  } catch (err) {
    console.error('Failed to load department dashboard data', err);
  } finally {
    loading.value = false;
  }
};

watch(
  () => authStore.user?.username,
  () => {
    fetchDepartmentDashboard();
  }
);

watch(selectedPeriod, () => {
  fetchDepartmentDashboard();
});

onMounted(() => {
  fetchDepartmentDashboard();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
          {{ isAdmin ? 'Executive Command Dashboard' : isSales ? 'Sales Pipeline Dashboard' : isWarehouse ? 'Warehouse Logistics Dashboard' : isTechnician ? 'Field Operations Dashboard' : isSupport ? 'Customer Support Dashboard' : 'Financial P&L Dashboard' }}
        </h1>
        <p class="text-sm text-slate-500">
          Department: <strong class="text-slate-800">{{ authStore.user?.roles?.[0]?.replace('ROLE_', '') }}</strong> • Logged in as <strong class="text-slate-800">{{ authStore.user?.fullName }}</strong>
        </p>
      </div>
      <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
        <button
          v-for="p in [
            { value: 'TODAY', label: 'Today' },
            { value: 'THIS_WEEK', label: 'This Week' },
            { value: 'THIS_MONTH', label: 'This Month' },
            { value: 'ALL', label: 'All Time' },
          ]"
          :key="p.value"
          @click="selectedPeriod = p.value"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer',
            selectedPeriod === p.value
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white',
          ]"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- 1. ADMIN / EXECUTIVE DASHBOARD -->
    <div v-if="isAdmin && adminData" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Total Leads & Enquiries</span>
          <div class="text-2xl font-bold text-slate-900 mt-1">{{ adminData.totalEnquiries }}</div>
          <span class="text-[11px] text-emerald-600 font-semibold">{{ adminData.leadConversionRate?.toFixed(1) }}% Conversion Rate</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Confirmed Sales Orders</span>
          <div class="text-2xl font-bold text-blue-700 mt-1">{{ adminData.confirmedOrders }}</div>
          <span class="text-[11px] text-slate-500">{{ adminData.activeInstallations }} active on-site</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Total Invoiced Revenue</span>
          <div class="text-2xl font-bold text-slate-900 mt-1">{{ formatCurrency(adminData.totalInvoiced) }}</div>
          <span class="text-[11px] text-emerald-600 font-semibold">{{ formatCurrency(adminData.totalPaymentsReceived) }} Collected</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Net Project Profit</span>
          <div class="text-2xl font-bold text-emerald-700 mt-1">{{ formatCurrency(adminData.netProfit) }}</div>
          <span class="text-[11px] text-slate-500">Inventory Value: {{ formatCurrency(adminData.totalStockValue) }}</span>
        </div>
      </div>

      <!-- Technician Workload Table -->
      <div v-if="adminData.technicianWorkloads && adminData.technicianWorkloads.length > 0" class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-200">
          <h2 class="text-sm font-bold text-slate-800">Technician Fleet Utilization</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-2.5 px-4">Technician</th>
                <th class="py-2.5 px-4">Contact</th>
                <th class="py-2.5 px-4">Specialization</th>
                <th class="py-2.5 px-4 text-center">Active Jobs</th>
                <th class="py-2.5 px-4 text-center">Completed Jobs</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="tw in adminData.technicianWorkloads" :key="tw.name" class="hover:bg-slate-50">
                <td class="py-2.5 px-4 font-semibold text-slate-900">{{ tw.name }}</td>
                <td class="py-2.5 px-4">{{ tw.phone }}</td>
                <td class="py-2.5 px-4">{{ tw.specialization }}</td>
                <td class="py-2.5 px-4 text-center font-bold text-blue-700">{{ tw.activeJobs }}</td>
                <td class="py-2.5 px-4 text-center font-bold text-emerald-700">{{ tw.completedJobs }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 2. SALES DASHBOARD -->
    <div v-else-if="isSales && salesData" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Total Enquiries</span>
          <div class="text-2xl font-bold text-slate-900 mt-1">{{ salesData.totalEnquiries }}</div>
          <span class="text-[11px] text-emerald-600 font-semibold">{{ salesData.newEnquiries }} New Leads Awaiting</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Pending Surveys</span>
          <div class="text-2xl font-bold text-amber-700 mt-1">{{ salesData.pendingSurveys }}</div>
          <span class="text-[11px] text-slate-500">{{ salesData.surveysAwaitingReview }} Awaiting Sales Review</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Quotations In Progress</span>
          <div class="text-2xl font-bold text-blue-700 mt-1">{{ salesData.pendingQuotations }}</div>
          <span class="text-[11px] text-emerald-600 font-semibold">{{ salesData.acceptedQuotations }} Accepted</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Sales Pipeline Value</span>
          <div class="text-2xl font-bold text-emerald-700 mt-1">{{ formatCurrency(salesData.pipelineValue) }}</div>
          <span class="text-[11px] text-slate-500">{{ salesData.confirmedOrders }} Confirmed Orders</span>
        </div>
      </div>

      <!-- Recent Enquiries -->
      <div v-if="salesData.recentEnquiries && salesData.recentEnquiries.length > 0" class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 class="text-sm font-bold text-slate-800">Recent Inbound Customer Leads</h2>
          <router-link to="/enquiries" class="text-xs font-semibold text-emerald-700 hover:text-emerald-800">View All Enquiries →</router-link>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-2.5 px-4">Enquiry #</th>
                <th class="py-2.5 px-4">Customer</th>
                <th class="py-2.5 px-4">Capacity</th>
                <th class="py-2.5 px-4">Subsidy</th>
                <th class="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="e in salesData.recentEnquiries.slice(0, 5)" :key="e.id" class="hover:bg-slate-50">
                <td class="py-2.5 px-4 font-mono font-bold text-slate-900">{{ e.enquiryNumber }}</td>
                <td class="py-2.5 px-4 font-semibold text-slate-800">{{ e.customer.fullName }}</td>
                <td class="py-2.5 px-4">{{ e.requestedCapacityKw }} kW ({{ e.systemType }})</td>
                <td class="py-2.5 px-4">
                  <span v-if="e.subsidyRequired" class="text-emerald-700 font-semibold">Yes</span>
                  <span v-else class="text-slate-400">No</span>
                </td>
                <td class="py-2.5 px-4">
                  <StatusBadge :status="e.status" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 3. WAREHOUSE DASHBOARD -->
    <div v-else-if="isWarehouse && warehouseData" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Total Stock Value</span>
          <div class="text-2xl font-bold text-slate-900 mt-1">{{ formatCurrency(warehouseData.totalStockValue) }}</div>
          <span class="text-[11px] text-slate-500">{{ warehouseData.totalStockUnits }} Total Physical Units</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Available Stock Units</span>
          <div class="text-2xl font-bold text-emerald-700 mt-1">{{ warehouseData.availableStockUnits }}</div>
          <span class="text-[11px] text-amber-700 font-semibold">{{ warehouseData.reservedStockUnits }} Reserved for Orders</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Orders Awaiting Picking</span>
          <div class="text-2xl font-bold text-blue-700 mt-1">{{ warehouseData.ordersAwaitingPicking }}</div>
          <span class="text-[11px] text-slate-500">Ready for barcode scanning</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Dispatched Deliveries</span>
          <div class="text-2xl font-bold text-slate-700 mt-1">{{ warehouseData.totalDispatches }}</div>
          <span class="text-[11px] text-emerald-600 font-semibold">{{ warehouseData.dispatchedToday }} Outbound Today</span>
        </div>
      </div>
    </div>

    <!-- 4. TECHNICIAN DASHBOARD -->
    <div v-else-if="isTechnician && technicianData" class="space-y-6">
      <!-- Top Overview Header -->
      <div class="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span class="text-xs uppercase font-bold text-slate-400">Authenticated Technician Profile</span>
          <h2 class="text-lg font-bold text-slate-900 mt-0.5">
            {{ technicianData.technicianName }}
            <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Technician
            </span>
          </h2>
          <p class="text-xs text-slate-500">Specialization: {{ technicianData.specialization }} • Phone: {{ technicianData.phone }}</p>
        </div>
        <router-link
          to="/my-work"
          class="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition"
        >
          <Wrench class="w-4 h-4" />
          <span>Go to My Assigned Work</span>
        </router-link>
      </div>

      <!-- Live Database Metrics Grid -->
      <div :class="['grid grid-cols-2 md:grid-cols-3 gap-3', technicianData.isLead ? 'lg:grid-cols-8' : 'lg:grid-cols-6']">
        <div v-if="technicianData.isLead" class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[10px] uppercase font-bold text-slate-400 block truncate">Active Techs</span>
          <div class="text-xl font-bold text-emerald-700 mt-0.5">{{ technicianData.activeTechniciansCount ?? 0 }}</div>
          <span class="text-[10px] text-slate-400">Fleet strength</span>
        </div>

        <div v-if="technicianData.isLead" class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[10px] uppercase font-bold text-slate-400 block truncate">Available</span>
          <div class="text-xl font-bold text-blue-700 mt-0.5">{{ technicianData.availableTechniciansCount ?? 0 }}</div>
          <span class="text-[10px] text-slate-400">Ready to dispatch</span>
        </div>

        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[10px] uppercase font-bold text-slate-400 block truncate">Assigned Surveys</span>
          <div class="text-xl font-bold text-slate-900 mt-0.5">{{ technicianData.assignedSurveysCount }}</div>
          <span class="text-[10px] text-amber-600 font-semibold">{{ technicianData.pendingSurveysCount }} Pending</span>
        </div>

        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[10px] uppercase font-bold text-slate-400 block truncate">Active Installs</span>
          <div class="text-xl font-bold text-indigo-700 mt-0.5">{{ technicianData.inProgressInstallationsCount }}</div>
          <span class="text-[10px] text-slate-500">In Progress</span>
        </div>

        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[10px] uppercase font-bold text-slate-400 block truncate">Completed Installs</span>
          <div class="text-xl font-bold text-emerald-700 mt-0.5">{{ technicianData.completedInstallationsCount }}</div>
          <span class="text-[10px] text-slate-500">Commissioned</span>
        </div>

        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[10px] uppercase font-bold text-slate-400 block truncate">Pending Visits</span>
          <div class="text-xl font-bold text-purple-700 mt-0.5">{{ technicianData.pendingServiceVisitsCount ?? 0 }}</div>
          <span class="text-[10px] text-slate-400">Complaints queue</span>
        </div>

        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[10px] uppercase font-bold text-slate-400 block truncate">Jobs In Progress</span>
          <div class="text-xl font-bold text-amber-700 mt-0.5">{{ technicianData.inProgressJobsCount ?? 0 }}</div>
          <span class="text-[10px] text-slate-400">On-site work</span>
        </div>

        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[10px] uppercase font-bold text-slate-400 block truncate">Overdue</span>
          <div class="text-xl font-bold text-rose-700 mt-0.5">{{ technicianData.overdueAssignmentsCount ?? 0 }}</div>
          <span class="text-[10px] text-rose-500 font-semibold">Attention</span>
        </div>
      </div>

      <!-- Lead Fleet Workload Table -->
      <div v-if="technicianData.isLead && technicianData.teamWorkloads && technicianData.teamWorkloads.length > 0" class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Technician Fleet Workload & Completion History</h3>
            <p class="text-xs text-slate-500">Live operational assignment distribution across all registered field technicians</p>
          </div>
          <span class="text-xs font-semibold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200">
            {{ technicianData.teamWorkloads.length }} Technicians Monitored
          </span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">Technician</th>
                <th class="py-3 px-4">Specialization</th>
                <th class="py-3 px-4 text-center">Active Surveys</th>
                <th class="py-3 px-4 text-center">Active Installs</th>
                <th class="py-3 px-4 text-center">Active Service Visits</th>
                <th class="py-3 px-4 text-center">Total Active Jobs</th>
                <th class="py-3 px-4 text-center">Completed Installs</th>
                <th class="py-3 px-4 text-center">Completed Repairs</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="member in technicianData.teamWorkloads" :key="member.technicianId" class="hover:bg-slate-50/70 transition">
                <td class="py-2.5 px-4 font-semibold text-slate-900 flex items-center space-x-2">
                  <div class="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                    {{ member.name.charAt(0) }}
                  </div>
                  <span>{{ member.name }}</span>
                </td>
                <td class="py-2.5 px-4 text-slate-500">{{ member.specialization }}</td>
                <td class="py-2.5 px-4 text-center font-mono font-medium" :class="member.activeSurveys > 0 ? 'text-amber-700 font-bold' : 'text-slate-400'">
                  {{ member.activeSurveys }}
                </td>
                <td class="py-2.5 px-4 text-center font-mono font-medium" :class="member.activeInstallations > 0 ? 'text-blue-700 font-bold' : 'text-slate-400'">
                  {{ member.activeInstallations }}
                </td>
                <td class="py-2.5 px-4 text-center font-mono font-medium" :class="member.activeServiceVisits > 0 ? 'text-purple-700 font-bold' : 'text-slate-400'">
                  {{ member.activeServiceVisits }}
                </td>
                <td class="py-2.5 px-4 text-center">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold" :class="member.totalActiveJobs > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'">
                    {{ member.totalActiveJobs }}
                  </span>
                </td>
                <td class="py-2.5 px-4 text-center font-mono text-emerald-700 font-semibold">{{ member.completedInstallations }}</td>
                <td class="py-2.5 px-4 text-center font-mono text-teal-700 font-semibold">{{ member.completedServiceVisits }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 5. SUPPORT DASHBOARD -->
    <div v-else-if="isSupport && supportData" class="space-y-6">
      <!-- Authoritative Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <!-- A. Open Complaints -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[10px] uppercase font-bold text-slate-400">Open Complaints</span>
          <div class="text-2xl font-bold text-rose-700 mt-1">{{ supportData.openTickets }}</div>
          <span class="text-[11px] text-slate-500">Awaiting technician</span>
        </div>

        <!-- B. In Progress -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[10px] uppercase font-bold text-slate-400">In Progress</span>
          <div class="text-2xl font-bold text-amber-600 mt-1">{{ supportData.inProgressTickets }}</div>
          <span class="text-[11px] text-slate-500">Technician on site</span>
        </div>

        <!-- C. Awaiting Customer Sign-off -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[10px] uppercase font-bold text-slate-400">Awaiting Confirmation</span>
          <div class="text-2xl font-bold text-blue-700 mt-1">{{ supportData.resolvedTickets }}</div>
          <span class="text-[11px] text-slate-500">Repair completed</span>
        </div>

        <!-- D. Confirmed & Closed -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[10px] uppercase font-bold text-slate-400">Confirmed & Closed</span>
          <div class="text-2xl font-bold text-emerald-700 mt-1">{{ supportData.closedTickets }}</div>
          <span class="text-[11px] text-slate-500">Verified resolved</span>
        </div>

        <!-- E. Active Warranties -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[10px] uppercase font-bold text-slate-400">Active Warranties</span>
          <div class="text-2xl font-bold text-slate-900 mt-1">{{ supportData.activeWarrantiesCount }}</div>
          <span class="text-[11px] text-slate-500">Valid serialized equipment</span>
        </div>

        <!-- F. Avg Turnaround -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[10px] uppercase font-bold text-slate-400">Resolution Turnaround</span>
          <div v-if="supportData.avgResolutionDays != null" class="text-2xl font-bold text-slate-900 mt-1">
            {{ supportData.avgResolutionDays }} Days
          </div>
          <div v-else class="text-xs font-semibold text-slate-400 mt-2">
            N/A — No resolved complaints
          </div>
          <span class="text-[10px] text-slate-400 block mt-0.5">{{ supportData.avgResolutionTurnaroundText || 'SLA calculation' }}</span>
        </div>
      </div>

      <!-- Dynamic Fault Distribution & Priority Tickets -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Dynamic Fault Breakdown -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs lg:col-span-1">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Fault Category Breakdown</h2>
          <div v-if="supportData.faultBreakdown && supportData.faultBreakdown.length > 0" class="space-y-2.5">
            <div v-for="f in supportData.faultBreakdown" :key="f.faultType" class="flex justify-between items-center text-xs">
              <span class="text-slate-600 truncate pr-2">{{ f.faultType }}</span>
              <span class="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">{{ f.count }}</span>
            </div>
          </div>
          <div v-else class="text-xs text-slate-400 italic py-4">No fault records registered.</div>
        </div>

        <!-- Urgent Inbound Service Tickets -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden lg:col-span-2">
          <div class="p-4 border-b border-slate-200 flex justify-between items-center">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Service Tickets Queue</h2>
            <router-link to="/service" class="text-xs font-semibold text-emerald-700 hover:text-emerald-800">Open Service Workspace →</router-link>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-600">
              <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th class="py-2.5 px-4">Ticket #</th>
                  <th class="py-2.5 px-4">Customer</th>
                  <th class="py-2.5 px-4">Equipment / Serial</th>
                  <th class="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-if="!supportData.urgentTickets || supportData.urgentTickets.length === 0">
                  <td colspan="4" class="py-6 text-center text-slate-400">No active tickets.</td>
                </tr>
                <tr v-for="t in supportData.urgentTickets.slice(0, 5)" :key="t.id" class="hover:bg-slate-50">
                  <td class="py-2.5 px-4 font-mono font-bold text-slate-900">{{ t.ticketNumber }}</td>
                  <td class="py-2.5 px-4 font-semibold text-slate-800">{{ t.customer?.fullName }}</td>
                  <td class="py-2.5 px-4 font-mono text-[11px] text-slate-500">{{ t.serialNumber?.serialCode || 'N/A' }}</td>
                  <td class="py-2.5 px-4"><StatusBadge :status="t.status" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 6. FINANCE DASHBOARD -->
    <div v-else-if="isFinance && financeData" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Total Invoiced Revenue</span>
          <div class="text-2xl font-bold text-slate-900 mt-1">{{ formatCurrency(financeData.totalInvoiced) }}</div>
          <span class="text-[11px] text-emerald-600 font-semibold">{{ formatCurrency(financeData.totalPaymentsReceived) }} Collected</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Outstanding Receivables</span>
          <div class="text-2xl font-bold text-amber-700 mt-1">{{ formatCurrency(financeData.outstandingReceivables) }}</div>
          <span class="text-[11px] text-slate-500">{{ financeData.unpaidInvoicesCount }} unpaid customer invoices</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Net Operating Profit</span>
          <div class="text-2xl font-bold text-emerald-700 mt-1">{{ formatCurrency(financeData.netOperatingProfit) }}</div>
          <span class="text-[11px] text-emerald-600 font-semibold">{{ financeData.grossMarginPercentage?.toFixed(1) }}% Gross Margin</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Subsidies Approved</span>
          <div class="text-2xl font-bold text-purple-700 mt-1">{{ formatCurrency(financeData.subsidyApprovedAmount) }}</div>
          <span class="text-[11px] text-slate-500">{{ financeData.subsidyApprovedCount }} claims sanctioned</span>
        </div>
      </div>
    </div>
  </div>
</template>
