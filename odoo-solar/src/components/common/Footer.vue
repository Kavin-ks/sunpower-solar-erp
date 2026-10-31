<template>
  <footer class="footer-section" style="background: #111827; color: #94a3b8; padding-top: 60px; padding-bottom: 30px">
    <div class="container">
      <div class="row g-4">
        <!-- Col 1: Brand & About -->
        <div class="col-lg-4 col-md-6">
          <div class="footer-widget">
            <div class="footer-logo mb-3">
              <router-link to="/">
                <img src="/odoo_logo.png" alt="SunPower Solar" style="height: 50px; filter: brightness(0) invert(1)" />
              </router-link>
            </div>
            <p class="text-secondary small leading-relaxed">
              Leading provider of rooftop solar installation, grid-tied Net Metering, and high-efficiency Mono PERC
              systems for residential and commercial customers.
            </p>
            <div class="d-flex gap-2 mt-3">
              <span class="badge bg-warning text-dark px-2.5 py-1.5 fw-bold">MNRE Approved EPC</span>
              <span class="badge bg-success px-2.5 py-1.5 fw-bold">Direct Subsidy Partner</span>
            </div>
          </div>
        </div>

        <!-- Col 2: Quick Links -->
        <div class="col-lg-2 col-md-6 col-6">
          <div class="footer-widget">
            <h5 class="text-white fw-bold mb-3" style="font-size: 16px">Quick Links</h5>
            <ul class="list-unstyled small space-y-2">
              <li class="mb-2"><router-link to="/" class="text-secondary text-decoration-none">Home</router-link></li>
              <li class="mb-2"><router-link to="/about" class="text-secondary text-decoration-none">About Us</router-link></li>
              <li class="mb-2"><router-link to="/service" class="text-secondary text-decoration-none">1kW–5kW Solar</router-link></li>
              <li class="mb-2"><router-link to="/project-grid" class="text-secondary text-decoration-none">Projects</router-link></li>
              <li class="mb-2"><router-link to="/faq" class="text-secondary text-decoration-none">Subsidy FAQ</router-link></li>
              <li class="mb-2"><router-link to="/contact" class="text-secondary text-decoration-none">Contact</router-link></li>
            </ul>
          </div>
        </div>

        <!-- Col 3: Solar Systems -->
        <div class="col-lg-3 col-md-6 col-6">
          <div class="footer-widget">
            <h5 class="text-white fw-bold mb-3" style="font-size: 16px">Solar Solutions</h5>
            <ul class="list-unstyled small">
              <li class="mb-2 text-secondary">1 kW Rooftop (~4 units/day)</li>
              <li class="mb-2 text-secondary">2 kW Rooftop (~8 units/day)</li>
              <li class="mb-2 text-secondary">3 kW Bestseller (~12 units/day)</li>
              <li class="mb-2 text-secondary">5 kW High Yield (~20 units/day)</li>
              <li class="mb-2 text-secondary">On-Grid & Hybrid Battery Backup</li>
            </ul>
          </div>
        </div>

        <!-- Col 4: Contact Info -->
        <div class="col-lg-3 col-md-6">
          <div class="footer-widget">
            <h5 class="text-white fw-bold mb-3" style="font-size: 16px">Get In Touch</h5>
            <ul class="list-unstyled small text-secondary">
              <li class="mb-2 d-flex align-items-start gap-2">
                <i class="bi bi-geo-alt text-warning mt-0.5"></i>
                <span>42 Green Valley Enclave, ECR, Chennai, Tamil Nadu 600041</span>
              </li>
              <li class="mb-2 d-flex align-items-center gap-2">
                <i class="bi bi-telephone text-warning"></i>
                <span>+91 98410 29384</span>
              </li>
              <li class="mb-2 d-flex align-items-center gap-2">
                <i class="bi bi-envelope text-warning"></i>
                <span>support@sunpowersolar.com</span>
              </li>
              <li class="mb-2 d-flex align-items-center gap-2">
                <i class="bi bi-clock text-warning"></i>
                <span>Mon – Sat: 9:00 AM – 6:30 PM</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <hr class="border-secondary my-4 opacity-25" />

      <div class="d-flex flex-column flex-md-row justify-content-between align-items-center small text-secondary">
        <div>&copy; {{ new Date().getFullYear() }} SunPower Solutions. All rights reserved.</div>
        <div class="d-flex gap-3 mt-2 mt-md-0">
          <span class="text-secondary">Certified Solar EPC</span>
          <span>&bull;</span>
          <span class="text-secondary">25-Year Panel Performance</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
</script>
