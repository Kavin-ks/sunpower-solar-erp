<template>
  <div>
    <div class="py-5 bg-dark text-white text-center">
      <div class="container">
        <h1 class="fw-bold mb-2">Solar Clean Energy News & Insights</h1>
        <p class="text-secondary small mb-0">Rooftop Solar Economics, Technology Trends & Policy Updates</p>
      </div>
    </div>

    <div class="container py-5">
      <div class="row g-4">
        <div v-for="b in blogs" :key="b.id" class="col-lg-4 col-md-6">
          <div class="card h-100 border rounded-3 p-4 shadow-xs">
            <span class="badge bg-warning text-dark mb-2 align-self-start">{{ b.category }}</span>
            <h5 class="fw-bold text-dark mb-2">{{ b.title }}</h5>
            <p class="text-muted small mb-3">{{ b.summary }}</p>
            <div class="text-secondary small mt-auto pt-2 border-top">
              <i class="bi bi-calendar-event me-1"></i> {{ b.date }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const blogs = [
  {
    id: 1,
    category: 'Government Subsidy',
    title: 'How PM Surya Ghar Scheme Cuts Solar Payback to Under 3 Years',
    summary: 'A detailed breakdown of the ₹78,000 national direct benefit transfer and state rooftop solar incentives.',
    date: 'October 2026',
  },
  {
    id: 2,
    category: 'Solar Tech',
    title: 'Mono PERC vs Polycrystalline: Why Cell Efficiency Matters',
    summary: 'Understanding half-cut photovoltaic cell technology, lower temperature coefficients, and high shadow tolerance.',
    date: 'September 2026',
  },
  {
    id: 3,
    category: 'Maintenance',
    title: 'Seasonal Rooftop Solar Panel Cleaning & Generation Optimization',
    summary: 'Simple guidelines to prevent soiling losses and maximize your monthly units generated.',
    date: 'August 2026',
  },
];
</script>
