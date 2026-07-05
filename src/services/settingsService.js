import api from './api.js';
import { INSTITUTION_ID } from '../utils/formatters.js';

export const DEFAULT_INSTITUTION_ID = INSTITUTION_ID;

const fallbackInstitution = {
  id: DEFAULT_INSTITUTION_ID,
  name: 'Instituto Superior Politécnico Metropolitano de Angola',
  acronym: 'IMETRO',
  unit: 'DCR — Divisão de Cobranças e Recebimentos',
  country: 'Angola',
  city: 'Luanda',
  currency: 'AOA',
  officialEmail: 'dcr_pay@imetroangola.com',
  ccEmail: 'df.oi_pay@imetroangola.com',
  supportWindow: '07h às 19h',
};

const fallbackDcrPolicy = {
  id: 'local-imetro-dcr-2026',
  institutionId: DEFAULT_INSTITUTION_ID,
  policyCode: 'IMETRO_DCR_2026',
  policyName: 'Política DCR IMETRO 2026',
  currency: 'AOA',
  baseAmount: 45000,
  paymentWindowStartDay: 1,
  noPenaltyUntilDay: 10,
  firstPenaltyStartDay: 11,
  firstPenaltyPercent: 20,
  secondPenaltyStartDay: 15,
  secondPenaltyPercent: 30,
  debtAfterDays: 30,
  delinquencyAfterDays: 90,
  dailyInterestEnabled: false,
  dailyInterestPercent: 0,
  whatsappAllowedStart: '07:00',
  whatsappAllowedEnd: '19:00',
  provisionalAutomaticConfirmation: true,
  manualDcrConfirmationRequired: true,
  dcrApprovalRole: 'DCR_COORDENACAO',
  notes: 'Regras levantadas com o cliente IMETRO: pagamento sem multa até dia 10; multa de 20% depois do dia 10; multa de 30% depois do dia 15; dívida após 30 dias; inadimplência após 90 dias; confirmação manual obrigatória pela DCR.',
};

const fallbackServices = [
  { serviceCode: 'PROPINA', serviceName: 'Propina mensal', serviceCategory: 'PROPINA', chargeType: 'PROPINA', currency: 'AOA', canGenerateCharge: true, requiresDcrValidation: true, active: true },
  { serviceCode: 'CONFIRMACAO_MATRICULA', serviceName: 'Confirmação de matrícula', serviceCategory: 'MATRICULA', chargeType: 'CONFIRMACAO_MATRICULA', currency: 'AOA', canGenerateCharge: true, requiresDcrValidation: true, active: true },
  { serviceCode: 'EXAME_RECURSO', serviceName: 'Exame de recurso', serviceCategory: 'EXAMES', chargeType: 'EXAME_RECURSO', currency: 'AOA', canGenerateCharge: true, requiresDcrValidation: true, active: true },
  { serviceCode: 'DECLARACAO_FREQUENCIA', serviceName: 'Declaração de frequência', serviceCategory: 'DECLARACOES', chargeType: 'DECLARACAO_FREQUENCIA', currency: 'AOA', canGenerateCharge: true, requiresDcrValidation: true, active: true },
  { serviceCode: 'DECLARACAO_COM_NOTAS', serviceName: 'Declaração com notas', serviceCategory: 'DECLARACOES', chargeType: 'DECLARACAO_COM_NOTAS', currency: 'AOA', canGenerateCharge: true, requiresDcrValidation: true, active: true },
  { serviceCode: 'DIPLOMA_CERTIFICADO', serviceName: 'Diploma + certificado', serviceCategory: 'CERTIFICADOS', chargeType: 'DIPLOMA_CERTIFICADO', currency: 'AOA', canGenerateCharge: true, requiresDcrValidation: true, active: true },
  { serviceCode: 'MULTA', serviceName: 'Multa', serviceCategory: 'MULTAS', chargeType: 'MULTA', currency: 'AOA', canGenerateCharge: true, requiresDcrValidation: true, active: true },
  { serviceCode: 'MUDANCA_CURSO', serviceName: 'Mudança de curso', serviceCategory: 'ACADEMICO', chargeType: 'MUDANCA_CURSO', currency: 'AOA', canGenerateCharge: true, requiresDcrValidation: true, active: true },
];

const fallbackPaymentMethods = [
  { code: 'MULTICAIXA_EXPRESS', name: 'Multicaixa Express', active: true, description: 'Transferência bancária para a conta AKZ indicada.' },
  { code: 'REFERENCIA_BANCARIA', name: 'Referência bancária', active: true, description: 'Pagamento por referência/guia emitida pela DCR.' },
  { code: 'TRANSFERENCIA_BANCARIA', name: 'Transferência bancária', active: true, description: 'Banco Angolano de Investimento — IBAN institucional.' },
  { code: 'UNITEL_MONEY', name: 'Unitel Money', active: true, description: 'Quando autorizado pela instituição.' },
  { code: 'AFRIMONEY', name: 'Afrimoney', active: true, description: 'Quando autorizado pela instituição.' },
  { code: 'PRESENCIAL', name: 'Pagamento presencial na DCR/tesouraria', active: true, description: 'Atendimento presencial e validação institucional.' },
];

