import React from 'react';

interface BadgeProps {
  status: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status }) => {
  const getStyle = (s: string) => {
    switch (s) {
      case 'APPROVED':
      case 'COMPLETED':
      case 'ACCEPTED':
      case 'CONFIRMED':
      case 'DELIVERED':
      case 'ACTIVE':
      case 'SUCCESS':
      case 'PAID':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'IN_PROGRESS':
      case 'IN_INSTALLATION':
      case 'DISPATCHED':
      case 'SCHEDULED':
      case 'ASSIGNED':
      case 'SUBMITTED':
      case 'PARTIALLY_PAID':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PENDING':
      case 'PENDING_PAYMENT':
      case 'DRAFT':
      case 'PICKING':
      case 'NEW':
      case 'DOCUMENTS_PENDING':
      case 'OPEN':
      case 'WAITING_FOR_PARTS':
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
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ');
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyle(status)}`}>
      {formatText(status)}
    </span>
  );
};

export const Badge = StatusBadge;
export default StatusBadge;

