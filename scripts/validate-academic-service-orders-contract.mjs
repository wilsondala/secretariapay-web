import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
const page = read('src/pages/AcademicServiceOrdersPage.jsx');
const service = read('src/services/academicServiceOrdersService.js');
const permissions = read('src/shared/auth/permissions.js');

requireText(app, "path=\"/academic-service-orders\"", 'Rota protegida');
requireText(app, '<AcademicServiceOrdersPage />', 'Componente da rota');
requireText(sidebar, "['Pedidos de serviços', '/academic-service-orders'", 'Menu académico');
requireText(permissions, "'/academic-service-orders'", 'Permissão da rota');
requireText(permissions, 'createAcademicServiceOrders', 'Ação DCR');
requireText(permissions, 'processAcademicServiceOrders', 'Ação Secretaria');
requireText(permissions, 'signAcademicServiceOrders', 'Ação Direção');

requireText(permissions, 'ROLES.DCR_COORDENACAO', 'Perfil DCR coordenação');
requireText(permissions, 'ROLES.DCR_OPERADOR', 'Perfil DCR operador');
requireText(permissions, 'ROLES.SECRETARIA', 'Perfil Secretaria');
requireText(permissions, 'ROLES.DIRECAO', 'Perfil Direção');

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

const requiredEndpoints = [
  '/api/v1/academic-service-orders',
  '/archive',
  '/request-payment',
  '/generate-document',
  '/ready-for-print',
  '/print',
  '/submit-signature',
  '/sign',
  '/ready-for-pickup',
  '/send-pickup-whatsapp',
  '/deliver',
];
for (const endpoint of requiredEndpoints) requireText(service, endpoint, 'Contrato da API');

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
