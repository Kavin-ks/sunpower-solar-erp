<script setup lang="ts">
import Navbar from './Navbar.vue';
import Sidebar from './Sidebar.vue';
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col text-slate-800">
    <Navbar />
    <div class="flex flex-1">
      <Sidebar />
      <main class="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
        <router-view />
      </main>
    </div>
  </div>
</template>
