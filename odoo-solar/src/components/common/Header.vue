<template>
  <header
    class="solar-header-section"
    id="sticky-header"
    :class="{ 'sticky-nav': isSticky }"
    style="background: #ffffff; box-shadow: 0 2px 12px rgba(0,0,0,0.06); position: sticky; top: 0; z-index: 999;"
  >
    <div class="container-fluid px-lg-5">
      <div class="d-flex align-items-center justify-content-between py-2" style="min-height: 68px">
        <!-- BRAND LOGO -->
        <div class="d-flex align-items-center flex-shrink-0 py-1" style="max-width: 340px">
          <router-link to="/" class="d-flex align-items-center text-decoration-none">
            <img
              src="/odoo_logo.png"
              alt="SunPower Solar"
              style="height: 54px; width: auto; object-fit: contain; display: block"
            />
          </router-link>
        </div>

        <!-- NAV MENU (Desktop) -->
        <div class="header-menu-container flex-grow-1 d-none d-lg-flex justify-content-center mx-2">
          <nav class="minimal-solar-nav">
            <ul class="d-flex align-items-center gap-4 list-unstyled mb-0">
              <li v-for="item in menuData" :key="item.id" class="position-relative nav-item-wrapper">
                <router-link
                  v-if="!item.has_dropdown"
                  :to="item.link"
                  class="text-decoration-none fw-semibold text-dark px-2 py-1"
                >
                  {{ item.title }}
                </router-link>
                <a
                  v-else
                  href="#"
                  @click.prevent
                  class="text-decoration-none fw-semibold text-dark px-2 py-1 d-inline-flex align-items-center gap-1"
                >
                  {{ item.title }}
                  <i class="bi bi-chevron-down" style="font-size: 11px"></i>
                </a>

                <!-- Dropdown Menu -->
                <div v-if="item.has_dropdown" class="dropdown-menu-custom shadow-sm rounded-2">
                  <ul class="list-unstyled mb-0 py-2">
                    <li v-for="(sub, sIdx) in item.sub_menus" :key="sIdx">
                      <router-link
                        :to="sub.link"
                        class="dropdown-item px-3 py-2 text-dark text-decoration-none d-block"
                      >
                        {{ sub.title }}
                      </router-link>
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </nav>
        </div>

        <!-- RIGHT CTA BUTTONS -->
        <div class="d-flex align-items-center gap-3 flex-shrink-0">
          <a
            href="http://localhost:5173"
            target="_blank"
            class="btn btn-outline-secondary btn-sm px-3 py-2 fw-semibold d-none d-sm-inline-flex align-items-center gap-1.5"
            style="border-radius: 6px; font-size: 13px"
          >
            <i class="bi bi-shield-lock text-emerald-600"></i>
            <span>ERP Portal</span>
          </a>

          <router-link
            to="/contact"
            class="btn btn-sm text-white fw-bold d-flex align-items-center gap-2 px-3 py-2 shadow-sm"
            style="background: #e63a27; border-radius: 6px; font-size: 14px; letter-spacing: 0.2px; white-space: nowrap"
          >
            <span>Get A Quote</span>
            <i class="bi bi-arrow-right"></i>
          </router-link>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const isSticky = ref(false);

const handleScroll = () => {
  isSticky.value = window.scrollY > 80;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

const menuData = [
  { id: 1, title: 'Home', link: '/', has_dropdown: false },
  { id: 2, title: 'About', link: '/about', has_dropdown: false },
  {
    id: 3,
    title: 'Services',
    link: '/service',
    has_dropdown: true,
    sub_menus: [
      { link: '/service', title: '1kW–5kW Solar Packages' },
      { link: '/service-details', title: 'On-Grid & Off-Grid Systems' },
    ],
  },
  {
    id: 4,
    title: 'Projects',
    link: '/project-grid',
    has_dropdown: true,
    sub_menus: [
      { link: '/project-grid', title: 'Case Studies & Installations' },
      { link: '/project-details', title: 'Rooftop System Engineering' },
    ],
  },
  {
    id: 5,
    title: 'Pages',
    link: '#',
    has_dropdown: true,
    sub_menus: [
      { link: '/team', title: 'Our 15-Crew Technicians' },
      { link: '/faq', title: 'Government Subsidy FAQ' },
      { link: '/blog', title: 'Solar Clean Energy News' },
    ],
  },
  { id: 6, title: 'Contact', link: '/contact', has_dropdown: false },
];
</script>

<style scoped>
.solar-header-section {
  transition: all 0.3s ease;
}
.nav-item-wrapper:hover .dropdown-menu-custom {
  display: block;
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.dropdown-menu-custom {
  display: none;
  opacity: 0;
  visibility: hidden;
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 220px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  transform: translateY(10px);
  z-index: 1000;
}
.dropdown-item:hover {
  background: #f8fafc;
  color: #e63a27 !important;
}
</style>
