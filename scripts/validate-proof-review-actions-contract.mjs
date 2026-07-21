import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src/pages/ProofsSeparatedPage.jsx'), 'utf8');
const failures = [];

function requireText(expected, label) {
  if (!source.includes(expected)) failures.push(`${label}: não encontrou ${JSON.stringify(expected)}`);
}

requireText("const APPROVED = ['APPROVED', 'VALIDATED']", 'Estados equivalentes de aprovação');
requireText('const selectedIsReviewable = REVIEWABLE.includes(selectedStatus)', 'Proteção do estado pendente');
requireText("const fallbackStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'", 'Estado imediato após decisão');
requireText('applyReviewResult(result, action)', 'Atualização local após resposta da API');
requireText('disabled={working || !selectedIsReviewable}', 'Bloqueio de ações processadas');
requireText("selectedIsApproved ? 'Aprovado'", 'Rótulo final de aprovação');
requireText("selectedIsRejected ? 'Rejeitado'", 'Rótulo final de rejeição');
requireText("working && reviewAction === 'approve'", 'Progresso da aprovação');
requireText("working && reviewAction === 'reject'", 'Progresso da rejeição');
requireText('As ações foram bloqueadas para evitar duplicidade.', 'Orientação após aprovação');

if (failures.length > 0) {
  console.error('Contrato das ações de validação DCR inválido:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Contrato das ações de validação DCR validado.');
console.log('Aprovar -> Aprovando... -> Aprovado.');
console.log('Rejeitar -> Rejeitando... -> Rejeitado.');
