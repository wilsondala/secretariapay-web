export const ROLES = {
  ADMIN_GLOBAL: 'ADMIN_GLOBAL',
  ADMIN_INSTITUTION: 'ADMIN_INSTITUTION',
  ADMIN_IMETRO: 'ADMIN_IMETRO',
  DIRECAO: 'DIRECAO',
  FINANCEIRO: 'FINANCEIRO',
  TESOURARIA: 'TESOURARIA',
  SECRETARIA: 'SECRETARIA',
  OPERADOR_ATENDIMENTO: 'OPERADOR_ATENDIMENTO',
  DCR_COORDENACAO: 'DCR_COORDENACAO',
  DCR_OPERADOR: 'DCR_OPERADOR',
  TIC: 'TIC',
  AUDITORIA: 'AUDITORIA',
  ADMIN: 'ADMIN',
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  OPERATOR: 'OPERATOR',
};

const ALL = Object.values(ROLES);
const ADMINS = [ROLES.ADMIN_GLOBAL, ROLES.ADMIN_INSTITUTION, ROLES.ADMIN_IMETRO, ROLES.ADMIN, ROLES.COMPANY_ADMIN];
const MANAGEMENT = [...ADMINS, ROLES.DIRECAO, ROLES.TIC];
const DCR = [ROLES.DCR_COORDENACAO, ROLES.DCR_OPERADOR];
const FINANCE_CORE = [...MANAGEMENT, ROLES.FINANCEIRO, ROLES.TESOURARIA];
const FINANCE_READ = [...FINANCE_CORE, ...DCR];
const ACADEMIC = [...MANAGEMENT, ROLES.SECRETARIA];
const READ_ONLY = [ROLES.AUDITORIA];
const DCR_SERVICE_ORDERS = [...ADMINS, ...DCR];
const SECRETARIA_SERVICE_ORDERS = [...ADMINS, ROLES.SECRETARIA];
const DIRECAO_SERVICE_ORDERS = [...ADMINS, ROLES.DIRECAO];
const WHATSAPP_OPERATIONS = [...MANAGEMENT, ROLES.FINANCEIRO, ROLES.TESOURARIA, ROLES.OPERADOR_ATENDIMENTO];
const INSTITUTIONAL_OPERATIONS = [...MANAGEMENT, ROLES.FINANCEIRO];
const EXECUTIVE_REPORTING = [...MANAGEMENT, ROLES.FINANCEIRO, ROLES.TESOURARIA, ...READ_ONLY];

export const ROUTE_ROLES = {
  '/dashboard': ALL,
  '/students': [...FINANCE_READ, ...ACADEMIC, ROLES.OPERADOR_ATENDIMENTO, ...READ_ONLY],
  '/charges': [...FINANCE_READ, ROLES.OPERADOR_ATENDIMENTO, ...READ_ONLY],
  '/proofs': [...FINANCE_READ, ...READ_ONLY],
  '/receipts': [...FINANCE_READ, ROLES.OPERADOR_ATENDIMENTO, ...READ_ONLY],
  '/academic-services': [...FINANCE_READ, ROLES.SECRETARIA, ROLES.OPERADOR_ATENDIMENTO, ...READ_ONLY],
  '/academic-service-orders': [...DCR_SERVICE_ORDERS, ...SECRETARIA_SERVICE_ORDERS, ...DIRECAO_SERVICE_ORDERS, ...READ_ONLY],
  '/academic-documents': [...ACADEMIC, ...READ_ONLY],
  '/academic-catalog': [...ACADEMIC, ...READ_ONLY],
  '/whatsapp': WHATSAPP_OPERATIONS,
  '/operations': INSTITUTIONAL_OPERATIONS,
  '/imports': [...ACADEMIC, ROLES.TIC],
  '/reports': EXECUTIVE_REPORTING,
  '/admin-users': MANAGEMENT,
  '/settings': MANAGEMENT,
};

export const ACTION_ROLES = {
  manageUsers: MANAGEMENT,
  manageSettings: MANAGEMENT,
  manageAcademicCatalog: ACADEMIC,
  manageAcademicServices: [...ADMINS, ROLES.DIRECAO, ROLES.FINANCEIRO, ROLES.TESOURARIA, ROLES.DCR_COORDENACAO, ROLES.TIC],
  createAcademicServiceOrders: DCR_SERVICE_ORDERS,
  processAcademicServiceOrders: SECRETARIA_SERVICE_ORDERS,
  signAcademicServiceOrders: DIRECAO_SERVICE_ORDERS,
  prepareAcademicDocuments: [...ADMINS, ROLES.DIRECAO, ROLES.SECRETARIA, ROLES.TIC],
  signAcademicDocuments: [...ADMINS, ROLES.DIRECAO],
  sendAcademicDocuments: [...ADMINS, ROLES.DIRECAO, ROLES.SECRETARIA, ROLES.TIC],
  importAcademicData: [...ACADEMIC, ROLES.TIC],
  manageCharges: FINANCE_READ,
  generateMonthlyCharges: [...ADMINS, ROLES.DIRECAO, ROLES.FINANCEIRO, ROLES.DCR_COORDENACAO],
  validateProofs: [...MANAGEMENT, ROLES.FINANCEIRO, ROLES.TESOURARIA, ...DCR],
  issueReceipts: [...MANAGEMENT, ROLES.FINANCEIRO, ROLES.TESOURARIA, ...DCR],
  resendReceipts: [...ADMINS, ROLES.FINANCEIRO, ROLES.TESOURARIA, ROLES.DCR_COORDENACAO],
  cancelReceipts: [...ADMINS, ROLES.DIRECAO, ROLES.TESOURARIA, ROLES.DCR_COORDENACAO],
  runOperations: INSTITUTIONAL_OPERATIONS,
  runFinancialNotifications: [...ADMINS, ROLES.DIRECAO, ROLES.FINANCEIRO],
  sendWhatsapp: [...WHATSAPP_OPERATIONS, ...DCR],
  resendWhatsapp: [...ADMINS, ROLES.FINANCEIRO, ROLES.TESOURARIA, ...DCR, ROLES.OPERADOR_ATENDIMENTO],
  manageWhatsappTemplates: [...ADMINS, ROLES.DIRECAO, ROLES.FINANCEIRO, ROLES.TIC],
  manageWhatsappScheduler: [...ADMINS, ROLES.DIRECAO, ROLES.FINANCEIRO, ROLES.TIC],
};

export function normalizeRole(role) {
  return String(role || '').replace(/^ROLE_/, '').trim().toUpperCase();
}

export function hasAnyRole(user, allowedRoles = []) {
  const role = normalizeRole(user?.role);
  return Boolean(role) && allowedRoles.map(normalizeRole).includes(role);
}

export function canAccessRoute(user, path) {
  const allowed = ROUTE_ROLES[path];
  return !allowed || hasAnyRole(user, allowed);
}

export function can(user, action) {
  const allowed = ACTION_ROLES[action];
  return Boolean(allowed) && hasAnyRole(user, allowed);
}

export function getDefaultRoute(user) {
  const preferred = ['/dashboard', '/students', '/charges', '/academic-services', '/proofs', '/receipts', '/academic-service-orders', '/academic-documents', '/academic-catalog', '/whatsapp', '/reports'];
  return preferred.find((path) => canAccessRoute(user, path)) || '/login';
}
