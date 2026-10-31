<template>
  <div>
    <div class="py-5 bg-dark text-white text-center">
      <div class="container">
        <h1 class="fw-bold mb-2">1 kW to 5 kW Rooftop Solar Packages</h1>
        <p class="text-secondary small mb-0">High-Efficiency Mono PERC Half-Cut Systems with Bi-Directional Net Metering</p>
      </div>
    </div>

    <div class="container py-5">
      <div class="row g-4">
        <div v-for="s in services" :key="s.id" class="col-lg-4 col-md-6">
          <div class="card h-100 border p-4 rounded-3 shadow-xs">
            <span class="badge bg-warning text-dark align-self-start mb-2">{{ s.tag }}</span>
            <h4 class="fw-bold text-dark">{{ s.title }}</h4>
            <p class="text-muted small">{{ s.desc }}</p>
            <div class="fs-4 fw-bold text-success mb-3">{{ s.price }}</div>
            <ul class="list-unstyled small border-top pt-3 text-secondary space-y-2">
              <li class="mb-2">&bull; <strong>Generation:</strong> {{ s.units }}</li>
              <li class="mb-2">&bull; <strong>Roof Space:</strong> {{ s.area }}</li>
              <li class="mb-2">&bull; <strong>Subsidy:</strong> {{ s.subsidy }}</li>
              <li>&bull; <strong>Inverter:</strong> Smart MPPT Grid-Tie</li>
            </ul>
            <router-link to="/contact" class="btn btn-outline-warning text-dark fw-bold w-100 mt-4">
              Get Quotation
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const services = [
  {
    id: 1,
    tag: 'Compact',
    title: '1 kW On-Grid Solar System',
    desc: 'Perfect for small homes wanting to offset baseline electrical load.',
    price: '₹68,000',
    units: '~4 - 4.5 Units / Day',
    area: '80–100 Sq. Ft.',
    subsidy: '₹30,000 Direct DBT',
  },
  {
    id: 2,
    tag: 'Standard',
    title: '2 kW On-Grid Solar System',
    desc: 'Ideal for 2BHK households running washing machine & appliances.',
    price: '₹1,28,000',
    units: '~8 - 9 Units / Day',
    area: '160–200 Sq. Ft.',
    subsidy: '₹60,000 Direct DBT',
  },
  {
    id: 3,
    tag: 'Bestseller',
    title: '3 kW On-Grid Solar System',
    desc: 'Our most popular system, easily powers ACs and heavy appliances.',
    price: '₹1,85,000',
    units: '~12 - 14 Units / Day',
    area: '240–300 Sq. Ft.',
    subsidy: '₹78,000 Max Direct DBT',
  },
  {
    id: 4,
    tag: 'High Yield',
    title: '4 kW On-Grid Solar System',
    desc: 'High output setup for modern villas and homes with EV charging.',
    price: '₹2,42,000',
    units: '~16 - 18 Units / Day',
    area: '320–400 Sq. Ft.',
    subsidy: '₹78,000 Direct DBT',
  },
  {
    id: 5,
    tag: 'Maximum Yield',
    title: '5 kW On-Grid Solar System',
    desc: 'Top capacity residential system for zero net electricity bills.',
    price: '₹2,95,000',
    units: '~20 - 22 Units / Day',
    area: '400–500 Sq. Ft.',
    subsidy: '₹78,000 Direct DBT',
  },
];
</script>
