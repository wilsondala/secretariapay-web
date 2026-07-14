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
    ACTIVE: 'Ativo',
    PENDING: 'Pendente',
    PREPARED: 'Preparado',
    PARTIALLY_PAID: 'Parcialmente pago',
    PAID: 'Pago',
    OVERDUE: 'Vencido',
    SENT: 'Enviado',
    FAILED: 'Falhou',
    CANCELLED: 'Cancelado',
    CANCELED: 'Cancelado',
    RENEGOTIATED: 'Renegociado',
    TICKET_ISSUED: 'Emitido',
  };
  return map[value] || value;
}

export function chargeIsOpen(charge) {
  const status = safeText(charge?.status, '').toUpperCase();
  return !['PAID', 'CANCELLED', 'CANCELED', 'RENEGOTIATED'].includes(status);
}

export function chargeIsOverdue(charge) {
  const status = safeText(charge?.status, '').toUpperCase();
  if (status === 'OVERDUE') return true;
  if (!chargeIsOpen(charge)) return false;
  const due = charge?.dueDate || charge?.due_date;
  if (!due) return false;
  return new Date(`${due}T23:59:59`).getTime() < Date.now();
}

export function inferChargeCategory(charge) {
  const explicit = safeText(charge?.chargeCategory || charge?.charge_category, '').toUpperCase();
  if (['TUITION', 'ACADEMIC_SERVICE', 'OTHER'].includes(explicit)) return explicit;
  const text = normalizeText([
    charge?.serviceCode,
    charge?.service_code,
    charge?.description,
    charge?.referenceMonth,
    charge?.reference_month,
    charge?.chargeCode,
    charge?.charge_code,
  ].join(' '));
  if (text.includes('propina') || text.includes('tuition')) return 'TUITION';
  if (/(matricula|inscricao|recurso|exame especial|declaracao|certificado|diploma)/.test(text)) return 'ACADEMIC_SERVICE';
  return 'OTHER';
}

export function inferServiceCode(charge) {
  const explicit = safeText(charge?.serviceCode || charge?.service_code, '').toUpperCase();
  if (explicit) return explicit;
  const text = normalizeText([
    charge?.description,
    charge?.referenceMonth,
    charge?.reference_month,
    charge?.chargeCode,
    charge?.charge_code,
  ].join(' '));
  if (text.includes('propina')) return 'TUITION';
  if ((text.includes('confirmacao') || text.includes('confirmar')) && text.includes('matricula')) return 'ENROLLMENT_CONFIRMATION';
  if (text.includes('matricula')) return 'ENROLLMENT';
  if (text.includes('inscricao')) return 'REGISTRATION';
  if (text.includes('recurso')) return 'RESIT_EXAM';
  if (text.includes('exame especial')) return 'SPECIAL_EXAM';
  if (text.includes('declaracao') && text.includes('com nota')) return 'DECLARATION_WITH_GRADES';
  if (text.includes('declaracao')) return 'DECLARATION_WITHOUT_GRADES';
  if (text.includes('certificado')) return 'CERTIFICATE';
  if (text.includes('diploma')) return 'DIPLOMA';
  return 'OTHER';
}

export function chargeCategoryLabel(category) {
  const value = safeText(category, 'OTHER').toUpperCase();
  return {
    TUITION: 'Propina',
    ACADEMIC_SERVICE: 'Serviço académico',
    OTHER: 'Outro lançamento',
  }[value] || value;
}

export function academicServiceLabel(serviceCode, fallback = 'Serviço académico') {
  const value = safeText(serviceCode, 'OTHER').toUpperCase();
  return {
    ENROLLMENT: 'Matrícula',
    ENROLLMENT_CONFIRMATION: 'Confirmação de matrícula',
    REGISTRATION: 'Inscrição',
    RESIT_EXAM: 'Exame de recurso',
    SPECIAL_EXAM: 'Exame especial',
    DECLARATION_WITH_GRADES: 'Declaração com notas',
    DECLARATION_WITHOUT_GRADES: 'Declaração sem notas',
    CERTIFICATE: 'Certificado',
    DIPLOMA: 'Diploma',
    TUITION: 'Propina',
  }[value] || fallback;
}

export function isTuitionCharge(charge) {
  return inferChargeCategory(charge) === 'TUITION';
}

export function isAcademicServiceCharge(charge) {
  return inferChargeCategory(charge) === 'ACADEMIC_SERVICE';
}

export function normalizeCharge(charge) {
  const student = charge?.student || {};
  const topLevelStudentName = charge?.studentName || charge?.student_name || charge?.fullName || charge?.full_name;
  const topLevelStudentNumber = charge?.studentNumber || charge?.student_number || charge?.registrationNumber || charge?.registration_number;
  const amount = Number(charge?.amount || charge?.baseAmount || charge?.base_amount || 0);
  const fineAmount = Number(charge?.fineAmount || charge?.fine_amount || 0);
  const interestAmount = Number(charge?.interestAmount || charge?.interest_amount || 0);
  const discountAmount = Number(charge?.discountAmount || charge?.discount_amount || 0);
  const totalAmount = Number(charge?.totalAmount || charge?.total_amount || amount + fineAmount + interestAmount - discountAmount || 0);
  const chargeCategory = inferChargeCategory(charge);
  const serviceCode = inferServiceCode(charge);

  return {
    ...charge,
    id: charge?.id,
    chargeCode: charge?.chargeCode || charge?.charge_code || charge?.code || '-',
    description: charge?.description || '-',
    referenceMonth: charge?.referenceMonth || charge?.reference_month || '-',
    chargeCategory,
    serviceCode,
    dueDate: charge?.dueDate || charge?.due_date || null,
    amount,
    fineAmount,
    interestAmount,
    discountAmount,
    totalAmount,
    currency: charge?.currency || 'AOA',
    status: charge?.status || 'PENDING',
    paidAt: charge?.paidAt || charge?.paid_at || null,
    cancelledAt: charge?.cancelledAt || charge?.cancelled_at || null,
    createdAt: charge?.createdAt || charge?.created_at || null,
    updatedAt: charge?.updatedAt || charge?.updated_at || null,
    student,
    studentName: topLevelStudentName || getStudentName(student),
    studentNumber: topLevelStudentNumber || getStudentNumber(student),
  };
}

