<script setup lang="ts">
import { ref } from 'vue';
import { Sun, CheckCircle2, ArrowLeft, Send, Sparkles, Home, Phone, Mail, MapPin } from 'lucide-vue-next';
import axios from 'axios';

const formData = ref({
  fullName: '',
  phone: '',
  email: '',
  address: '',
  city: 'Coimbatore',
  pincode: '641001',
  customerType: 'RESIDENTIAL',
  systemType: 'ON_GRID',
  requestedCapacityKw: 3,
  subsidyRequired: true,
  monthlyElectricityBill: 3500,
  notes: '',
});

const loading = ref(false);
const successResponse = ref<any>(null);
const error = ref('');

const handleSubmit = async () => {
  loading.value = true;
  error.value = '';
  successResponse.value = null;

  try {
    const payload = {
      ...formData.value,
      requestedCapacityKw: Number(formData.value.requestedCapacityKw),
      monthlyElectricityBill: Number(formData.value.monthlyElectricityBill),
    };
    const res = await axios.post('/api/enquiries/public', payload);
    successResponse.value = res.data;
  } catch (err: any) {
    error.value = err.response?.data?.message || err.response?.data?.error || 'Failed to submit enquiry. Please verify details.';
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  successResponse.value = null;
  formData.value = {
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: 'Coimbatore',
    pincode: '641001',
    customerType: 'RESIDENTIAL',
    systemType: 'ON_GRID',
    requestedCapacityKw: 3,
    subsidyRequired: true,
    monthlyElectricityBill: 3500,
    notes: '',
  };
};
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Top Header -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-600 text-white flex items-center justify-center shadow-md">
            <Sun class="w-6 h-6" />
          </div>
          <div>
            <h1 class="text-lg font-bold text-slate-900 leading-tight">SunPower Solutions</h1>
            <p class="text-xs text-slate-500">Clean Energy • PM Surya Ghar Rooftop Solar</p>
          </div>
        </div>
        <router-link
          to="/login"
          class="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg border border-emerald-200 transition"
        >
          <span>Employee Portal</span>
        </router-link>
      </div>
    </header>

    <!-- Main Container -->
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="mb-6 text-center">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
          <Sparkles class="w-3.5 h-3.5" />
          <span>Government Subsidy Available under PM Surya Ghar</span>
        </div>
        <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">Request Rooftop Solar Survey & Quote</h2>
        <p class="text-sm text-slate-600 max-w-xl mx-auto mt-1">
          Submit your rooftop details below. Our certified solar engineering team will inspect your site and provide an itemized Bill of Materials quotation.
        </p>
      </div>

      <!-- Success State -->
      <div v-if="successResponse" class="bg-white rounded-2xl p-8 border border-emerald-200 shadow-xl text-center max-w-2xl mx-auto">
        <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 class="w-10 h-10" />
        </div>
        <h3 class="text-2xl font-bold text-slate-900 mb-2">Enquiry Registered Successfully!</h3>
        <div class="bg-emerald-50 rounded-xl p-4 my-4 border border-emerald-200 inline-block text-left w-full">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-slate-500 text-xs block">Enquiry Reference:</span>
              <span class="font-bold text-emerald-800 text-base">{{ successResponse.enquiryNumber }}</span>
            </div>
            <div>
              <span class="text-slate-500 text-xs block">Customer Name:</span>
              <span class="font-semibold text-slate-800">{{ successResponse.customer?.fullName }}</span>
            </div>
            <div>
              <span class="text-slate-500 text-xs block">Requested System:</span>
              <span class="font-semibold text-slate-800">{{ successResponse.requestedCapacityKw }} kW ({{ successResponse.systemType }})</span>
            </div>
            <div>
              <span class="text-slate-500 text-xs block">Subsidy Eligible:</span>
              <span class="font-semibold text-emerald-700">{{ successResponse.subsidyRequired ? 'Yes (PM Surya Ghar)' : 'Standard' }}</span>
            </div>
          </div>
        </div>
        <p class="text-sm text-slate-600 mb-6">
          Our Sales Lead will contact you at <span class="font-semibold text-slate-900">{{ successResponse.customer?.phone }}</span> within 24 hours to schedule the physical rooftop survey.
        </p>
        <div class="flex justify-center gap-3">
          <button
            type="button"
            @click="handleReset"
            class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition cursor-pointer"
          >
            Submit Another Enquiry
          </button>
          <router-link
            to="/login"
            class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition"
          >
            Go to Sign In
          </router-link>
        </div>
      </div>

      <!-- Form Card -->
      <div v-else class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div v-if="error" class="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-sm">
          <strong>Error:</strong> {{ error }}
        </div>

        <form @submit.prevent="handleSubmit" class="p-6 md:p-8 space-y-6">
          <!-- 1. Contact & Location Information -->
          <div>
            <h3 class="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
              <Home class="w-5 h-5 text-emerald-600" />
              <span>1. Contact & Location Information</span>
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span class="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  v-model="formData.fullName"
                  required
                  placeholder="e.g. Arun Balaji"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <Phone class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    v-model="formData.phone"
                    required
                    placeholder="10-digit mobile number"
                    class="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div class="relative">
                  <Mail class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    v-model="formData.email"
                    placeholder="name@example.com"
                    class="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Category
                </label>
                <select
                  v-model="formData.customerType"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="RESIDENTIAL">Residential (Individual Home / Villa)</option>
                  <option value="COMMERCIAL">Commercial (Offices / Retail)</option>
                  <option value="SMALL_FACTORY">Small Factory / Industrial Shed</option>
                  <option value="AGRICULTURAL">Agricultural / Farm House</option>
                </select>
              </div>
              <div class="md:col-span-2">
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Installation Address <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <MapPin class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    v-model="formData.address"
                    required
                    placeholder="House / Building No., Street, Area"
                    class="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">City / Town</label>
                <input
                  type="text"
                  v-model="formData.city"
                  required
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Postal Pincode</label>
                <input
                  type="text"
                  v-model="formData.pincode"
                  required
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- 2. Solar Requirements -->
          <div>
            <h3 class="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
              <Sun class="w-5 h-5 text-amber-500" />
              <span>2. Solar System Requirements</span>
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  System Type
                </label>
                <select
                  v-model="formData.systemType"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="ON_GRID">On-Grid (Grid-Tied with Net-Metering)</option>
                  <option value="OFF_GRID">Off-Grid (With Lithium Battery Storage)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Desired Capacity (kW)
                </label>
                <select
                  v-model="formData.requestedCapacityKw"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option :value="1">1 kW (Saves ~120 units/mo)</option>
                  <option :value="2">2 kW (Saves ~240 units/mo)</option>
                  <option :value="3">3 kW (Saves ~360 units/mo - Most Popular)</option>
                  <option :value="4">4 kW (Saves ~480 units/mo)</option>
                  <option :value="5">5 kW (Saves ~600 units/mo)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Approx Monthly Electricity Bill (₹)
                </label>
                <input
                  type="number"
                  v-model="formData.monthlyElectricityBill"
                  min="500"
                  step="100"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div class="md:col-span-3">
                <label class="flex items-center space-x-2.5 bg-emerald-50 p-3 rounded-xl border border-emerald-200 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="formData.subsidyRequired"
                    class="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
                  />
                  <span class="text-xs font-semibold text-emerald-900">
                    Apply for PM Surya Ghar Muft Bijli Yojana Central Government Subsidy (up to ₹78,000 for residential 3kW)
                  </span>
                </label>
              </div>
              <div class="md:col-span-3">
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Rooftop or Site Observations / Notes
                </label>
                <textarea
                  v-model="formData.notes"
                  rows="3"
                  placeholder="e.g. Flat RCC concrete roof, shadow free, 3rd floor..."
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
              </div>
            </div>
          </div>

          <div class="pt-2 flex items-center justify-between">
            <router-link
              to="/login"
              class="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition gap-1"
            >
              <ArrowLeft class="w-4 h-4" />
              <span>Back to Sign In</span>
            </router-link>
            <button
              type="submit"
              :disabled="loading"
              class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send class="w-4 h-4" />
              <span>{{ loading ? 'Submitting Enquiry...' : 'Submit Solar Enquiry' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
