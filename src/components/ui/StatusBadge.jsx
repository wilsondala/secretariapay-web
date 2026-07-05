import { normalizeChargeStatus, safeText } from '../../utils/formatters.js';

const styles = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-100',
  OVERDUE: 'bg-red-50 text-red-700 ring-red-100',
  PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-200',
  CANCELED: 'bg-slate-100 text-slate-600 ring-slate-200',
  BLOCKED: 'bg-red-50 text-red-700 ring-red-100',
  SENT: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  FAILED: 'bg-red-50 text-red-700 ring-red-100',
  PENDING_REVIEW: 'bg-amber-50 text-amber-700 ring-amber-100',
  UNDER_REVIEW: 'bg-sky-50 text-sky-700 ring-sky-100',
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  VALIDATED: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  REJECTED: 'bg-red-50 text-red-700 ring-red-100',
  ISSUED: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
};

export default function StatusBadge({ status, label }) {
  const key = safeText(status, '').toUpperCase();
  const className = styles[key] || 'bg-slate-50 text-slate-700 ring-slate-100';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${className}`}>
      {label || normalizeChargeStatus(status)}
    </span>
  );
}
