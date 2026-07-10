import { AlertTriangle, CheckCircle2, Clock3, WalletCards } from 'lucide-react';
import { chargeIsOverdue, formatMoney, getStudentName, normalizeText } from '../../utils/formatters.js';

const MONTHS = [
  ['Janeiro/2026', 'Janeiro', true],
  ['Fevereiro/2026', 'Fevereiro', true],
  ['Março/2026', 'Março', true],
  ['Abril/2026', 'Abril', true],
  ['Maio/2026', 'Maio', true],
  ['Junho/2026', 'Junho', true],
  ['Julho/2026', 'Julho', true],
  ['Agosto/2026', 'Agosto', false],
  ['Setembro/2026', 'Setembro', true],
  ['Outubro/2026', 'Outubro', true],
  ['Novembro/2026', 'Novembro', true],
  ['Dezembro/2026', 'Dezembro', false],
];

export default function StudentMonthlyLedger({ student, charges = [], loading = false }) {
  const rows = buildRows(charges);
  const stats = buildStats(rows, charges);

  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 text-sm text-slate-950 shadow-premium dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:shadow-none sm:p-5">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-[0_14px_30px_rgba(245,158,11,.22)] dark:shadow-none">
          <WalletCards size={20} />
        </div>
        <div>
          <p className="text-[15px] font-extrabold text-slate-950 dark:text-slate-50">Resumo financeiro mensal</p>
          <p className="mt-1 text-[12px] font-semibold text-slate-500 dark:text-slate-400">Mês 1 ao 12, incluindo meses sem propina</p>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">Carregando cobranças...</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Mini label="Pagos" value={`${stats.paid}/${stats.payable}`} tone="success" />
            <Mini label="Em aberto" value={stats.open} tone="warning" />
            <Mini label="Total pago" value={formatMoney(stats.paidAmount)} wide />
            <Mini label="Juros pagos" value={formatMoney(stats.interest)} tone="danger" />
            <Mini label="Multas pagas" value={formatMoney(stats.fine)} tone="danger" />
            <Mini label="Não letivos" value={stats.nonPayable} />
          </div>

          <p className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/80 p-3 text-xs font-semibold leading-5 text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/35 dark:text-blue-100">
            Em Angola o aluno não paga obrigatoriamente os 12 meses completos. Os meses fora do calendário de cobrança aparecem como “Não letivo”.
          </p>

          <div className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {rows.map((row) => <MonthRow key={row.label} row={row} studentName={getStudentName(student)} />)}
          </div>
        </>
      )}
    </div>
  );
}

function MonthRow({ row, studentName }) {
  const paid = row.status === 'PAID';
  const open = row.status === 'OPEN';
  const neutral = row.status === 'NA';

  const cardClass = paid
    ? 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800/70 dark:bg-emerald-950/25 dark:text-emerald-50'
    : open
      ? 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700/70 dark:bg-amber-950/25 dark:text-amber-50'
      : 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200';

  return (
    <div className={`rounded-[18px] border p-4 shadow-sm dark:shadow-none ${cardClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-950 dark:text-slate-50">Mês {row.index} · {row.short}</p>
          <p className="mt-1 text-[12px] font-semibold text-slate-600 dark:text-slate-300">{row.label}</p>
        </div>
        <StatusPill paid={paid} open={open} neutral={neutral} label={row.statusLabel} />
      </div>

      {paid && (
        <p className="mt-3 rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-xs font-extrabold leading-5 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100">
          {studentName} - {row.short} - pago - {formatPaidAt(row.paidAt)}
        </p>
      )}

      {neutral ? (
        <p className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">Mês sem cobrança regular de propina.</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] font-bold">
          <Amount label="Base" value={row.amount} />
          <Amount label="Multa" value={row.fineAmount} tone={row.fineAmount > 0 ? 'danger' : 'muted'} />
          <Amount label="Juros" value={row.interestAmount} tone={row.interestAmount > 0 ? 'danger' : 'muted'} />
          <Amount label="Total" value={row.totalAmount} tone="strong" />
        </div>
      )}
    </div>
  );
}

function StatusPill({ paid, open, neutral, label }) {
  const className = paid
    ? 'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/25'
    : open
      ? 'bg-amber-100 text-amber-900 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/25'
      : 'bg-slate-200 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';

  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ${className}`}>
      {paid ? <CheckCircle2 size={12} /> : open ? <Clock3 size={12} /> : <AlertTriangle size={12} />}
      {neutral ? 'Não letivo' : label}
    </span>
  );
}

