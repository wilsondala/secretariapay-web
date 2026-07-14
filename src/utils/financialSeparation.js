import {
  chargeIsOpen,
  chargeIsOverdue,
  getStudentNumber,
  isAcademicServiceCharge,
  isTuitionCharge,
  normalizeText,
} from './formatters.js';

export function sumCharges(items = []) {
  return items.reduce((total, item) => total + Number(item?.totalAmount || 0), 0);
}

export function summarizeCategory(charges = []) {
  const paid = charges.filter((charge) => String(charge.status).toUpperCase() === 'PAID');
  const open = charges.filter(chargeIsOpen);
  return {
    totalCount: charges.length,
    paidCount: paid.length,
    openCount: open.length,
    overdueCount: open.filter(chargeIsOverdue).length,
    paidAmount: sumCharges(paid),
    openAmount: sumCharges(open),
  };
}

export function buildSeparatedSummary(charges = []) {
  const active = charges.filter((charge) => !['CANCELLED', 'CANCELED', 'RENEGOTIATED'].includes(String(charge.status).toUpperCase()));
  const tuition = summarizeCategory(active.filter(isTuitionCharge));
  const services = summarizeCategory(active.filter(isAcademicServiceCharge));
  return {
    tuition,
    services,
    totalOpen: tuition.openAmount + services.openAmount,
    totalPaid: tuition.paidAmount + services.paidAmount,
    totalCount: tuition.totalCount + services.totalCount,
    overdueCount: tuition.overdueCount + services.overdueCount,
  };
}

export function matchesStudentNumber(value, student) {
  return normalizeText(value) === normalizeText(getStudentNumber(student));
}

export function chargeMatchesStudent(charge, student) {
  if (!charge || !student) return false;
  const chargeStudentId = charge.student?.id || charge.studentId || charge.student_id;
  if (chargeStudentId && student.id && String(chargeStudentId) === String(student.id)) return true;
  return matchesStudentNumber(charge.studentNumber || charge.student?.studentNumber, student);
}

export function mergeStudentCharges(current, replacement, student) {
  return [
    ...current.filter((charge) => !chargeMatchesStudent(charge, student)),
    ...replacement,
  ];
}
