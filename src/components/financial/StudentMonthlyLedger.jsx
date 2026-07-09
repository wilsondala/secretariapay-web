import { AlertTriangle, CheckCircle2, Clock3, WalletCards } from 'lucide-react';
import { chargeIsOpen, chargeIsOverdue, formatMoney, getStudentName, normalizeText } from '../../utils/formatters.js';

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
    <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 text-sm text-imetro-navy">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg">
          <WalletCards size={19} />
        </div>
        <div>
          <p className="font-black">Resumo financeiro mensal</p>
          <p className="text-xs font-semibold text-slate-500">Mês 1 ao 12, incluindo meses sem propina</p>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm font-semibold">Carregando cobranças...</p>
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

          <p className="mt-4 rounded-2xl border border-slate-100 bg-white/80 p-3 text-xs font-semibold leading-5 text-slate-600">
            Em Angola o aluno não paga obrigatoriamente os 12 meses completos. Os meses fora do calendário de cobrança aparecem como “Não letivo”.
          </p>

          <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
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
  return (
    <div className={`rounded-2xl border p-3 ${paid ? 'border-emerald-100 bg-emerald-50/80' : open ? 'border-amber-100 bg-amber-50/80' : 'border-slate-100 bg-slate-50/80'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-slate-900">Mês {row.index} · {row.short}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{row.label}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${paid ? 'bg-emerald-100 text-emerald-700' : open ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
          {paid ? <CheckCircle2 size={12} /> : open ? <Clock3 size={12} /> : <AlertTriangle size={12} />}
          {row.statusLabel}
        </span>
      </div>

      {paid && (
        <p className="mt-2 rounded-xl bg-white/80 px-3 py-2 text-xs font-black leading-5 text-emerald-800">
          {studentName} - {row.short} - pago - {formatPaidAt(row.paidAt)}
        </p>
      )}

      {neutral ? (
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Mês sem cobrança regular de propina.</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-700">
          <span>Base: {formatMoney(row.amount)}</span>
          <span>Multa: {formatMoney(row.fineAmount)}</span>
          <span>Juros: {formatMoney(row.interestAmount)}</span>
          <span>Total: {formatMoney(row.totalAmount)}</span>
        </div>
      )}
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
    navy: 'border-blue-100 bg-blue-50/70 text-imetro-navy',
    warning: 'border-amber-100 bg-amber-50 text-amber-800',
    danger: 'border-red-100 bg-red-50 text-red-700',
    success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  };
  return (
    <div className={`rounded-2xl border p-3 ${tones[tone] || tones.navy} ${wide ? 'col-span-2' : ''}`}>
      <p className="text-[10px] font-black uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 break-words text-base font-black">{value}</p>
    </div>
  );
}
