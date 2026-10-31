<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: string;
}>();

const styleClass = computed(() => {
  switch (props.status) {
    case 'APPROVED':
    case 'COMPLETED':
    case 'ACCEPTED':
    case 'CONFIRMED':
    case 'DELIVERED':
    case 'ACTIVE':
    case 'SUCCESS':
    case 'PAID':
    case 'INSTALLED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'IN_PROGRESS':
    case 'IN_INSTALLATION':
    case 'DISPATCHED':
    case 'SCHEDULED':
    case 'ASSIGNED':
    case 'SUBMITTED':
    case 'PARTIALLY_PAID':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'SITE_RECEIVED':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'REPORT_SUBMITTED':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'PENDING':
    case 'PENDING_PAYMENT':
    case 'DRAFT':
    case 'PICKING':
    case 'NEW':
    case 'DOCUMENTS_PENDING':
    case 'OPEN':
    case 'WAITING_FOR_PARTS':
    case 'REVISIT_REQUIRED':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'RESOLVED':
    case 'CUSTOMER_CONFIRMED':
      return 'bg-teal-100 text-teal-800 border-teal-300';
    case 'REJECTED':
    case 'CANCELLED':
    case 'EXPIRED':
    case 'VOIDED':
    case 'FAILED':
    case 'DEFECTIVE':
      return 'bg-rose-100 text-rose-800 border-rose-300';
    case 'NOT_STARTED':
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300';
  }
});

const formattedText = computed(() => {
  return (props.status || '').replace(/_/g, ' ');
});
</script>

<template>
  <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border', styleClass]">
    {{ formattedText }}
  </span>
</template>
