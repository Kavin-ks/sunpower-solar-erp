<template>
  <div>
    <!-- Page Header -->
    <div class="py-5 bg-dark text-white text-center">
      <div class="container">
        <h1 class="fw-bold mb-2">Contact & Request Rooftop Solar Quote</h1>
        <p class="text-secondary small mb-0">Direct Integration with SunPower Central ERP</p>
      </div>
    </div>

    <!-- Contact & Form Section -->
    <div class="container py-5">
      <div class="row g-5">
        <!-- Contact Information -->
        <div class="col-lg-5">
          <span class="text-warning fw-bold text-uppercase" style="font-size: 13px">Headquarters & Support</span>
          <h2 class="fw-bold text-dark mt-1 mb-4">We Are Here To Assist Your Solar Transition</h2>

          <div class="space-y-4">
            <div class="d-flex align-items-start gap-3 mb-4">
              <div class="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px">
                <i class="bi bi-geo-alt fs-5"></i>
              </div>
              <div>
                <h6 class="fw-bold text-dark mb-1">Corporate Office & Warehouse</h6>
                <p class="text-muted small mb-0">42 Green Valley Enclave, ECR, Chennai, Tamil Nadu 600041</p>
              </div>
            </div>

            <div class="d-flex align-items-start gap-3 mb-4">
              <div class="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px">
                <i class="bi bi-telephone fs-5"></i>
              </div>
              <div>
                <h6 class="fw-bold text-dark mb-1">Direct Phone & WhatsApp</h6>
                <p class="text-muted small mb-0">+91 98410 29384 / +91 98765 43210</p>
              </div>
            </div>

            <div class="d-flex align-items-start gap-3 mb-4">
              <div class="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px">
                <i class="bi bi-envelope fs-5"></i>
              </div>
              <div>
                <h6 class="fw-bold text-dark mb-1">Official Email Address</h6>
                <p class="text-muted small mb-0">contact@sunpowersolar.com / sales@sunpower.com</p>
              </div>
            </div>

            <div class="d-flex align-items-start gap-3">
              <div class="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px">
                <i class="bi bi-clock fs-5"></i>
              </div>
              <div>
                <h6 class="fw-bold text-dark mb-1">Operating Hours</h6>
                <p class="text-muted small mb-0">Monday – Saturday: 9:00 AM – 6:30 PM</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Enquiry Form -->
        <div class="col-lg-7">
          <div class="bg-white p-4 p-md-5 rounded-4 shadow-sm border border-slate-100">
            <h4 class="fw-bold text-dark mb-2">Submit Rooftop Solar Enquiry</h4>
            <p class="text-muted small mb-4">
              Our sales engineering department will inspect your rooftop via satellite and call you with your custom quotation.
            </p>
            <EnquiryForm />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import EnquiryForm from '@/components/forms/EnquiryForm.vue';
</script>