function Amount({ label, value, tone = 'default' }) {
  const toneClass = {
    default: 'text-slate-700 dark:text-slate-300',
    muted: 'text-slate-500 dark:text-slate-400',
    danger: 'text-red-700 dark:text-red-300',
    strong: 'text-slate-950 dark:text-white',
  }[tone];

  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/80">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 break-words text-[12px] font-extrabold ${toneClass}`}>{formatMoney(value)}</p>
    </div>
  );
}

function buildRows(charges) {
  return MONTHS.map(([label, short, payable], index) => {
    const charge = charges.find((item) => matchMonth(item.referenceMonth, label, short) && String(item.status).toUpperCase() === 'PAID') ||
      charges.find((item) => matchMonth(item.referenceMonth, label, short));
    if (!charge && !payable) return baseRow(index, label, short, payable, 'NA', 'Não letivo');
    if (!charge) return baseRow(index, label, short, payable, 'OPEN', 'Não pago / não emitido');
    const paid = String(charge.status).toUpperCase() === 'PAID';
    return {
      ...baseRow(index, label, short, payable, paid ? 'PAID' : 'OPEN', paid ? 'Pago' : chargeIsOverdue(charge) ? 'Vencido' : 'Pendente'),
      amount: Number(charge.amount || 0),
      fineAmount: Number(charge.fineAmount || 0),
      interestAmount: Number(charge.interestAmount || 0),
      totalAmount: Number(charge.totalAmount || 0),
      paidAt: charge.paidAt || charge.updatedAt || charge.createdAt,
    };
  });
}

function baseRow(index, label, short, payable, status, statusLabel) {
  return { index: index + 1, label, short, payable, status, statusLabel, amount: 0, fineAmount: 0, interestAmount: 0, totalAmount: 0, paidAt: null };
}

function buildStats(rows, charges) {
  const paidCharges = charges.filter((charge) => String(charge.status).toUpperCase() === 'PAID');
  const openRows = rows.filter((row) => row.payable && row.status === 'OPEN');
  const sum = (field) => paidCharges.reduce((total, charge) => total + Number(charge[field] || 0), 0);
  return {
    paid: rows.filter((row) => row.status === 'PAID').length,
    payable: rows.filter((row) => row.payable).length,
    open: openRows.length,
    nonPayable: rows.filter((row) => !row.payable).length,
    paidAmount: sum('totalAmount'),
    fine: sum('fineAmount'),
    interest: sum('interestAmount'),
  };
}

function matchMonth(reference, label, short) {
  const value = normalizeText(reference);
  return value.includes(normalizeText(label)) || value.includes(normalizeText(short));
}

function formatPaidAt(value) {
  if (!value) return 'data e hora não registadas';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const day = new Intl.DateTimeFormat('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  const time = new Intl.DateTimeFormat('pt-AO', { hour: '2-digit', minute: '2-digit' }).format(date);
  return `dia ${day} às ${time}`;
}

function Mini({ label, value, wide, tone = 'navy' }) {
  const tones = {
    navy: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/35 dark:text-blue-100',
    warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-100',
    danger: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-100',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/35 dark:text-emerald-100',
  };
  return (
    <div className={`rounded-2xl border p-3 ${tones[tone] || tones.navy} ${wide ? 'col-span-2' : ''}`}>
      <p className="text-[10px] font-extrabold uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-1 break-words text-base font-extrabold">{value}</p>
    </div>
  );
}
