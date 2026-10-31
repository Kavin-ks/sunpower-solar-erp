<template>
  <div id="app-root" class="d-flex flex-column min-vh-100">
    <Header />
    <main class="flex-grow-1">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import Header from '@/components/common/Header.vue';
import Footer from '@/components/common/Footer.vue';
</script>

<style>
/* Global styling overrides */
body {
  font-family: 'Jost', sans-serif;
  color: #334155;
  background-color: #ffffff;
  margin: 0;
  padding: 0;
}
</style>
