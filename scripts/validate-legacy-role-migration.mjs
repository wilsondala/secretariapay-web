import {
  canAccessRoute,
  getDefaultRoute,
  normalizeRole,
} from '../src/shared/auth/permissions.js';

const cases = [
  ['ADMIN', 'ADMIN_GLOBAL'],
  ['ROLE_ADMIN', 'ADMIN_GLOBAL'],
  ['COMPANY_ADMIN', 'OPERADOR_ATENDIMENTO'],
  ['ROLE_COMPANY_ADMIN', 'OPERADOR_ATENDIMENTO'],
  ['OPERATOR', 'OPERADOR_ATENDIMENTO'],
  ['ROLE_OPERATOR', 'OPERADOR_ATENDIMENTO'],
];

const failures = [];

for (const [legacyRole, expectedRole] of cases) {
  const actualRole = normalizeRole(legacyRole);
  if (actualRole !== expectedRole) {
    failures.push(`${legacyRole}: esperado ${expectedRole}, recebido ${actualRole}`);
  }

  const user = { role: legacyRole };
  if (!canAccessRoute(user, '/dashboard')) {
    failures.push(`${legacyRole}: sessão deixou de acessar o dashboard`);
  }
  if (getDefaultRoute(user) === '/login') {
    failures.push(`${legacyRole}: sessão entrou em redirecionamento para login`);
  }
}

if (failures.length > 0) {
  console.error('Migração dos perfis legados inválida:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Migração dos perfis legados validada.');
console.log('ADMIN -> ADMIN_GLOBAL');
console.log('COMPANY_ADMIN/OPERATOR -> OPERADOR_ATENDIMENTO');
