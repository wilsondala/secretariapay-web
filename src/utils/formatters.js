export const INSTITUTION_ID = 'c3726494-46b5-4563-8e84-0a04334fac8c';

export function formatMoney(value, currency = 'AOA') {
  const numeric = Number(value || 0);
  try {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(numeric).replace('AOA', 'Kz');
  } catch {
    return `${numeric.toLocaleString('pt-AO')} ${currency || 'AOA'}`;
  }
}

export function formatDate(value) {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-AO').format(date);
}

export function safeText(value, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

export function normalizeText(value) {
  return safeText(value, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getStudentName(student) {
  return student?.fullName || student?.full_name || student?.name || '-';
}

export function getStudentNumber(student) {
  return student?.studentNumber || student?.student_number || student?.registrationNumber || '-';
}

export function getStudentCourse(student) {
  return student?.courseName || student?.course?.name || student?.academicClass?.course?.name || student?.classCourseName || '-';
}

export function getStudentClass(student) {
  return student?.className || student?.academicClassName || student?.academicClass?.name || '-';
}

export function getStudentPhone(student) {
  return student?.phone || student?.whatsapp || student?.guardianPhone || student?.guardian_phone || '';
}

export function getStudentWhatsapp(student) {
  return student?.whatsapp || '';
}

export function getStudentEmail(student) {
  return student?.email || student?.guardianEmail || student?.guardian_email || '';
}

export function getStudentStatus(student) {
  return student?.status || student?.studentStatus || 'ACTIVE';
}

export function isStudentBlocked(student) {
  return Boolean(student?.financiallyBlocked || student?.financially_blocked || student?.blocked);
}

export function normalizeChargeStatus(status) {
  const value = safeText(status, 'PENDING').toUpperCase();
  const map = {
    PENDING: 'Pendente',
    PAID: 'Pago',
    OVERDUE: 'Vencido',
    CANCELLED: 'Cancelado',
    CANCELED: 'Cancelado',
    TICKET_ISSUED: 'Emitido',
  };
  return map[value] || value;
}

export function chargeIsOpen(charge) {
  const status = safeText(charge?.status, '').toUpperCase();
  return status !== 'PAID' && status !== 'CANCELLED' && status !== 'CANCELED';
}

export function chargeIsOverdue(charge) {
  const status = safeText(charge?.status, '').toUpperCase();
  if (status === 'OVERDUE') return true;
  if (!chargeIsOpen(charge)) return false;
  const due = charge?.dueDate || charge?.due_date;
  if (!due) return false;
  return new Date(`${due}T23:59:59`).getTime() < Date.now();
}

export function normalizeCharge(charge) {
  const student = charge?.student || {};
  return {
    ...charge,
    id: charge?.id,
    chargeCode: charge?.chargeCode || charge?.charge_code || charge?.code || '-',
    description: charge?.description || '-',
    referenceMonth: charge?.referenceMonth || charge?.reference_month || '-',
    dueDate: charge?.dueDate || charge?.due_date || null,
    amount: Number(charge?.amount || charge?.baseAmount || charge?.base_amount || 0),
    fineAmount: Number(charge?.fineAmount || charge?.fine_amount || 0),
    totalAmount: Number(charge?.totalAmount || charge?.total_amount || charge?.amount || 0),
    currency: charge?.currency || 'AOA',
    status: charge?.status || 'PENDING',
    student,
    studentName: getStudentName(student),
    studentNumber: getStudentNumber(student),
  };
}
