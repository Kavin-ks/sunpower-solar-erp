<template>
  <div>
    <div class="py-5 bg-dark text-white text-center">
      <div class="container">
        <h1 class="fw-bold mb-2">Solar Technical Engineering & Net Metering</h1>
        <p class="text-secondary small mb-0">On-Grid, Hybrid Battery Backup & Structural Earthing Protection</p>
      </div>
    </div>

    <div class="container py-5">
      <div class="row g-5 align-items-center">
        <div class="col-lg-6">
          <span class="text-warning fw-bold text-uppercase" style="font-size: 13px">Engineering Standards</span>
          <h2 class="fw-bold text-dark mt-1">High-Safety Turnkey Solar Architecture</h2>
          <p class="text-muted leading-relaxed mt-3">
            Every SunPower rooftop solar installation undergoes rigorous pre-installation electrical engineering.
            We use galvanized iron (GI) structures capable of withstanding 150 km/h wind speeds, paired with dedicated copper earthing pits and Type-II surge protection devices (SPDs).
          </p>
          <ul class="list-unstyled space-y-2 text-secondary small">
            <li class="mb-2"><i class="bi bi-check-circle-fill text-warning me-2"></i> Tier-1 Mono PERC Half-Cut photovoltaic panels (21.5%+ cell efficiency)</li>
            <li class="mb-2"><i class="bi bi-check-circle-fill text-warning me-2"></i> IP65-rated smart string inverters with built-in WiFi monitoring</li>
            <li class="mb-2"><i class="bi bi-check-circle-fill text-warning me-2"></i> Double-insulated 4 sq.mm UV-resistant solar DC cables</li>
            <li class="mb-2"><i class="bi bi-check-circle-fill text-warning me-2"></i> Chemical earthing pits ensuring ground resistance under 2.0 Ohms</li>
          </ul>

          <router-link to="/contact" class="btn btn-warning px-4 py-2.5 fw-bold text-dark mt-3 shadow-sm">
            Book Site Survey
          </router-link>
        </div>

        <div class="col-lg-6 text-center">
          <img
            src="/assets/images/resource/service-details.png"
            alt="Technical Architecture"
            class="img-fluid rounded-4 shadow-sm"
            style="max-height: 400px; object-fit: cover"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
