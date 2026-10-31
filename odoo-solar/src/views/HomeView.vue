<template>
  <div>
    <!-- 1. HERO BANNER -->
    <section class="hero-section py-5" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff">
      <div class="container py-lg-4">
        <div class="row align-items-center g-5">
          <div class="col-lg-7">
            <div class="badge bg-warning text-dark px-3 py-1.5 fw-bold mb-3" style="font-size: 13px; border-radius: 20px">
              ☀️ Clean Energy • High ROI • Zero Electricity Bills
            </div>
            <h1 class="display-4 fw-bolder text-white mb-3" style="letter-spacing: -0.5px; line-height: 1.15">
              Power Your Home With High Efficiency Solar Rooftop
            </h1>
            <p class="lead text-light mb-4" style="font-size: 17px; opacity: 0.9; max-width: 620px">
              Turn your unused terrace into an electric power station. Get certified Tier-1 Mono PERC systems, bi-directional
              net-metering, and up to ₹78,000 direct government subsidy.
            </p>

            <div class="d-flex flex-wrap gap-3 mb-4">
              <a href="#quote-section" class="btn btn-warning btn-lg px-4 py-2.5 fw-bold text-dark shadow-sm">
                Get Instant Solar Quote <i class="bi bi-arrow-right ms-1"></i>
              </a>
              <router-link to="/service" class="btn btn-outline-light btn-lg px-4 py-2.5 fw-semibold">
                Explore Packages
              </router-link>
            </div>

            <!-- Highlights -->
            <div class="row g-3 pt-3 border-top border-secondary opacity-75">
              <div class="col-4">
                <div class="fw-bold fs-4 text-warning">25 Years</div>
                <div class="small text-light">Panel Performance</div>
              </div>
              <div class="col-4">
                <div class="fw-bold fs-4 text-warning">₹78,000</div>
                <div class="small text-light">PM Surya Subsidy</div>
              </div>
              <div class="col-4">
                <div class="fw-bold fs-4 text-warning">3–4 Yrs</div>
                <div class="small text-light">Payback Period</div>
              </div>
            </div>
          </div>

          <!-- Hero Image -->
          <div class="col-lg-5 text-center">
            <div class="p-2 rounded-4 shadow-lg" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1)">
              <img
                src="/assets/images/resource/service1.png"
                alt="Solar Rooftop"
                class="img-fluid rounded-3"
                style="max-height: 420px; object-fit: cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. SOLAR QUOTE ENQUIRY FORM SECTION -->
    <section id="quote-section" class="py-5" style="background: #f8fafc">
      <div class="container py-3">
        <div class="row justify-content-center mb-4 text-center">
          <div class="col-lg-8">
            <span class="text-warning fw-bold text-uppercase" style="letter-spacing: 1px; font-size: 13px">
              Direct ERP Integration
            </span>
            <h2 class="fw-bold mt-1 text-dark" style="letter-spacing: -0.5px">
              Request Your Custom Rooftop Solar Proposal
            </h2>
            <p class="text-muted" style="font-size: 15px">
              Fill out your rooftop details below. Your enquiry is dispatched directly to our Sales & Engineering team
              to compute your exact BOM, estimated generation, and subsidy amount.
            </p>
          </div>
        </div>

        <div class="row justify-content-center">
          <div class="col-lg-10">
            <div class="bg-white p-4 p-md-5 rounded-4 shadow-sm border border-slate-100">
              <EnquiryForm />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. POPULAR SOLAR PACKAGES (1kW to 5kW) -->
    <section class="py-5 bg-white">
      <div class="container py-3">
        <div class="text-center mb-5">
          <span class="text-warning fw-bold text-uppercase" style="letter-spacing: 1px; font-size: 13px">
            Certified Systems
          </span>
          <h2 class="fw-bold mt-1 text-dark">Rooftop Solar Capacities for Every Home</h2>
          <p class="text-muted" style="max-width: 600px; margin: 0 auto">
            Configured with high-efficiency Mono PERC half-cut panels, smart MPPT inverters, and lightning surge protection.
          </p>
        </div>

        <div class="row g-4">
          <div v-for="pkg in packages" :key="pkg.id" class="col-lg-4 col-md-6">
            <div class="card h-100 border rounded-3 p-4 shadow-xs hover-shadow transition">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="badge bg-warning text-dark fw-bold px-2.5 py-1">{{ pkg.tag }}</span>
                <span class="text-muted small fw-semibold">{{ pkg.capacity }}</span>
              </div>
              <h4 class="fw-bold text-dark mb-1">{{ pkg.title }}</h4>
              <p class="text-muted small mb-3">{{ pkg.desc }}</p>
              <div class="fs-4 fw-bolder text-emerald-700 mb-3" style="color: #047857">{{ pkg.price }}</div>

              <ul class="list-unstyled small space-y-2 mb-4 border-top border-bottom py-3">
                <li class="mb-2 d-flex align-items-center gap-2">
                  <i class="bi bi-check-circle-fill text-success"></i>
                  <span><strong>Generation:</strong> {{ pkg.generation }}</span>
                </li>
                <li class="mb-2 d-flex align-items-center gap-2">
                  <i class="bi bi-check-circle-fill text-success"></i>
                  <span><strong>Roof Area:</strong> {{ pkg.area }}</span>
                </li>
                <li class="mb-2 d-flex align-items-center gap-2">
                  <i class="bi bi-check-circle-fill text-success"></i>
                  <span><strong>Panels:</strong> {{ pkg.panels }}</span>
                </li>
                <li class="d-flex align-items-center gap-2">
                  <i class="bi bi-check-circle-fill text-success"></i>
                  <span><strong>Subsidy:</strong> {{ pkg.subsidy }}</span>
                </li>
              </ul>

              <a href="#quote-section" class="btn btn-outline-warning text-dark fw-bold w-100 mt-auto">
                Request {{ pkg.capacity }} Quote
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. WHY SUNPOWER -->
    <section class="py-5" style="background: #f1f5f9">
      <div class="container py-3">
        <div class="row g-4 align-items-center">
          <div class="col-lg-6">
            <span class="text-warning fw-bold text-uppercase" style="letter-spacing: 1px; font-size: 13px">
              Turnkey Solar EPC
            </span>
            <h2 class="fw-bold mt-1 text-dark">Why Choose SunPower Solutions?</h2>
            <p class="text-muted mb-4">
              We manage the complete lifecycle from technical site survey, shadow analysis, structure fabrication,
              net-meter approvals with EB, through final commissioning.
            </p>

            <div class="space-y-3">
              <div class="d-flex gap-3 mb-3">
                <div class="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px">
                  <i class="bi bi-shield-check fs-5"></i>
                </div>
                <div>
                  <h6 class="fw-bold mb-1 text-dark">20-Year Serialized Warranty</h6>
                  <p class="text-muted small mb-0">Every panel and inverter is individually serial-tracked in our central ERP database.</p>
                </div>
              </div>

              <div class="d-flex gap-3 mb-3">
                <div class="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px">
                  <i class="bi bi-lightning-charge fs-5"></i>
                </div>
                <div>
                  <h6 class="fw-bold mb-1 text-dark">Zero-Cost Electricity Generation</h6>
                  <p class="text-muted small mb-0">Export excess generation to the electrical grid via bi-directional net-metering.</p>
                </div>
              </div>

              <div class="d-flex gap-3">
                <div class="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px">
                  <i class="bi bi-cash-coin fs-5"></i>
                </div>
                <div>
                  <h6 class="fw-bold mb-1 text-dark">Direct National Portal Subsidy</h6>
                  <p class="text-muted small mb-0">Seamless documentation assistance for PM Surya Ghar Muft Bijli Yojana.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-6 text-center">
            <img
              src="/assets/images/about/about-thumb2.png"
              alt="Installation Crew"
              class="img-fluid rounded-4 shadow-sm"
              style="max-height: 400px; object-fit: cover"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import EnquiryForm from '@/components/forms/EnquiryForm.vue';

