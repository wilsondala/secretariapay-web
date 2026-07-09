import { listCharges } from './chargesService.js';
import { listStudents } from './studentsService.js';
import { listPaymentProofs } from './proofsService.js';
import { chargeIsOpen, chargeIsOverdue, getStudentEmail, getStudentPhone, getStudentWhatsapp, isStudentBlocked, normalizeCharge } from '../utils/formatters.js';

function proofIsPending(proof) {
  const status = String(proof?.status || 'PENDING_REVIEW').toUpperCase();
  return status === 'PENDING' || status === 'PENDING_REVIEW' || status === 'UNDER_REVIEW';
}

export async function loadDashboardSummary() {
  const [students, rawCharges, proofResult] = await Promise.all([
    listStudents(),
    listCharges(),
    listPaymentProofs().catch(() => []),
  ]);

  const charges = rawCharges.map(normalizeCharge);
  const proofs = Array.isArray(proofResult) ? proofResult : [];

  const openCharges = charges.filter(chargeIsOpen);
  const overdueCharges = charges.filter(chargeIsOverdue);
  const pendingCharges = charges.filter((charge) => String(charge.status).toUpperCase() === 'PENDING');
  const pendingProofs = proofs.filter(proofIsPending);
  const noContactStudents = students.filter((student) => !getStudentWhatsapp(student) && !getStudentPhone(student) && !getStudentEmail(student));
  const blockedStudents = students.filter(isStudentBlocked);

  return {
    studentsTotal: students.length,
    chargesTotal: charges.length,
    pendingCharges: pendingCharges.length,
    overdueCharges: overdueCharges.length,
    pendingProofs: pendingProofs.length,
    openAmount: openCharges.reduce((sum, charge) => sum + Number(charge.totalAmount || 0), 0),
    overdueAmount: overdueCharges.reduce((sum, charge) => sum + Number(charge.totalAmount || 0), 0),
    noContactStudents: noContactStudents.length,
    blockedStudents: blockedStudents.length,
    students,
    charges,
    proofs,
  };
}
