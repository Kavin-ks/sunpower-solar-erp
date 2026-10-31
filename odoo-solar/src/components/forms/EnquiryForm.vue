<template>
  <div class="contact-form-box">
    <!-- Success Alert Banner -->
    <div
      v-if="submittedEnquiry"
      class="alert alert-success p-3 rounded-3 mb-4 shadow-sm"
      style="background: #ecfdf5; border: 1px solid #10b981; color: #065f46"
    >
      <div class="d-flex align-items-center mb-1">
        <i class="bi bi-check-circle-fill me-2 fs-5 text-success"></i>
        <h5 class="mb-0 fw-bold text-success">Enquiry Submitted Successfully!</h5>
      </div>
      <p class="mb-1" style="font-size: 13px">
        Enquiry Reference ID: <strong>{{ submittedEnquiry.enquiryNumber }}</strong>
      </p>
      <p class="mb-0 text-muted" style="font-size: 12px">
        Thank you! Your rooftop solar requirement has been registered in the central SunPower database. Our Sales team
        will review your requirement and call you shortly to schedule your site evaluation.
      </p>
    </div>

    <!-- Error Alert Banner -->
    <div
      v-if="serverError"
      class="alert alert-danger p-3 rounded-3 mb-4 shadow-sm"
      style="background: #fef2f2; border: 1px solid #ef4444; color: #991b1b"
    >
      <div class="d-flex align-items-center">
        <i class="bi bi-exclamation-triangle-fill me-2 fs-5 text-danger"></i>
        <span style="font-size: 13px">{{ serverError }}</span>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" id="solar-enquiry-form">
      <div class="row g-3">
        <!-- 1. Full Name -->
        <div class="col-12 col-md-6">
          <div class="form-box">
            <input
              type="text"
              v-model="form.fullName"
              placeholder="Full Name *"
              required
              class="form-control"
            />
            <i class="bi bi-person"></i>
          </div>
        </div>

        <!-- 2. Mobile Phone Number -->
        <div class="col-12 col-md-6">
          <div class="form-box">
            <input
              type="tel"
              v-model="form.phone"
              placeholder="Mobile Phone (10 Digits) *"
              required
              class="form-control"
            />
            <i class="bi bi-phone"></i>
          </div>
        </div>

        <!-- 3. Email Address -->
        <div class="col-12 col-md-6">
          <div class="form-box">
            <input
              type="email"
              v-model="form.email"
              placeholder="Email Address"
              class="form-control"
            />
            <i class="bi bi-envelope"></i>
          </div>
        </div>

        <!-- 4. System Capacity (1kW - 5kW) -->
        <div class="col-12 col-md-6">
          <div class="form-box">
            <select v-model="form.capacity" class="form-select">
              <option :value="1">1 kW Rooftop System (~4 Units/Day)</option>
              <option :value="2">2 kW Rooftop System (~8 Units/Day)</option>
              <option :value="3">3 kW Rooftop System (~12 Units/Day - Bestseller)</option>
              <option :value="4">4 kW Rooftop System (~16 Units/Day)</option>
              <option :value="5">5 kW Rooftop System (~20-22 Units/Day)</option>
            </select>
            <i class="bi bi-lightning-charge"></i>
          </div>
        </div>

        <!-- 5. System Type -->
        <div class="col-12 col-md-6">
          <div class="form-box">
            <select v-model="form.systemType" class="form-select">
              <option value="ON_GRID">On-Grid (Grid-Tied with Net Metering)</option>
              <option value="OFF_GRID">Off-Grid (Solar with Battery Storage)</option>
            </select>
            <i class="bi bi-gear-wide-connected"></i>
          </div>
        </div>

        <!-- 6. Monthly Electricity Bill -->
        <div class="col-12 col-md-6">
          <div class="form-box">
            <input
              type="number"
              v-model.number="form.monthlyBill"
              placeholder="Avg. Monthly EB Bill (₹)"
              class="form-control"
            />
            <i class="bi bi-currency-rupee"></i>
          </div>
        </div>

        <!-- 7. Installation Site Address -->
        <div class="col-12">
          <div class="form-box">
            <input
              type="text"
              v-model="form.address"
              placeholder="Installation / Rooftop Site Address *"
              required
              class="form-control"
            />
            <i class="bi bi-geo-alt"></i>
          </div>
        </div>

        <!-- 8. City, State, PIN -->
        <div class="col-12 col-sm-4">
          <div class="form-box">
            <input
              type="text"
              v-model="form.city"
              placeholder="City *"
              required
              class="form-control"
            />
          </div>
        </div>
        <div class="col-12 col-sm-4">
          <div class="form-box">
            <input
              type="text"
              v-model="form.state"
              placeholder="State"
              class="form-control"
            />
          </div>
        </div>
        <div class="col-12 col-sm-4">
          <div class="form-box">
            <input
              type="text"
              v-model="form.pincode"
              placeholder="PIN Code *"
              required
              class="form-control"
            />
          </div>
        </div>

        <!-- 9. Requirements & Remarks -->
        <div class="col-12">
          <div class="form-box">
            <textarea
              v-model="form.notes"
              cols="30"
              rows="3"
              placeholder="Tell us about your rooftop (e.g. Concrete flat roof, shadow obstacles, single phase vs 3 phase)"
              class="form-control"
            ></textarea>
          </div>
        </div>

        <!-- 10. Submit Button -->
        <div class="col-12">
          <div class="form-box-button">
            <button
              type="submit"
              :disabled="submitting"
              class="btn btn-warning w-100 py-3 fw-bold text-dark text-uppercase shadow-sm"
              style="letter-spacing: 0.5px; border-radius: 8px"
            >
              <span v-if="submitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ submitting ? 'Submitting to Central ERP...' : 'Request Solar Quote & Free Site Inspection' }}
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { submitEnquiry } from '@/services/enquiryService';

const submitting = ref(false);
const serverError = ref<string | null>(null);
const submittedEnquiry = ref<{ enquiryNumber: string; message: string } | null>(null);

const form = reactive({
  fullName: '',
  phone: '',
  email: '',
  capacity: 3,
  systemType: 'ON_GRID' as 'ON_GRID' | 'OFF_GRID',
  monthlyBill: 4500,
  address: '',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600001',
  notes: '',
});

const handleSubmit = async () => {
  submitting.value = true;
  serverError.value = null;

  try {
    const res = await submitEnquiry({
      fullName: form.fullName,
      phone: form.phone,
      email: form.email || undefined,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      requestedCapacityKw: form.capacity,
      systemType: form.systemType,
      monthlyElectricityBill: form.monthlyBill,
      notes: form.notes,
    });

    submittedEnquiry.value = {
      enquiryNumber: res.enquiryNumber || 'ENQ-CONFIRMED',
      message: res.message,
    };

    // Reset form fields
    form.fullName = '';
    form.phone = '';
    form.email = '';
    form.address = '';
    form.notes = '';
  } catch (err: any) {
    serverError.value = err.message || 'Failed to submit enquiry. Please verify details.';
  } finally {
    submitting.value = false;
  }
};
</script>
