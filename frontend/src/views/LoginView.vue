<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { Sun, Lock, User, ArrowRight, ShieldCheck } from 'lucide-vue-next';

const username = ref('admin');
const password = ref('password123');
const error = ref('');
const loading = ref(false);

const authStore = useAuthStore();
const router = useRouter();

const handleSubmit = async () => {
  error.value = '';
  loading.value = true;
  try {
    await authStore.login(username.value, password.value);
    router.push('/');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Invalid username or password';
  } finally {
    loading.value = false;
  }
};

const handleQuickSelect = (u: string) => {
  username.value = u;
  password.value = 'password123';
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-600 text-white shadow-lg mb-3">
          <Sun class="w-10 h-10" />
        </div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">SunPower Solutions</h1>
        <p class="text-sm text-slate-500 mt-1">Solar Installation Management System</p>
        <div class="mt-3">
          <router-link
            to="/enquiry"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg transition"
          >
            <span>Prospective Customer? Submit Solar Enquiry →</span>
          </router-link>
        </div>
      </div>

      <div v-if="error" class="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
        {{ error }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Username
          </label>
          <div class="relative">
            <User class="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              v-model="username"
              required
              class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              placeholder="Enter username"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Password
          </label>
          <div class="relative">
            <Lock class="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="password"
              v-model="password"
              required
              class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              placeholder="Enter password"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          <span>{{ loading ? 'Authenticating...' : 'Sign In' }}</span>
          <ArrowRight class="w-4 h-4" />
        </button>
      </form>

      <!-- Demo Quick Logins -->
      <div class="mt-6 pt-6 border-t border-slate-100 text-center">
        <div class="flex items-center justify-center space-x-1 text-xs text-slate-500 font-medium mb-3">
          <ShieldCheck class="w-4 h-4 text-emerald-600" />
          <span>Department Account Quick Fill:</span>
        </div>
        <div class="grid grid-cols-4 gap-1.5">
          <button
            v-for="p in [
              { label: 'Admin', u: 'admin' },
              { label: 'Sales', u: 'sales' },
              { label: 'Warehouse', u: 'warehouse' },
              { label: 'Technician', u: 'technician' },
              { label: 'Tech Ganesh', u: 'tech.ganesh' },
              { label: 'Support', u: 'support' },
              { label: 'Finance', u: 'finance' },
            ]"
            :key="p.u"
            type="button"
            @click="handleQuickSelect(p.u)"
            :class="[
              'text-[11px] py-1.5 px-1 rounded-lg border transition cursor-pointer font-medium truncate',
              username === p.u
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            ]"
          >
            {{ p.label }}
          </button>
        </div>
        <p class="text-[11px] text-slate-400 mt-2.5">Initial setup password: <code class="text-slate-600 font-mono">password123</code></p>
        
        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Customer & Warranty Portal:</span>
          <a
            href="http://localhost:3000/complaint"
            target="_blank"
            class="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1"
          >
            <span>Odoo Solar Portal (3000) ↗</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