const fallbackChannels = [
  { code: 'WHATSAPP', name: 'WhatsApp institucional', status: 'ACTIVE', mode: 'Produção', description: 'Envio real de guias e mensagens para contacto oficial cadastrado.' },
  { code: 'EMAIL', name: 'E-mail institucional', status: 'MOCK', mode: 'Preparado', description: 'Fallback para envio de guia por e-mail cadastrado.' },
  { code: 'SMS', name: 'SMS com link da guia', status: 'MOCK', mode: 'Preparado', description: 'Fallback para aluno sem WhatsApp, usando telefone oficial cadastrado.' },
  { code: 'PDF', name: 'Guia pública em PDF', status: 'ACTIVE', mode: 'Produção', description: 'Link público seguro por código da cobrança.' },
];

function arrayFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

async function getFirst(paths, fallback) {
  for (const path of paths) {
    try {
      const { data } = await api.get(path);
      if (data && (!Array.isArray(data) || data.length > 0)) return data;
    } catch {
      // Fallback controlado: alguns endpoints ainda não estão padronizados no backend.
    }
  }
  return fallback;
}

async function postFirst(paths, body, fallback) {
  for (const path of paths) {
    try {
      const { data } = await api.post(path, body);
      if (data) return data;
    } catch {
      // Fallback controlado.
    }
  }
  return fallback;
}

export async function getInstitutionSettings(institutionId = DEFAULT_INSTITUTION_ID) {
  return getFirst([
    `/api/v1/institutions/${institutionId}`,
    `/api/v1/admin/institutions/${institutionId}`,
    `/api/v1/settings/institution/${institutionId}`,
  ], fallbackInstitution);
}

export async function getDcrPolicy(institutionId = DEFAULT_INSTITUTION_ID) {
  return getFirst([
    `/api/v1/institution-dcr-policies/institution/${institutionId}`,
    `/api/v1/admin/institution-dcr-policies/institution/${institutionId}`,
    `/api/v1/settings/dcr-policy?institutionId=${institutionId}`,
  ], fallbackDcrPolicy);
}

export async function evaluateDcrPolicy(institutionId = DEFAULT_INSTITUTION_ID, payload = {}) {
  const baseAmount = Number(payload.baseAmount || fallbackDcrPolicy.baseAmount);
  const referenceDate = payload.referenceDate || new Date().toISOString().slice(0, 10);
  const fallback = localDcrEvaluation({ baseAmount, referenceDate, dueDate: payload.dueDate });
  return postFirst([
    `/api/v1/institution-dcr-policies/institution/${institutionId}/evaluate`,
    `/api/v1/admin/institution-dcr-policies/institution/${institutionId}/evaluate`,
  ], { baseAmount, dueDate: payload.dueDate, referenceDate }, fallback);
}

export async function getChargeServices(institutionId = DEFAULT_INSTITUTION_ID) {
  const data = await getFirst([
    `/api/v1/institution-charge-service-configs/institution/${institutionId}`,
    `/api/v1/admin/institution-charge-service-configs?institutionId=${institutionId}`,
    `/api/v1/settings/charge-services?institutionId=${institutionId}`,
  ], fallbackServices);
  const list = arrayFromPayload(data);
  return list.length > 0 ? list : fallbackServices;
}

export async function getPaymentMethods(institutionId = DEFAULT_INSTITUTION_ID) {
  const data = await getFirst([
    `/api/v1/payment-method-configs/institution/${institutionId}`,
    `/api/v1/admin/payment-method-configs?institutionId=${institutionId}`,
    `/api/v1/settings/payment-methods?institutionId=${institutionId}`,
  ], fallbackPaymentMethods);
  const list = arrayFromPayload(data);
  return list.length > 0 ? list : fallbackPaymentMethods;
}

export async function getCommunicationChannels() {
  const data = await getFirst([
    '/api/v1/admin/communication-channels',
    '/api/v1/settings/channels',
    '/api/v1/secretariapay/channels',
  ], fallbackChannels);
  const list = arrayFromPayload(data);
  return list.length > 0 ? list : fallbackChannels;
}

export async function getSettingsOverview(institutionId = DEFAULT_INSTITUTION_ID) {
  const [institution, dcrPolicy, services, paymentMethods, channels] = await Promise.all([
    getInstitutionSettings(institutionId),
    getDcrPolicy(institutionId),
    getChargeServices(institutionId),
    getPaymentMethods(institutionId),
    getCommunicationChannels(),
  ]);

  return { institution, dcrPolicy, services, paymentMethods, channels };
}

function localDcrEvaluation({ baseAmount, referenceDate }) {
  const day = Number(String(referenceDate || '').split('-')[2] || 1);
  let penaltyPercent = 0;
  let status = 'PAYMENT_WINDOW';
  let message = 'Propina em período de pagamento sem multa.';

  if (day >= 15) {
    penaltyPercent = 30;
    status = 'LATE_SECOND_PENALTY';
    message = 'Atraso agravado com multa DCR de 30% após o dia 15.';
  } else if (day >= 11) {
    penaltyPercent = 20;
    status = 'LATE_FIRST_PENALTY';
    message = 'Atraso de pagamento com multa DCR de 20% após o dia 10.';
  }

  const penaltyAmount = Number(((baseAmount * penaltyPercent) / 100).toFixed(2));
  return {
    institutionId: DEFAULT_INSTITUTION_ID,
    policyCode: fallbackDcrPolicy.policyCode,
    currency: 'AOA',
    baseAmount,
    penaltyPercent,
    penaltyAmount,
    totalAmount: baseAmount + penaltyAmount,
    referenceDate,
    status,
    debt: false,
    delinquent: false,
    canSendWhatsappNow: true,
    provisionalAutomaticConfirmation: true,
    manualDcrConfirmationRequired: true,
    dcrApprovalRole: 'DCR_COORDENACAO',
    message,
  };
}
