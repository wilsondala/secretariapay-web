import { listCharges } from './chargesService.js';
import { listStudents } from './studentsService.js';
import { chargeIsOpen, chargeIsOverdue, getStudentEmail, getStudentPhone, getStudentWhatsapp, isStudentBlocked, normalizeCharge } from '../utils/formatters.js';

export async function loadDashboardSummary() {
  const [students, rawCharges] = await Promise.all([listStudents(), listCharges()]);
  const charges = rawCharges.map(normalizeCharge);

  const openCharges = charges.filter(chargeIsOpen);
  const overdueCharges = charges.filter(chargeIsOverdue);
  const pendingCharges = charges.filter((charge) => String(charge.status).toUpperCase() === 'PENDING');
  const noContactStudents = students.filter((student) => !getStudentWhatsapp(student) && !getStudentPhone(student) && !getStudentEmail(student));
  const blockedStudents = students.filter(isStudentBlocked);

  return {
    studentsTotal: students.length,
    chargesTotal: charges.length,
    pendingCharges: pendingCharges.length,
    overdueCharges: overdueCharges.length,
    openAmount: openCharges.reduce((sum, charge) => sum + Number(charge.totalAmount || 0), 0),
    overdueAmount: overdueCharges.reduce((sum, charge) => sum + Number(charge.totalAmount || 0), 0),
    noContactStudents: noContactStudents.length,
    blockedStudents: blockedStudents.length,
    students,
    charges,
  };
}