const packages = [
  {
    id: 1,
    capacity: '1 kW',
    tag: 'Compact Starter',
    title: '1 kW Rooftop Solar',
    desc: 'Ideal for 1-2 BHK homes running lights, fans, TV, and refrigerator.',
    price: '₹68,000 (Before Subsidy)',
    generation: '4 – 4.5 Units / Day',
    area: '80 – 100 Sq. Ft.',
    panels: '2x 550W Mono PERC Half-Cut',
    subsidy: 'Up to ₹30,000 Direct DBT',
  },
  {
    id: 2,
    capacity: '2 kW',
    tag: 'Popular Choice',
    title: '2 kW Rooftop Solar',
    desc: 'Perfect for small families running washing machine, mixer, and appliances.',
    price: '₹1,28,000 (Before Subsidy)',
    generation: '8 – 9 Units / Day',
    area: '160 – 200 Sq. Ft.',
    panels: '4x 550W Mono PERC Half-Cut',
    subsidy: 'Up to ₹60,000 Direct DBT',
  },
  {
    id: 3,
    capacity: '3 kW',
    tag: 'Top Bestseller',
    title: '3 kW Rooftop Solar',
    desc: 'Complete power for 1x 1.5-ton Inverter AC, refrigerator, and entire home.',
    price: '₹1,85,000 (Before Subsidy)',
    generation: '12 – 14 Units / Day',
    area: '240 – 300 Sq. Ft.',
    panels: '6x 550W Mono PERC Half-Cut',
    subsidy: 'Max ₹78,000 Full DBT Subsidy',
  },
  {
    id: 4,
    capacity: '4 kW',
    tag: 'High Yield',
    title: '4 kW Rooftop Solar',
    desc: 'Supports multi-split ACs, water pump motor, and modern appliances.',
    price: '₹2,42,000 (Before Subsidy)',
    generation: '16 – 18 Units / Day',
    area: '320 – 400 Sq. Ft.',
    panels: '8x 550W Mono PERC Half-Cut',
    subsidy: '₹78,000 Central DBT Subsidy',
  },
  {
    id: 5,
    capacity: '5 kW',
    tag: 'Maximum Capacity',
    title: '5 kW Rooftop Solar',
    desc: 'For large duplex homes, villas, or commercial light offices with EV charger.',
    price: '₹2,95,000 (Before Subsidy)',
    generation: '20 – 22 Units / Day',
    area: '400 – 500 Sq. Ft.',
    panels: '10x 550W Mono PERC Half-Cut',
    subsidy: '₹78,000 Central DBT Subsidy',
  },
];
</script>

<style scoped>
.hover-shadow:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08) !important;
  transform: translateY(-2px);
}
.transition {
  transition: all 0.2s ease-in-out;
}
</style>
