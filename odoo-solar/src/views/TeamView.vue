<template>
  <div>
    <div class="py-5 bg-dark text-white text-center">
      <div class="container">
        <h1 class="fw-bold mb-2">Our Field Engineering & Installation Crew</h1>
        <p class="text-secondary small mb-0">Certified Rooftop Solar Technicians & Electrical Supervisors</p>
      </div>
    </div>

    <div class="container py-5">
      <div class="row g-4">
        <div v-for="t in team" :key="t.id" class="col-lg-3 col-md-6 text-center">
          <div class="card border rounded-3 p-4 shadow-xs h-100">
            <div class="mx-auto mb-3 rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center" style="width: 72px; height: 72px">
              <i class="bi bi-person-badge fs-2"></i>
            </div>
            <h5 class="fw-bold text-dark mb-1">{{ t.name }}</h5>
            <div class="text-warning small fw-semibold mb-2">{{ t.role }}</div>
            <p class="text-secondary small mb-0">{{ t.spec }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const team = [
  { id: 1, name: 'S. Rajesh Kannan', role: 'Chief Solar Engineer', spec: '12+ years experience in high-voltage net metering & substation approvals.' },
  { id: 2, name: 'P. Vigneshwaran', role: 'Lead Field Technician', spec: 'Certified Rooftop Mounting & Galvanized Iron Structure Specialist.' },
  { id: 3, name: 'M. Arun Kumar', role: 'Inverter & Electrical Lead', spec: 'Expert in string inverter DC stringing, SPD protection & earthing.' },
  { id: 4, name: 'K. Balaji', role: 'Commissioning Officer', spec: 'Specialist in bi-directional meter testing & DISCOM synchronization.' },
];
</script>
