import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  MessageCircle,
  ReceiptText,
  ShieldCheck,
  Users,
  WalletCards,
} from 'lucide-react';
import { loadDashboardSummary } from '../services/dashboardService.js';
import { formatMoney } from '../utils/formatters.js';

const reportDefinitions = [
  {
    id: 'financeiro', title: 'Relatório financeiro da DCR', icon: BarChart3,
    description: 'Indicadores reais de estudantes, cobranças, valores em aberto e vencidos.',
    buildRows: (summary) => [
      ['Total de estudantes', summary.studentsTotal],
      ['Total de cobranças', summary.chargesTotal],
      ['Cobranças pendentes', summary.pendingCharges],
      ['Cobranças vencidas', summary.overdueCharges],
      ['Total em aberto', formatMoney(summary.openAmount)],
      ['Valor vencido', formatMoney(summary.overdueAmount)],
    ],
  },
  {
    id: 'cobrancas', title: 'Cobranças e contactos', icon: MessageCircle,
    description: 'Base operacional para envio de guias e acompanhamento dos contactos oficiais.',
    buildRows: (summary) => [
      ['Cobranças disponíveis', summary.chargesTotal],
      ['Cobranças pendentes', summary.pendingCharges],
      ['Cobranças vencidas', summary.overdueCharges],
      ['Estudantes sem contacto', summary.noContactStudents],
      ['Canal prioritário', 'WhatsApp institucional'],
    ],
  },
  {
    id: 'comprovativos', title: 'Comprovativos e recibos', icon: ReceiptText,
    description: 'Situação real dos comprovativos pendentes de validação pela DCR.',
    buildRows: (summary) => [
      ['Comprovativos pendentes', summary.pendingProofs],
      ['Cobranças em aberto', summary.pendingCharges + summary.overdueCharges],
      ['Valor em aberto', formatMoney(summary.openAmount)],
      ['Regra de emissão', 'Recibo somente após confirmação do pagamento'],
    ],
  },
  {
    id: 'inadimplencia', title: 'Inadimplência e bloqueios', icon: Users,
    description: 'Estudantes em atraso, sem contacto ou com restrição académica.',
    buildRows: (summary) => [
      ['Cobranças em atraso', summary.overdueCharges],
      ['Valor vencido', formatMoney(summary.overdueAmount)],
      ['Estudantes sem contacto', summary.noContactStudents],
      ['Estudantes bloqueados', summary.blockedStudents],
    ],
  },
];

export default function ReportsOfficialPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setSummary(await loadDashboardSummary());
    } catch (err) {
      setSummary(null);
      setError(err?.response?.data?.message || err?.message || 'Não foi possível carregar os dados financeiros reais.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const allRows = useMemo(() => {
    if (!summary) return [];
    return reportDefinitions.flatMap((report) => [[report.title, ''], ...report.buildRows(summary), ['', '']]);
  }, [summary]);

  function exportCsv() {
    if (!allRows.length) return;
    const csv = allRows.map((row) => row.map(csvCell).join(';')).join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-financeiro-imetro-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    if (!allRows.length) return;
    const rows = allRows.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join('');
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) return;
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Relatório financeiro IMETRO</title><style>body{font-family:Arial,sans-serif;color:#0f172a;padding:32px}h1{color:#061936}p{color:#475569}table{width:100%;border-collapse:collapse;margin-top:24px}td{border:1px solid #cbd5e1;padding:10px}td:first-child{font-weight:700;width:65%}.meta{margin-top:8px;font-size:12px}</style></head><body><h1>Relatório financeiro da DCR — IMETRO</h1><p>Dados consultados em tempo real no SecretáriaPay Académico.</p><p class="meta">Emitido em ${new Date().toLocaleString('pt-AO')}</p><table>${rows}</table></body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  return (
    <div className="space-y-5">
      <section className="premium-hero">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="premium-pill"><FileSpreadsheet size={14} /> Relatórios institucionais</div>
            <h1 className="mt-4 text-2xl font-black text-white sm:text-4xl">Central de relatórios da DCR</h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/80 sm:text-base">A central exibe somente informações carregadas da API e nunca substitui falhas por dados fictícios.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportPdf} disabled={!summary || loading} className="btn-light"><FileText size={17} /> Exportar PDF</button>
            <button onClick={exportCsv} disabled={!summary || loading} className="btn-white"><Download size={17} /> Exportar CSV</button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="flex gap-3"><AlertTriangle size={20} /><div><p className="font-black">Dados indisponíveis</p><p className="mt-1 text-sm font-semibold">{error}</p><button onClick={load} className="mt-3 underline">Tentar novamente</button></div></div>
        </div>
      )}

      {loading ? (
        <div className="card-premium flex items-center justify-center gap-3 p-12 text-sm font-bold text-slate-500"><Loader2 className="animate-spin" size={22} /> Carregando dados financeiros reais...</div>
      ) : summary ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={WalletCards} label="Total em aberto" value={formatMoney(summary.openAmount)} />
            <Metric icon={BarChart3} label="Valor vencido" value={formatMoney(summary.overdueAmount)} tone="amber" />
            <Metric icon={ReceiptText} label="Comprovativos pendentes" value={summary.pendingProofs} tone="violet" />
            <Metric icon={ShieldCheck} label="Estudantes bloqueados" value={summary.blockedStudents} tone="red" />
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            {reportDefinitions.map((report) => <ReportCard key={report.id} report={report} summary={summary} />)}
          </section>
        </>
      ) : null}
    </div>
  );
}

function ReportCard({ report, summary }) {
  const Icon = report.icon;
  return (
    <section className="card-premium p-5">
      <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Icon size={24} /></div><div><h2 className="text-lg font-black text-slate-950 dark:text-white">{report.title}</h2><p className="mt-1 text-sm font-semibold text-slate-500">{report.description}</p></div></div>
      <div className="mt-5 space-y-2">{report.buildRows(summary).map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 last:border-0 dark:border-white/10"><span className="text-sm font-semibold text-slate-500">{label}</span><strong className="text-right text-sm text-slate-950 dark:text-white">{value ?? 0}</strong></div>)}</div>
    </section>
  );
}

function Metric({ icon: Icon, label, value, tone = 'blue' }) {
  const tones = { blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700', violet: 'bg-violet-50 text-violet-700', red: 'bg-red-50 text-red-700' };
  return <div className="card-premium p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-black text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{value}</p></div><div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}><Icon size={22} /></div></div></div>;
}

function csvCell(value) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
