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
  TrendingUp,
  CreditCard,
  ChevronRight,
  ArrowRight,
  BarChart3,
  Receipt,
  CalendarCheck2,
} from 'lucide-vue-next';

const authStore = useAuthStore();
const router = useRouter();

const roles = computed(() => authStore.user?.roles || []);
const isAdmin = computed(() => roles.value.includes('ROLE_ADMIN'));
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

// Quick serial lookup for Support
const quickSerial = ref('');
const serialLookupResult = ref<any>(null);
const searchingSerial = ref(false);

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
      const res = await api.get('/dashboard/admin');
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
      const res = await api.get('/dashboard/admin');
      adminData.value = res.data;
    }
  } catch (err) {
    console.error('Failed to load department dashboard data', err);
  } finally {
    loading.value = false;
  }
};

const handleQuickSerialSearch = async () => {
  if (!quickSerial.value.trim()) return;
  searchingSerial.value = true;
  serialLookupResult.value = null;
  try {
    const res = await api.get(`/warranties/serial/${quickSerial.value.trim()}`);
    serialLookupResult.value = { found: true, data: res.data };
  } catch (err) {
    try {
      const sRes = await api.get(`/serial-numbers/lookup/${quickSerial.value.trim()}`);
      serialLookupResult.value = { found: true, serialOnly: true, data: sRes.data };
    } catch (err2) {
      serialLookupResult.value = { found: false };
    }
  } finally {
    searchingSerial.value = false;
  }
};

