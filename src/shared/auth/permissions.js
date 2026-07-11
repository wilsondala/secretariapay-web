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

export const ROUTE_ROLES = {
  '/dashboard': ALL,
  '/students': [...FINANCE, ...ACADEMIC, ROLES.OPERADOR_ATENDIMENTO, ...READ_ONLY],
  '/charges': [...FINANCE, ROLES.OPERADOR_ATENDIMENTO, ...READ_ONLY],
  '/proofs': [...FINANCE, ...READ_ONLY],
  '/receipts': [...FINANCE, ROLES.OPERADOR_ATENDIMENTO, ...READ_ONLY],
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
  importAcademicData: [...ACADEMIC, ROLES.TIC],
  manageCharges: FINANCE,
  validateProofs: [...MANAGEMENT, ROLES.FINANCEIRO, ROLES.TESOURARIA, ROLES.DCR_COORDENACAO, ROLES.DCR_OPERADOR],
  issueReceipts: [...MANAGEMENT, ROLES.FINANCEIRO, ROLES.TESOURARIA, ROLES.DCR_COORDENACAO, ROLES.DCR_OPERADOR],
  runOperations: [...MANAGEMENT, ROLES.DCR_COORDENACAO, ROLES.DCR_OPERADOR, ROLES.FINANCEIRO],
  sendWhatsapp: [...FINANCE, ROLES.OPERADOR_ATENDIMENTO],
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
  const preferred = ['/dashboard', '/students', '/charges', '/academic-catalog', '/whatsapp', '/reports'];
  return preferred.find((path) => canAccessRoute(user, path)) || '/login';
}
