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
const FINANCE = [...MANAGEMENT, ROLES.FINANCEIRO, ROLES.TESOURARIA, ROLES.DCR_COORDENACAO, ROLES.DCR_OPERADOR];
const ACADEMIC = [...MANAGEMENT, ROLES.SECRETARIA, ROLES.DCR_COORDENACAO];
const READ_ONLY = [ROLES.AUDITORIA];
const DCR_SERVICE_ORDERS = [...ADMINS, ROLES.DCR_COORDENACAO, ROLES.DCR_OPERADOR];
const SECRETARIA_SERVICE_ORDERS = [...ADMINS, ROLES.SECRETARIA];
const DIRECAO_SERVICE_ORDERS = [...ADMINS, ROLES.DIRECAO];

export const ROUTE_ROLES = {
  '/dashboard': ALL,
  '/students': [...FINANCE, ...ACADEMIC, ROLES.OPERADOR_ATENDIMENTO, ...READ_ONLY],
  '/charges': [...FINANCE, ROLES.OPERADOR_ATENDIMENTO, ...READ_ONLY],
  '/proofs': [...FINANCE, ...READ_ONLY],
  '/receipts': [...FINANCE, ROLES.OPERADOR_ATENDIMENTO, ...READ_ONLY],
  '/academic-services': [...FINANCE, ROLES.SECRETARIA, ROLES.OPERADOR_ATENDIMENTO, ...READ_ONLY],
  '/academic-service-orders': [...DCR_SERVICE_ORDERS, ...SECRETARIA_SERVICE_ORDERS, ...DIRECAO_SERVICE_ORDERS, ...READ_ONLY],
  '/academic-documents': [...ACADEMIC, ...READ_ONLY],
  '/academic-catalog': [...ACADEMIC, ...READ_ONLY],
  '/whatsapp': [...FINANCE, ROLES.OPERADOR_ATENDIMENTO, ...READ_ONLY],
  '/operations': [...MANAGEMENT, ROLES.DCR_COORDENACAO, ROLES.DCR_OPERADOR, ROLES.FINANCEIRO],
  '/imports': [...ACADEMIC, ROLES.TIC],
  '/reports': [...MANAGEMENT, ROLES.FINANCEIRO, ROLES.TESOURARIA, ROLES.DCR_COORDENACAO, ROLES.AUDITORIA],
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
  prepareAcademicDocuments: [...ADMINS, ROLES.DIRECAO, ROLES.SECRETARIA, ROLES.DCR_COORDENACAO, ROLES.TIC],
  signAcademicDocuments: [...ADMINS, ROLES.DIRECAO],
  sendAcademicDocuments: [...ADMINS, ROLES.DIRECAO, ROLES.SECRETARIA, ROLES.DCR_COORDENACAO, ROLES.TIC],
  importAcademicData: [...ACADEMIC, ROLES.TIC],
  manageCharges: FINANCE,
  generateMonthlyCharges: [...ADMINS, ROLES.DIRECAO, ROLES.FINANCEIRO, ROLES.DCR_COORDENACAO],
  validateProofs: [...MANAGEMENT, ROLES.FINANCEIRO, ROLES.TESOURARIA, ROLES.DCR_COORDENACAO, ROLES.DCR_OPERADOR],
  issueReceipts: [...MANAGEMENT, ROLES.FINANCEIRO, ROLES.TESOURARIA, ROLES.DCR_COORDENACAO, ROLES.DCR_OPERADOR],
  resendReceipts: [...ADMINS, ROLES.FINANCEIRO, ROLES.TESOURARIA, ROLES.DCR_COORDENACAO],
  cancelReceipts: [...ADMINS, ROLES.DIRECAO, ROLES.TESOURARIA, ROLES.DCR_COORDENACAO],
  runOperations: [...MANAGEMENT, ROLES.DCR_COORDENACAO, ROLES.DCR_OPERADOR, ROLES.FINANCEIRO],
  runFinancialNotifications: [...ADMINS, ROLES.DIRECAO, ROLES.FINANCEIRO, ROLES.DCR_COORDENACAO],
  sendWhatsapp: [...FINANCE, ROLES.OPERADOR_ATENDIMENTO],
  resendWhatsapp: [...ADMINS, ROLES.FINANCEIRO, ROLES.DCR_COORDENACAO, ROLES.DCR_OPERADOR, ROLES.OPERADOR_ATENDIMENTO],
  manageWhatsappTemplates: [...ADMINS, ROLES.DIRECAO, ROLES.FINANCEIRO, ROLES.DCR_COORDENACAO, ROLES.TIC],
  manageWhatsappScheduler: [...ADMINS, ROLES.DIRECAO, ROLES.FINANCEIRO, ROLES.DCR_COORDENACAO, ROLES.TIC],
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
  const preferred = ['/dashboard', '/students', '/charges', '/academic-services', '/academic-service-orders', '/academic-documents', '/academic-catalog', '/whatsapp', '/reports'];
  return preferred.find((path) => canAccessRoute(user, path)) || '/login';
}
