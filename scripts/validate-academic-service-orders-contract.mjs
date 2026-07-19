import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const failures = [];

function requireText(source, expected, label) {
  if (!source.includes(expected)) failures.push(`${label}: não encontrou ${JSON.stringify(expected)}`);
}

function requireOrdered(source, values, label) {
  let cursor = -1;
  for (const value of values) {
    const next = source.indexOf(value, cursor + 1);
    if (next < 0) {
      failures.push(`${label}: estado ausente ${value}`);
      continue;
    }
    if (next <= cursor) failures.push(`${label}: ordem inválida em ${value}`);
    cursor = next;
  }
}

const app = read('src/App.jsx');
const sidebar = read('src/layouts/Sidebar.jsx');
const topbar = read('src/layouts/Topbar.jsx');
const page = read('src/pages/AcademicServiceOrdersPage.jsx');
const service = read('src/services/academicServiceOrdersService.js');
const permissionsSource = read('src/shared/auth/permissions.js');
const permissionsModule = await import(pathToFileURL(resolve(root, 'src/shared/auth/permissions.js')).href);
const { ROUTE_ROLES, ROLES } = permissionsModule;

requireText(app, "path=\"/academic-service-orders\"", 'Rota protegida');
requireText(app, '<AcademicServiceOrdersPage />', 'Componente da rota');
requireText(sidebar, "['Pedidos de serviços', '/academic-service-orders'", 'Menu académico');
requireText(permissionsSource, "'/academic-service-orders'", 'Permissão da rota');
requireText(permissionsSource, 'createAcademicServiceOrders', 'Ação DCR');
requireText(permissionsSource, 'processAcademicServiceOrders', 'Ação Secretaria');
requireText(permissionsSource, 'signAcademicServiceOrders', 'Ação Direção');

requireText(permissionsSource, 'ROLES.DCR_COORDENACAO', 'Perfil DCR coordenação');
requireText(permissionsSource, 'ROLES.DCR_OPERADOR', 'Perfil DCR operador');
requireText(permissionsSource, 'ROLES.SECRETARIA', 'Perfil Secretaria');
requireText(permissionsSource, 'ROLES.DIRECAO', 'Perfil Direção');
requireText(topbar, "canAccessRoute(user, '/reports')", 'Topbar condicionado por perfil');
requireText(topbar, "canAccessRoute(user, '/whatsapp')", 'WhatsApp condicionado por perfil');

const dcrRoles = [ROLES.DCR_COORDENACAO, ROLES.DCR_OPERADOR];
const dcrRequiredRoutes = [
  '/dashboard',
  '/students',
  '/charges',
  '/academic-services',
  '/proofs',
  '/receipts',
  '/academic-service-orders',
];
const dcrForbiddenRoutes = [
  '/academic-documents',
  '/academic-catalog',
  '/whatsapp',
  '/operations',
  '/imports',
  '/reports',
  '/admin-users',
  '/settings',
];

for (const route of dcrRequiredRoutes) {
  const allowed = ROUTE_ROLES[route] || [];
  for (const role of dcrRoles) {
    if (!allowed.includes(role)) failures.push(`Escopo DCR: ${role} deve aceder a ${route}`);
  }
}

for (const route of dcrForbiddenRoutes) {
  const allowed = ROUTE_ROLES[route] || [];
  for (const role of dcrRoles) {
    if (allowed.includes(role)) failures.push(`Escopo DCR: ${role} não deve aceder a ${route}`);
  }
}

const sequence = [
  'SOLICITADO',
  'AGUARDANDO_PAGAMENTO',
  'PAGO',
  'DOCUMENTO_GERADO',
  'PRONTO_PARA_IMPRESSAO',
  'IMPRESSO',
  'AGUARDANDO_ASSINATURA',
  'ASSINADO',
  'PRONTO_PARA_LEVANTAMENTO',
  'WHATSAPP_ENVIADO',
  'ENTREGUE',
];
requireOrdered(page.slice(page.indexOf('const STATUS_SEQUENCE'), page.indexOf('const STATUS_INFO')), sequence, 'Sequência institucional');

requireText(service, "const BASE_URL = '/api/v1/academic-service-orders'", 'Base da API');
requireText(service, '`${BASE_URL}/archive`', 'Endpoint de arquivo');
requireText(service, '`${BASE_URL}/${id}/request-payment`', 'Endpoint de cobrança');

const requiredActions = [
  'generate-document',
  'ready-for-print',
  'print',
  'submit-signature',
  'sign',
  'ready-for-pickup',
  'send-pickup-whatsapp',
  'deliver',
];
for (const action of requiredActions) requireText(service, `postAction(id, '${action}'`, 'Contrato da API');

requireText(page, "selected.status === 'AGUARDANDO_PAGAMENTO'", 'Bloqueio antes do pagamento');
requireText(page, "selected.status === 'PAGO' && canProcess", 'Entrada na fila da Secretaria');
requireText(page, "selected.status === 'AGUARDANDO_ASSINATURA' && canSign", 'Assinatura da Direção');
requireText(page, "selected.status === 'PRONTO_PARA_LEVANTAMENTO' && canProcess", 'WhatsApp após disponibilidade física');
requireText(page, "selected.status === 'WHATSAPP_ENVIADO' && canProcess", 'Registo de entrega após WhatsApp');
requireText(page, 'recipientDocumentNumber', 'Identificação no levantamento');
requireText(page, 'Arquivo de documentos', 'Arquivo documental');

if (failures.length > 0) {
  console.error('Contrato do fluxo académico inválido:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Contrato do fluxo académico validado.');
console.log(`Estados confirmados: ${sequence.join(' -> ')}`);
console.log('Perfis confirmados: DCR, Secretaria e Direção.');
console.log(`Escopo DCR confirmado: ${dcrRequiredRoutes.join(', ')}`);
