import { env } from '../../config/env.js';
import { normalizeRole } from './permissions.js';

const ADMIN_ROLES = new Set([
  'ADMIN_GLOBAL',
  'ADMIN_INSTITUTION',
  'ADMIN_IMETRO',
]);

const PRESENTATIONS = {
  DCR_COORDENACAO: {
    title: env.dcrName,
    unit: 'IMETRO · DCR',
    support: 'Suporte DCR',
    initials: 'DC',
  },
  DCR_OPERADOR: {
    title: env.dcrName,
    unit: 'IMETRO · DCR',
    support: 'Suporte DCR',
    initials: 'DO',
  },
  SECRETARIA: {
    title: 'Secretaria Académica',
    unit: 'IMETRO · Secretaria',
    support: 'Suporte da Secretaria',
    initials: 'SA',
  },
  ADMISSOES: {
    title: 'Admissões e Inscrições',
    unit: 'IMETRO · Admissões',
    support: 'Suporte de Admissões',
    initials: 'AD',
  },
  MARKETING: {
    title: 'Captação e Marketing',
    unit: 'IMETRO · Captação',
    support: 'Suporte de Captação',
    initials: 'MK',
  },
  DIRECAO: {
    title: 'Direção Institucional',
    unit: 'IMETRO · Direção',
    support: 'Suporte da Direção',
    initials: 'DI',
  },
  FINANCEIRO: {
    title: 'Gestão Financeira',
    unit: 'IMETRO · Financeiro',
    support: 'Suporte Financeiro',
    initials: 'GF',
  },
  TESOURARIA: {
    title: 'Tesouraria Académica',
    unit: 'IMETRO · Tesouraria',
    support: 'Suporte da Tesouraria',
    initials: 'TA',
  },
  AUDITORIA: {
    title: 'Auditoria Institucional',
    unit: 'IMETRO · Auditoria',
    support: 'Suporte de Auditoria',
    initials: 'AU',
  },
  TIC: {
    title: 'Tecnologia da Informação',
    unit: 'IMETRO · TIC',
    support: 'Suporte TIC',
    initials: 'TI',
  },
  OPERADOR_ATENDIMENTO: {
    title: 'Atendimento Académico',
    unit: 'IMETRO · Atendimento',
    support: 'Suporte de Atendimento',
    initials: 'AA',
  },
};

export function getRolePresentation(user) {
  const role = normalizeRole(user?.role);

  if (ADMIN_ROLES.has(role)) {
    return {
      title: 'Administração Institucional',
      unit: 'IMETRO · Administração',
      support: 'Suporte Institucional',
      initials: 'AI',
    };
  }

  return PRESENTATIONS[role] || {
    title: 'SecretáriaPay Académico',
    unit: 'IMETRO · Portal institucional',
    support: 'Suporte institucional',
    initials: 'SP',
  };
}
