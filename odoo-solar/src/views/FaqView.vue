<template>
  <div>
    <div class="py-5 bg-dark text-white text-center">
      <div class="container">
        <h1 class="fw-bold mb-2">Government Solar Subsidy FAQs</h1>
        <p class="text-secondary small mb-0">PM Surya Ghar Muft Bijli Yojana & Net Metering Guidelines</p>
      </div>
    </div>

    <div class="container py-5" style="max-width: 860px">
      <div class="accordion" id="subsidyFaqAccordion">
        <div v-for="(f, idx) in faqs" :key="idx" class="accordion-item mb-3 border rounded-3 overflow-hidden shadow-xs">
          <h2 class="accordion-header" :id="'heading' + idx">
            <button
              class="accordion-button fw-bold text-dark"
              :class="{ collapsed: idx !== 0 }"
              type="button"
              data-bs-toggle="collapse"
              :data-bs-target="'#collapse' + idx"
              aria-expanded="true"
              :aria-controls="'collapse' + idx"
            >
              {{ f.question }}
            </button>
          </h2>
          <div
            :id="'collapse' + idx"
            class="accordion-collapse collapse"
            :class="{ show: idx === 0 }"
            :aria-labelledby="'heading' + idx"
            data-bs-parent="#subsidyFaqAccordion"
          >
            <div class="accordion-body text-secondary leading-relaxed small">
              {{ f.answer }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const faqs = [
  {
    question: 'How much subsidy do I get for a 3kW residential rooftop system?',
    answer:
      'Under the PM Surya Ghar Muft Bijli Yojana, residential installations receive ₹30,000 per kW for the first 2 kW (₹60,000) plus ₹18,000 for the 3rd kW, giving a maximum direct DBT subsidy of ₹78,000 directly credited to your bank account.',
  },
  {
    question: 'How long does net-meter installation take with EB?',
    answer:
      'Once physical installation is completed and certified by our licensed electrical supervisor, the local DISCOM/EB inspects the bi-directional meter and synchronizes the grid connection within 10 to 15 working days.',
  },
  {
    question: 'What is the required roof terrace area for solar panels?',
    answer:
      'Each 550W Mono PERC half-cut panel requires approximately 40 to 45 sq. ft. of shadow-free area. A 1 kW system requires ~80-100 sq.ft., a 3 kW system requires ~240-300 sq.ft., and a 5 kW system requires ~400-500 sq.ft.',
  },
  {
    question: 'What happens during power cuts with an On-Grid solar system?',
    answer:
      'As per international anti-islanding safety standards (IEC 62116), on-grid inverters automatically disconnect within milliseconds during a power outage to protect EB linemen working on grid lines. If you require power during outages, we offer hybrid solar systems with battery storage.',
  },
];
</script>
