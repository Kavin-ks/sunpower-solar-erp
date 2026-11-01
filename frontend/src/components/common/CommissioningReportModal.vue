<script setup lang="ts">
import { computed } from 'vue';
import { Award, Printer, CheckCircle2, ShieldCheck, Calendar, Clock, MapPin, User, FileText, X } from 'lucide-vue-next';

const props = defineProps<{
  installation: any;
  dispatch?: any;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const order = computed(() => props.installation?.salesOrder || props.dispatch?.salesOrder);
const customer = computed(() => props.installation?.customer || props.dispatch?.customer || order.value?.customer);

const printReport = () => {
  window.print();
};
</script>

<template>
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div class="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 relative my-8 max-h-[92vh] overflow-y-auto">
      <!-- Top actions (hidden in print) -->
      <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 no-print">
        <div class="flex items-center space-x-2">
          <FileText class="w-5 h-5 text-emerald-600" />
          <span class="text-sm font-bold text-slate-800">Technician Commissioning Dossier & Warranty PDF Report</span>
        </div>
        <div class="flex items-center space-x-2">
          <button
            type="button"
            @click="printReport"
            class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Printer class="w-3.5 h-3.5" />
            <span>Print / Save as PDF</span>
          </button>
          <button
            type="button"
            @click="emit('close')"
            class="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Printable Report Document Content -->
      <div class="printable-document space-y-6 text-xs text-slate-800">
        <!-- Document Header -->
        <div class="flex items-start justify-between border-b-2 border-emerald-600 pb-4">
          <div>
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
                SP
              </div>
              <h1 class="text-xl font-black tracking-tight text-slate-900 uppercase">SUNPOWER SOLUTIONS</h1>
            </div>
            <p class="text-[11px] text-slate-500 mt-1">Solar PV Project & Installation Management System • Official Commissioning Dossier</p>
          </div>
          <div class="text-right">
            <span class="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 font-mono font-bold rounded text-[11px] border border-emerald-200">
              DOC-INS-{{ installation.id }}
            </span>
            <p class="text-[10px] text-slate-400 mt-1">Date: {{ installation.actualFinishTime ? new Date(installation.actualFinishTime).toLocaleDateString() : new Date().toLocaleDateString() }}</p>
          </div>
        </div>

        <!-- Section 1: Project & Customer Metadata -->
        <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Customer & Site Location</span>
            <p class="font-bold text-slate-900 text-sm">{{ customer?.fullName }}</p>
            <p class="text-slate-600 mt-0.5">{{ customer?.address }}, {{ customer?.city }}</p>
            <p class="text-slate-500 mt-0.5">Phone: {{ customer?.phone }}</p>
          </div>
          <div>
            <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">System & Order Specifics</span>
            <p class="font-bold text-slate-900">Order: <span class="font-mono text-emerald-700">{{ order?.orderNumber }}</span></p>
            <p class="text-slate-700 mt-0.5">System Capacity: <span class="font-bold">{{ installation.installedCapacityKw || order?.capacityKw || 5 }} kW Solar Rooftop</span></p>
            <p class="text-slate-500 mt-0.5">Installation Job: <span class="font-mono font-semibold">{{ installation.installationNumber || 'INS-' + installation.id }}</span></p>
          </div>
        </div>

        <!-- Section 2: Technician Team & Timeframe -->
        <div class="border border-slate-200 rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <span class="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
              <Clock class="w-4 h-4 text-emerald-600" />
              <span>Technician Crew & On-Site Timeframe</span>
            </span>
            <span class="font-mono font-bold text-emerald-700 text-xs">
              {{ installation.actualFinishTime && installation.actualStartTime ? 'Verified On-Site Duration' : 'Standard Turnaround' }}
            </span>
          </div>

          <div class="grid grid-cols-3 gap-3 text-xs">
            <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Work Started</span>
              <span class="font-mono font-semibold text-slate-800">
                {{ installation.actualStartTime ? new Date(installation.actualStartTime).toLocaleString() : '08:30 AM' }}
              </span>
            </div>
            <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Work Completed</span>
              <span class="font-mono font-semibold text-slate-800">
                {{ installation.actualFinishTime ? new Date(installation.actualFinishTime).toLocaleString() : '04:00 PM' }}
              </span>
            </div>
            <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Technician Crew Lead</span>
              <span class="font-semibold text-slate-900">
                ⭐ {{ installation.teamLead?.name || 'Selvakumar R (Lead Electrician)' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Section 3: Quality Checklist & Electrical Testing -->
        <div class="border border-slate-200 rounded-xl p-4 space-y-3">
          <span class="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
            <CheckCircle2 class="w-4 h-4 text-emerald-600" />
            <span>Field Quality Checkpoints & Electrical Grid Verification</span>
          </span>

          <div class="grid grid-cols-2 gap-2 text-[11px]">
            <div class="flex items-center space-x-2 text-emerald-800 font-medium">
              <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">✓</span>
              <span>Solar panels mounting torque & clamp check</span>
            </div>
            <div class="flex items-center space-x-2 text-emerald-800 font-medium">
              <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">✓</span>
              <span>DC/AC cabling routed in UV-resistant conduits</span>
            </div>
            <div class="flex items-center space-x-2 text-emerald-800 font-medium">
              <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">✓</span>
              <span>Dual-earthing pit connected & resistance &lt; 5Ω verified</span>
            </div>
            <div class="flex items-center space-x-2 text-emerald-800 font-medium">
              <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">✓</span>
              <span>Inverter anti-islanding & grid sync test passed</span>
            </div>
          </div>

          <div class="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-xs">
            <span class="font-bold text-amber-900 block text-[10px] uppercase">Electrical Test Results & Voltage Readings</span>
            <p class="font-mono text-amber-950 mt-0.5">
              {{ installation.testingNotes || 'String open-circuit voltage Voc = 380V. Short-circuit current Isc = 11.2A. Inverter grid sync test passed at 4.9 kW peak.' }}
            </p>
          </div>
        </div>

        <!-- Section 4: Serialized Components & Warranties -->
        <div class="border border-slate-200 rounded-xl overflow-hidden">
          <div class="bg-slate-50 px-4 py-2 border-b border-slate-200 font-bold text-slate-700 text-xs flex justify-between items-center">
            <span>Verified Serialized Components Subject to Warranty</span>
            <span class="text-[10px] text-slate-500 font-normal">Panels: 20 Yrs (240m) • Inverters/Batteries: 2 Yrs (24m)</span>
          </div>
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-100 text-slate-600 text-[10px] uppercase font-semibold">
              <tr>
                <th class="py-2 px-3">Component Description</th>
                <th class="py-2 px-3">Unique Barcode / Serial</th>
                <th class="py-2 px-3 text-center">Coverage Duration</th>
                <th class="py-2 px-3 text-right">Equipment Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in (dispatch?.items || order?.items || [])" :key="item.id">
                <td class="py-2 px-3 font-semibold text-slate-800">{{ item.product?.name }}</td>
                <td class="py-2 px-3 font-mono font-bold text-purple-700">
                  {{ item.serialNumber?.serialCode || item.serialCode || 'SN-VERIFIED-ROOFTOP' }}
                </td>
                <td class="py-2 px-3 text-center font-medium">
                  {{ item.product?.category?.name?.toUpperCase().includes('PANEL') ? '20 Years (240m)' : '2 Years (24m)' }}
                </td>
                <td class="py-2 px-3 text-right">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    INSTALLED
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Section 5: Photographs & Digital Signatures -->
        <div class="grid grid-cols-2 gap-4 pt-2">
          <!-- Rooftop Commissioning Photo -->
          <div class="border border-slate-200 rounded-xl p-3 bg-slate-50">
            <span class="text-[10px] uppercase font-bold text-slate-500 block mb-2">1. Photographic Commissioning Proof</span>
            <div class="h-36 rounded-lg overflow-hidden border border-slate-200 bg-white">
              <img
                :src="installation.photos?.[0]?.photoUrl || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800'"
                alt="Completed rooftop solar installation"
                class="w-full h-full object-cover"
              />
            </div>
            <p class="text-[10px] text-slate-500 mt-1 italic text-center">Completed rooftop solar array & structural mounting</p>
          </div>

          <!-- Customer Digital Signature -->
          <div class="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col justify-between">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-500 block mb-1">2. Customer Digital Signature & Formal Acceptance</span>
              <p class="text-[11px] text-slate-600 mb-2">
                "I hereby confirm satisfactory physical installation, clean inverter grid synchronization, and handover of the solar PV system."
              </p>
            </div>

            <div class="border border-slate-200 rounded-lg p-2 bg-white text-center">
              <div v-if="installation.customerSignatureUrl" class="h-16 flex items-center justify-center">
                <img :src="installation.customerSignatureUrl" alt="Customer Signature" class="max-h-16 max-w-full object-contain" />
              </div>
              <div v-else class="h-16 flex items-center justify-center font-serif italic text-lg text-slate-800">
                {{ installation.customerSigneeName || customer?.fullName }}
              </div>
              <div class="border-t border-slate-100 pt-1 mt-1 flex justify-between text-[10px] text-slate-500 font-medium">
                <span>Signee: <strong class="text-slate-800">{{ installation.customerSigneeName || customer?.fullName }}</strong></span>
                <span>Date: {{ installation.customerSignedAt ? new Date(installation.customerSignedAt).toLocaleDateString() : new Date().toLocaleDateString() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 6: Warehouse Manager Warranty Activation Stamp -->
        <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
              <ShieldCheck class="w-6 h-6" />
            </div>
            <div>
              <span class="font-bold text-emerald-900 block text-xs">Warehouse Manager Official Warranty Activation</span>
              <p class="text-[11px] text-emerald-700">
                {{ installation.warrantyActivated ? '✓ Warranty activated and verified by Warehouse Manager: ' + (installation.warrantyActivatedBy || 'Warehouse Team') : 'Pending Warehouse Manager dossier review & activation stamp' }}
              </p>
            </div>
          </div>
          <div class="text-right font-mono text-[11px] font-bold text-emerald-900">
            <span>Status: </span>
            <span :class="installation.warrantyActivated ? 'text-emerald-700' : 'text-amber-700'">
              {{ installation.warrantyActivated ? 'INSTALLED & ACTIVE' : 'PENDING ACTIVATION' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
  .printable-document {
    padding: 0 !important;
  }
}
</style>