watch(
  () => authStore.user?.username,
  () => {
    fetchDepartmentDashboard();
  }
);

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
          <span class="text-[11px] text-slate-500">Advance-cleared & ready to pack</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Dispatched Deliveries</span>
          <div class="text-2xl font-bold text-slate-700 mt-1">{{ warehouseData.totalDispatches }}</div>
          <span class="text-[11px] text-emerald-600 font-semibold">{{ warehouseData.dispatchedToday }} Outbound Today</span>
        </div>
      </div>

      <!-- Orders Awaiting Warehouse Picking -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 class="text-sm font-bold text-slate-900">Orders Awaiting Warehouse Picking & Dispatch</h2>
            <p class="text-xs text-slate-500">Confirmed orders with required advance payment cleared</p>
          </div>
          <router-link
            to="/dispatch"
            class="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Open Dispatch Console</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </router-link>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-2.5 px-4">Order #</th>
                <th class="py-2.5 px-4">Customer</th>
                <th class="py-2.5 px-4">System Spec</th>
                <th class="py-2.5 px-4 text-right">Order Value</th>
                <th class="py-2.5 px-4 text-right">Advance Paid</th>
                <th class="py-2.5 px-4">Status</th>
                <th class="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="order in warehouseData.pendingPickingOrders || []" :key="order.id" class="hover:bg-slate-50 transition">
                <td class="py-2.5 px-4 font-mono font-bold text-slate-900">{{ order.orderNumber }}</td>
                <td class="py-2.5 px-4 font-semibold text-slate-800">{{ order.customer?.fullName }}</td>
                <td class="py-2.5 px-4 font-medium">{{ order.capacityKw }} kW {{ order.systemType === 'ON_GRID' ? 'On-Grid' : 'Off-Grid' }}</td>
                <td class="py-2.5 px-4 text-right font-medium">₹{{ Number(order.totalAmount || 0).toLocaleString('en-IN') }}</td>
                <td class="py-2.5 px-4 text-right font-bold text-emerald-700">₹{{ Number(order.totalPaid || 0).toLocaleString('en-IN') }}</td>
                <td class="py-2.5 px-4">
                  <StatusBadge :status="order.status" />
                </td>
                <td class="py-2.5 px-4 text-right">
                  <router-link
                    :to="`/dispatch?orderId=${order.id}`"
                    class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs inline-flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Truck class="w-3 h-3" />
                    <span>Pick & Dispatch</span>
                  </router-link>
                </td>
              </tr>
              <tr v-if="!warehouseData.pendingPickingOrders || warehouseData.pendingPickingOrders.length === 0">
                <td colspan="7" class="py-8 text-center text-slate-400">No orders awaiting picking at this time.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Low Stock Alerts -->
      <div v-if="warehouseData.lowStockAlerts && warehouseData.lowStockAlerts.length > 0" class="bg-white rounded-xl border border-amber-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-amber-100 bg-amber-50/50 flex justify-between items-center">
          <div class="flex items-center gap-2">
            <AlertTriangle class="w-4 h-4 text-amber-600" />
            <h2 class="text-sm font-bold text-amber-900">Low Stock Reorder Alerts ({{ warehouseData.lowStockAlerts.length }})</h2>
          </div>
          <router-link
            to="/inventory"
            class="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Inventory Catalogue</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </router-link>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-2 px-4">Item Code</th>
                <th class="py-2 px-4">Product Name</th>
                <th class="py-2 px-4">Category</th>
                <th class="py-2 px-4 text-right">Available Qty</th>
                <th class="py-2 px-4 text-right">Min Threshold</th>
                <th class="py-2 px-4">Location Bay</th>
                <th class="py-2 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="st in warehouseData.lowStockAlerts" :key="st.id" class="hover:bg-slate-50 transition">
                <td class="py-2 px-4 font-mono font-medium text-slate-900">{{ st.product?.productCode }}</td>
                <td class="py-2 px-4 font-semibold text-slate-800">{{ st.product?.name }}</td>
                <td class="py-2 px-4 text-slate-500">{{ st.product?.category?.name || 'General' }}</td>
                <td class="py-2 px-4 text-right font-bold text-rose-600">{{ st.availableQuantity }} {{ st.product?.unit }}</td>
                <td class="py-2 px-4 text-right text-slate-500">{{ st.product?.minimumStockLevel }} {{ st.product?.unit }}</td>
                <td class="py-2 px-4 text-slate-500">{{ st.warehouseLocation || 'Main Warehouse' }}</td>
                <td class="py-2 px-4 text-right">
                  <router-link
                    to="/inventory"
                    class="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs cursor-pointer"
                  >
                    Adjust
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 4. TECHNICIAN DASHBOARD -->
    <div v-else-if="isTechnician && technicianData" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Assigned Site Surveys</span>
          <div class="text-2xl font-bold text-slate-900 mt-1">{{ technicianData.assignedSurveysCount }}</div>
          <span class="text-[11px] text-amber-700 font-semibold">{{ technicianData.pendingSurveysCount }} Pending Physical Inspection</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Active Installations</span>
          <div class="text-2xl font-bold text-blue-700 mt-1">{{ technicianData.inProgressInstallationsCount }}</div>
          <span class="text-[11px] text-emerald-600 font-semibold">{{ technicianData.completedInstallationsCount }} Successfully Commissioned</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Service & Repair Visits</span>
          <div class="text-2xl font-bold text-purple-700 mt-1">{{ technicianData.assignedServiceVisitsCount }}</div>
          <span class="text-[11px] text-slate-500">Field complaints assigned</span>
        </div>
      </div>
    </div>

    <!-- 5. SUPPORT DASHBOARD -->
    <div v-else-if="isSupport && supportData" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Open Complaints</span>
          <div class="text-2xl font-bold text-rose-700 mt-1">{{ supportData.openTickets }}</div>
          <span class="text-[11px] text-slate-500">{{ supportData.inProgressTickets }} In Progress</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Resolved Complaints</span>
          <div class="text-2xl font-bold text-emerald-700 mt-1">{{ supportData.resolvedTickets }}</div>
          <span class="text-[11px] text-slate-500">{{ supportData.closedTickets }} Confirmed & Closed</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Active Warranties</span>
          <div class="text-2xl font-bold text-blue-700 mt-1">{{ supportData.activeWarrantiesCount }}</div>
          <span class="text-[11px] text-slate-500">Registered serialized equipment</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs uppercase font-bold text-slate-400">Avg Resolution Turnaround</span>
          <div class="text-2xl font-bold text-slate-900 mt-1">{{ supportData.avgResolutionDays?.toFixed(1) }} Days</div>
          <span class="text-[11px] text-emerald-600 font-semibold">Under SLA targets</span>
        </div>
      </div>

      <!-- Quick Serial Lookup Card -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Instant Serial & Warranty Verification</h3>
        <form @submit.prevent="handleQuickSerialSearch" class="flex gap-2">
          <input
            type="text"
            v-model="quickSerial"
            placeholder="Enter component serial number (e.g. SN-INV-5KW-001)..."
            class="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            :disabled="searchingSerial"
            class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            {{ searchingSerial ? 'Verifying...' : 'Check Warranty' }}
          </button>
        </form>

        <div v-if="serialLookupResult" class="mt-3 p-3 rounded-xl border text-xs">
          <div v-if="serialLookupResult.found && serialLookupResult.data" class="bg-emerald-50 border-emerald-200 text-emerald-900 p-2 rounded-lg">
            <p class="font-bold">✓ Serial Verified Active</p>
            <p>Product: {{ serialLookupResult.data.product?.name || serialLookupResult.data.name }}</p>
            <p v-if="serialLookupResult.data.warrantyEndDate">Valid until: {{ serialLookupResult.data.warrantyEndDate }}</p>
          </div>
          <div v-else class="bg-rose-50 border-rose-200 text-rose-800 p-2 rounded-lg">
            <p class="font-bold">✗ No active warranty record found for this serial number.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 6. FINANCE DASHBOARD -->
    <div v-else-if="isFinance && financeData" class="space-y-6">
      <!-- Top 4 Metrics Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <!-- Cost & Profit Breakdown Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[11px] uppercase font-bold text-slate-400 block">Hardware BOM Cost</span>
          <div class="text-xl font-bold text-slate-800 font-mono mt-1">
            {{ formatCurrency(financeData.hardwareCost) }}
          </div>
          <span class="text-xs text-slate-500">Solar panels, inverters &amp; structures</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[11px] uppercase font-bold text-slate-400 block">Field Labor Disbursements</span>
          <div class="text-xl font-bold text-slate-800 font-mono mt-1">
            {{ formatCurrency(financeData.technicianCost) }}
          </div>
          <span class="text-xs text-slate-500">Technician installation hourly rates</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[11px] uppercase font-bold text-slate-400 block">Direct Site Expenses</span>
          <div class="text-xl font-bold text-slate-800 font-mono mt-1">
            {{ formatCurrency(financeData.directExpenses) }}
          </div>
          <span class="text-xs text-slate-500">Logistics, cranes &amp; permits</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-[11px] uppercase font-bold text-slate-400 block">Total Execution Cost (COGS)</span>
          <div class="text-xl font-bold text-rose-700 font-mono mt-1">
            {{ formatCurrency(financeData.totalProjectCost) }}
          </div>
          <span class="text-xs text-slate-500">Excludes GST tax</span>
        </div>
      </div>

      <!-- Job Profitability Snapshot -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 class="text-sm font-bold text-slate-900">Project Execution Margins Snapshot</h2>
            <p class="text-xs text-slate-500">Live cost tracking and net realized profits per customer installation</p>
          </div>
          <router-link
            to="/finance?tab=profitability"
            class="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Open Full Profitability Ledger</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </router-link>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-2.5 px-4">Order #</th>
                <th class="py-2.5 px-4">Customer</th>
                <th class="py-2.5 px-4">Capacity</th>
                <th class="py-2.5 px-4 text-right">Contract Revenue</th>
                <th class="py-2.5 px-4 text-right">Hardware Cost</th>
                <th class="py-2.5 px-4 text-right">Labor Cost</th>
                <th class="py-2.5 px-4 text-right">Net Profit</th>
                <th class="py-2.5 px-4 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="jp in financeData.recentJobProfitability?.slice(0, 6) || []" :key="jp.orderId" class="hover:bg-slate-50 transition">
                <td class="py-2.5 px-4 font-mono font-bold text-slate-900">{{ jp.orderNumber }}</td>
                <td class="py-2.5 px-4 font-semibold text-slate-800">{{ jp.customerName }}</td>
                <td class="py-2.5 px-4">{{ jp.capacityKw }} kW</td>
                <td class="py-2.5 px-4 text-right font-medium">₹{{ Number(jp.orderAmount || 0).toLocaleString('en-IN') }}</td>
                <td class="py-2.5 px-4 text-right text-slate-500">₹{{ Number(jp.hardwareCost || 0).toLocaleString('en-IN') }}</td>
                <td class="py-2.5 px-4 text-right text-slate-500">₹{{ Number(jp.installationLaborCost || jp.technicianCost || 0).toLocaleString('en-IN') }}</td>
                <td class="py-2.5 px-4 text-right font-bold text-emerald-700">₹{{ Number(jp.netProfit || 0).toLocaleString('en-IN') }}</td>
                <td class="py-2.5 px-4 text-right font-bold">
                  <span :class="jp.profitMarginPercentage >= 20 ? 'text-emerald-700' : 'text-amber-600'">
                    {{ jp.profitMarginPercentage?.toFixed(1) }}%
                  </span>
                </td>
              </tr>
              <tr v-if="!financeData.recentJobProfitability || financeData.recentJobProfitability.length === 0">
                <td colspan="8" class="py-8 text-center text-slate-400">No projects confirmed yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