export function normalizeProofStatus(status) {
  const value = safeText(status, 'PENDING_REVIEW').toUpperCase();
  const map = {
    PENDING: 'Pendente',
    PENDING_REVIEW: 'Pendente DCR',
    UNDER_REVIEW: 'Em análise',
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
    VALIDATED: 'Validado',
    PAID: 'Pago',
  };
  return map[value] || value;
}

export function normalizeReceiptStatus(status) {
  const value = safeText(status, 'ISSUED').toUpperCase();
  const map = {
    VALID: 'Válido',
    ISSUED: 'Emitido',
    ACTIVE: 'Ativo',
    CANCELLED: 'Cancelado',
    CANCELED: 'Cancelado',
    SENT: 'Enviado',
  };
  return map[value] || value;
}

export function normalizeDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('pt-AO', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function normalizePaymentProof(proof) {
  const charge = proof?.charge || {};
  const student = proof?.student || charge?.student || {};
  const chargeSource = { ...charge, ...proof };
  const chargeCategory = inferChargeCategory(chargeSource);
  const serviceCode = inferServiceCode(chargeSource);
  return {
    ...proof,
    id: proof?.id,
    proofCode: proof?.proofCode || proof?.proof_code || proof?.code || proof?.id || '-',
    chargeId: proof?.chargeId || proof?.charge_id || charge?.id,
    chargeCode: proof?.chargeCode || proof?.charge_code || charge?.chargeCode || charge?.charge_code || '-',
    chargeCategory,
    serviceCode,
    categoryLabel: chargeCategoryLabel(chargeCategory),
    chargeDescription: proof?.chargeDescription || proof?.charge_description || charge?.description || academicServiceLabel(serviceCode),
    referenceMonth: proof?.referenceMonth || proof?.reference_month || charge?.referenceMonth || charge?.reference_month || '-',
    receiptId: proof?.receiptId || proof?.receipt_id,
    receiptCode: proof?.receiptCode || proof?.receipt_code,
    status: proof?.status || 'PENDING_REVIEW',
    amount: Number(proof?.amount || proof?.paidAmount || proof?.paid_amount || charge?.totalAmount || charge?.total_amount || 0),
    currency: proof?.currency || charge?.currency || 'AOA',
    paymentMethod: proof?.paymentMethod || proof?.payment_method || proof?.method || '-',
    bankName: proof?.bankName || proof?.bank_name || proof?.bank || '-',
    transactionReference: proof?.transactionReference || proof?.transaction_reference || proof?.reference || proof?.externalReference || '-',
    fileUrl: proof?.fileUrl || proof?.file_url || proof?.attachmentUrl || proof?.attachment_url || proof?.documentUrl,
    fileName: proof?.fileName || proof?.file_name || proof?.attachmentName || 'Comprovativo',
    createdAt: proof?.createdAt || proof?.created_at || proof?.submittedAt || proof?.submitted_at,
    validatedAt: proof?.validatedAt || proof?.validated_at,
    validationNotes: proof?.validationNotes || proof?.validation_notes || proof?.reviewNote || proof?.review_note || proof?.notes || '',
    student,
    studentName: proof?.studentName || proof?.student_name || getStudentName(student),
    studentNumber: proof?.studentNumber || proof?.student_number || getStudentNumber(student),
  };
}

export function normalizeReceipt(receipt) {
  const charge = receipt?.charge || {};
  const student = receipt?.student || charge?.student || {};
  const chargeSource = { ...charge, ...receipt };
  const chargeCategory = inferChargeCategory(chargeSource);
  const serviceCode = inferServiceCode(chargeSource);
  return {
    ...receipt,
    id: receipt?.id,
    receiptCode: receipt?.receiptCode || receipt?.receipt_code || receipt?.code || '-',
    chargeCode: receipt?.chargeCode || receipt?.charge_code || charge?.chargeCode || charge?.charge_code || '-',
    chargeCategory,
    serviceCode,
    categoryLabel: chargeCategoryLabel(chargeCategory),
    chargeDescription: receipt?.chargeDescription || receipt?.charge_description || charge?.description || academicServiceLabel(serviceCode),
    referenceMonth: receipt?.referenceMonth || receipt?.reference_month || charge?.referenceMonth || charge?.reference_month || '-',
    status: receipt?.status || 'ISSUED',
    amount: Number(receipt?.amount || receipt?.totalAmount || receipt?.total_amount || charge?.totalAmount || charge?.total_amount || 0),
    currency: receipt?.currency || charge?.currency || 'AOA',
    paymentMethod: receipt?.paymentMethod || receipt?.payment_method || receipt?.method || '-',
    issuedAt: receipt?.issuedAt || receipt?.issued_at || receipt?.createdAt || receipt?.created_at,
    student,
    studentName: receipt?.studentName || receipt?.student_name || getStudentName(student),
    studentNumber: receipt?.studentNumber || receipt?.student_number || getStudentNumber(student),
  };
}
