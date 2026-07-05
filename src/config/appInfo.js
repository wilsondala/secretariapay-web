export const appInfo = {
  version: '0.8.1',
  releaseName: 'Demonstração IMETRO/DCR',
  environmentLabel: import.meta.env.VITE_APP_ENVIRONMENT || 'Produção',
  updatedAt: '05/07/2026',
  frontendUrl: 'https://painel-secretariapay.paixaoangola.com',
  apiUrl: import.meta.env.VITE_API_BASE_URL || 'https://secretariapay-api.paixaoangola.com',
  modules: [
    { name: 'Dashboard institucional', status: 'Pronto', description: 'Resumo financeiro e operacional para responsáveis da faculdade.' },
    { name: 'Estudantes', status: 'Pronto', description: 'Consulta académica, contactos oficiais e situação financeira.' },
    { name: 'Cobranças e propinas', status: 'Pronto', description: 'Lista de cobranças, atrasos, multas e guias PDF.' },
    { name: 'Comprovativos', status: 'Preparado', description: 'Interface de validação manual pela DCR.' },
    { name: 'Recibos', status: 'Preparado', description: 'Consulta e emissão institucional após validação.' },
    { name: 'WhatsApp', status: 'Pronto', description: 'Histórico de mensagens, guias enviadas e falhas de contacto.' },
    { name: 'Importações WebSchool', status: 'Pronto', description: 'Lotes, linhas e sincronização com estudantes, cursos e turmas.' },
    { name: 'Configurações DCR', status: 'Pronto', description: 'Regras de multa, dívida, canais e segurança operacional.' }
  ],
  goldenRules: [
    'Guias, recibos e informações financeiras são enviados apenas para contactos oficiais cadastrados no IMETRO.',
    'Pagamento informado pelo WhatsApp não confirma automaticamente a propina.',
    'A DCR valida manualmente comprovativos antes de emitir recibos.',
    'Dados de testes usam estudantes controlados e não representam dados reais sensíveis.',
    'O painel é institucional e não substitui sistemas oficiais sem integração aprovada pela universidade.'
  ]
};
