<template>
  <div>
    <div class="py-5 bg-dark text-white text-center">
      <div class="container">
        <h1 class="fw-bold mb-2">Installed Solar Rooftop Projects</h1>
        <p class="text-secondary small mb-0">Delivering 40+ Certified Rooftop Installations Every Month</p>
      </div>
    </div>

    <div class="container py-5">
      <div class="row g-4">
        <div v-for="p in projects" :key="p.id" class="col-lg-4 col-md-6">
          <div class="card h-100 border rounded-3 overflow-hidden shadow-xs">
            <img :src="p.img" :alt="p.title" class="card-img-top" style="height: 220px; object-fit: cover" onerror="this.src='/assets/img/resource/service1.png'" />
            <div class="card-body p-4">
              <span class="badge bg-warning text-dark mb-2">{{ p.capacity }}</span>
              <h5 class="fw-bold text-dark mb-1">{{ p.title }}</h5>
              <p class="text-muted small mb-2"><i class="bi bi-geo-alt text-warning me-1"></i>{{ p.location }}</p>
              <p class="text-secondary small mb-0">{{ p.details }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const projects = [
  {
    id: 1,
    title: 'Residential Rooftop Solar',
    capacity: '5 kW On-Grid',
    location: 'Anna Nagar, Chennai',
    details: '10x 550W Half-Cut panels, 22 units daily generation, Net Metering synchronized.',
    img: '/assets/images/project/project1.png',
  },
  {
    id: 2,
    title: 'Individual Villa Solar System',
    capacity: '3 kW On-Grid',
    location: 'ECR, Chennai',
    details: '6x 550W Mono PERC panels, full ₹78,000 PM Surya subsidy approved.',
    img: '/assets/images/project/project2.png',
  },
  {
    id: 3,
    title: 'Duplex Home Solar Plant',
    capacity: '4 kW Hybrid',
    location: 'Velachery, Chennai',
    details: 'Lithium battery backup + grid synchronization for 24x7 uninterrupted power.',
    img: '/assets/images/project/project3.png',
  },
];
</script>
