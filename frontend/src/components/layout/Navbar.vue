<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { Sun, LogOut, ShieldCheck } from 'lucide-vue-next';

const authStore = useAuthStore();
const router = useRouter();

const roleOptions = [
  { label: 'Admin (Full Access)', username: 'admin' },
  { label: 'Sales Lead', username: 'sales' },
  { label: 'Warehouse Manager', username: 'warehouse' },
  { label: 'Technician Lead', username: 'technician' },
  { label: 'Support Officer', username: 'support' },
  { label: 'Finance Manager', username: 'finance' },
];

const handleRoleSwitch = async (event: Event) => {
  const target = event.target as HTMLSelectElement;
  await authStore.switchRole(target.value);
  router.push('/');
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
    <div class="flex items-center justify-between px-6 py-3">
      <!-- Logo and Brand -->
      <div class="flex items-center space-x-3">
        <div class="bg-gradient-to-tr from-amber-500 to-emerald-600 p-2 rounded-xl text-white shadow-sm flex items-center justify-center">
          <Sun class="w-6 h-6 animate-spin-slow" />
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <span class="text-xl font-bold tracking-tight text-slate-900">SunPower</span>
            <span class="text-xl font-light text-emerald-600">Solutions</span>
            <span class="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md border border-emerald-200">
              Enterprise ERP
            </span>
          </div>
          <p class="text-xs text-slate-500">Solar Project & Installation Management System</p>
        </div>
      </div>

      <!-- Right Actions: Quick Role Switcher & User Profile -->
      <div class="flex items-center space-x-4">
        <!-- Quick Evaluator Role Switcher -->
        <div class="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 space-x-2">
          <ShieldCheck class="w-4 h-4 text-emerald-600" />
          <span class="font-semibold text-slate-500">Active Role:</span>
          <select
            :value="authStore.user?.username || 'admin'"
            @change="handleRoleSwitch"
            class="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
          >
            <option v-for="opt in roleOptions" :key="opt.username" :value="opt.username">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- User profile info -->
        <div class="flex items-center space-x-2 border-l border-slate-200 pl-4">
          <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            {{ authStore.user?.fullName?.charAt(0) || 'U' }}
          </div>
          <div class="hidden md:block text-left">
            <p class="text-xs font-semibold text-slate-800 leading-tight">{{ authStore.user?.fullName }}</p>
            <p class="text-[11px] text-slate-500">{{ authStore.user?.roles?.[0]?.replace('ROLE_', '') }}</p>
          </div>
        </div>

        <!-- Logout button -->
        <button
          type="button"
          @click="handleLogout"
          title="Sign Out"
          class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </div>
  </header>
</template>
