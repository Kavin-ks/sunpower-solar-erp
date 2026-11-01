<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { Sun, LogOut, ShieldCheck } from 'lucide-vue-next';

const authStore = useAuthStore();
const router = useRouter();

const roleGroups = [
  {
    group: 'Department Heads & Operations',
    options: [
      { label: 'Admin (Full Access & Oversight)', username: 'admin' },
      { label: 'Sales Lead', username: 'sales' },
      { label: 'Warehouse Manager', username: 'warehouse' },
      { label: 'Support Officer', username: 'support' },
      { label: 'Finance Manager', username: 'finance' },
    ],
  },
  {
    group: 'Field Crew Technicians (15 Field Techs)',
    options: [
      { label: 'Tech 1: Karthik Raja', username: 'technician' },
      { label: 'Tech 2: Ganesh Moorthy', username: 'tech.ganesh' },
      { label: 'Tech 3: Selvakumar R', username: 'tech.selva' },
      { label: 'Tech 4: Praveen Kumar', username: 'tech.praveen' },
      { label: 'Tech 5: Dinesh Babu', username: 'tech.dinesh' },
      { label: 'Tech 6: Manoj Prabhakar', username: 'tech.manoj' },
      { label: 'Tech 7: Saravanan V', username: 'tech.saravanan' },
      { label: 'Tech 8: Anand Raj', username: 'tech.anand' },
      { label: 'Tech 9: Vijay Anand', username: 'tech.vijay' },
      { label: 'Tech 10: Muthukumar K', username: 'tech.muthu' },
      { label: 'Tech 11: Balamurugan P', username: 'tech.bala' },
      { label: 'Tech 12: Senthil Nathan', username: 'tech.senthil' },
      { label: 'Tech 13: Hariharan S', username: 'tech.hari' },
      { label: 'Tech 14: Ravi Chandran', username: 'tech.ravi' },
      { label: 'Tech 15: Vigneshwar M', username: 'tech.vignesh' },
    ],
  },
];

const handleRoleSwitch = async (event: Event) => {
  const target = event.target as HTMLSelectElement;
  try {
    await authStore.switchRole(target.value);
    window.location.href = '/';
  } catch (err) {
    console.error('Failed to switch role', err);
  }
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
            <optgroup v-for="g in roleGroups" :key="g.group" :label="g.group">
              <option v-for="opt in g.options" :key="opt.username" :value="opt.username">
                {{ opt.label }}
              </option>
            </optgroup>
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
