import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
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

const demoSummary = {
  demoMode: true,
  studentsTotal: 3,
  chargesTotal: 3,
  pendingCharges: 1,
  overdueCharges: 1,
  openAmount: 103500,
  overdueAmount: 58500,
  noContactStudents: 1,
  blockedStudents: 0,
  charges: [
    { chargeCode: 'IMT-PROPINA-2026_07-20200629', studentName: 'Estudante Demo 1', description: 'Propina Julho 2026', referenceMonth: '2026-07', status: 'PENDING', totalAmount: 45000 },
    { chargeCode: 'IMT-PROPINA-2026_06-20200925', studentName: 'Estudante Demo 2', description: 'Propina Junho 2026', referenceMonth: '2026-06', status: 'OVERDUE', totalAmount: 58500 },
    { chargeCode: 'IMT-PROPINA-2026_05-20230294', studentName: 'Estudante Demo 3', description: 'Propina Maio 2026', referenceMonth: '2026-05', status: 'PAID', totalAmount: 45000 },
  ],
};

const quickStats = [
  { label: 'Financeiro', value: 'Mensal', description: 'Resumo executivo', icon: WalletCards, tone: 'bg-blue-50 text-blue-700' },
  { label: 'Cobranças', value: 'DCR', description: 'Operação diária', icon: CalendarDays, tone: 'bg-amber-50 text-amber-700' },
  { label: 'WhatsApp', value: 'Envios', description: 'Mensagens e guias', icon: MessageCircle, tone: 'bg-emerald-50 text-emerald-700' },
  { label: 'Auditoria', value: 'Manual', description: 'Validação e recibos', icon: ShieldCheck, tone: 'bg-red-50 text-red-700' },
];

const reportDefinitions = [
  {
    id: 'financeiro-dcr',
    title: 'Relatório financeiro da DCR',
    shortTitle: 'Financeiro DCR',
    description: 'Resumo de propinas, mensalidades vencidas, total em aberto, valores recebidos e evolução mensal.',
    icon: BarChart3,
    tone: 'blue',
    items: ['Total em aberto', 'Valores vencidos', 'Recebimentos do mês'],
    buildRows: (summary) => [
      ['Total de estudantes', summary.studentsTotal, 'Base académica considerada no painel'],
      ['Total de cobranças', summary.chargesTotal, 'Cobranças carregadas para o relatório'],
      ['Cobranças pendentes', summary.pendingCharges, 'Aguardando pagamento ou confirmação'],
      ['Mensalidades vencidas', summary.overdueCharges, 'Cobranças fora do prazo'],
      ['Total em aberto', formatMoney(summary.openAmount), 'Valor financeiro pendente'],
      ['Valor vencido', formatMoney(summary.overdueAmount), 'Valor em atraso'],
    ],
  },
  {
    id: 'cobrancas-whatsapp',
    title: 'Relatório de cobranças WhatsApp',
    shortTitle: 'Cobranças WhatsApp',
    description: 'Cobranças enviadas, estudantes sem contacto oficial, mensagens falhadas e reenviadas.',
    icon: MessageCircle,
    tone: 'green',
    items: ['Guias enviadas', 'Falhas de contacto', 'Reenvios pendentes'],
    buildRows: (summary) => [
      ['Guias preparadas', summary.chargesTotal, 'Total de cobranças que podem originar guia'],
      ['Cobranças pendentes', summary.pendingCharges, 'Alunos que ainda precisam pagar'],
      ['Estudantes sem contacto', summary.noContactStudents, 'Alunos sem telefone, WhatsApp ou e-mail'],
      ['Fluxo WhatsApp demo', 'Ativo', 'Guia PDF, simulação de pagamento e recibo PDF'],
      ['Canal prioritário', 'WhatsApp financeiro', 'Atendimento exclusivo de propinas, guias, multas, comprovativos e recibos'],
    ],
  },
  {
    id: 'comprovativos-recibos',
    title: 'Relatório de comprovativos e recibos',
    shortTitle: 'Comprovativos e recibos',
    description: 'Comprovativos pendentes, aprovados, rejeitados e recibos emitidos pela DCR.',
    icon: ReceiptText,
    tone: 'amber',
    items: ['Pendentes de validação', 'Aprovados', 'Recibos emitidos'],
    buildRows: (summary) => [
      ['Comprovativos pendentes', Math.max(Number(summary.pendingCharges || 0) - 1, 0), 'Aguardando validação DCR'],
      ['Recibos demonstrativos', 'Ativo', 'Emitidos no fluxo de demonstração'],
      ['Pagamentos automáticos', 'Multicaixa Express, Referência e mesmo banco', 'Recibo gerado após confirmação'],
      ['Pagamentos manuais', 'Depósito, balcão, TPA e outro banco', 'Dependem de comprovativo e validação DCR'],
      ['Total em aberto', formatMoney(summary.openAmount), 'Base para reconciliação financeira'],
    ],
  },
  {
    id: 'inadimplentes',
    title: 'Relatório de estudantes inadimplentes',
    shortTitle: 'Inadimplentes',
    description: 'Lista operacional de estudantes com propinas vencidas, bloqueios e necessidade de contacto.',
    icon: Users,
    tone: 'red',
    items: ['Alunos em atraso', 'Bloqueios', 'Sem contacto oficial'],
    buildRows: (summary) => [
      ['Alunos/cobranças em atraso', summary.overdueCharges, 'Registos vencidos que exigem cobrança'],
      ['Valor vencido', formatMoney(summary.overdueAmount), 'Montante total em atraso'],
      ['Estudantes sem contacto', summary.noContactStudents, 'Dificultam cobrança por WhatsApp'],
      ['Bloqueios académicos', summary.blockedStudents, 'Registos com restrição académica'],
      ['Prioridade DCR', summary.overdueCharges > 0 ? 'Alta' : 'Normal', 'Baseada em cobranças vencidas'],
    ],
  },
];

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState('');

  async function loadReports() {
    setLoading(true);
    setWarning('');
    try {
      const result = await loadDashboardSummary();
      setSummary(result);
      if (result?.demoMode || result?.warning) setWarning(result.warning || 'Relatórios em modo demonstrativo.');
    } catch (error) {
      setSummary(demoSummary);
      setWarning('Não foi possível consultar todos os dados reais agora. A central está exibindo uma base demonstrativa para apresentação.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const readySummary = summary || demoSummary;
  const allRows = useMemo(() => reportDefinitions.flatMap((report) => [
    [report.title, '', ''],
    ...report.buildRows(readySummary),
    ['', '', ''],
  ]), [readySummary]);

  function exportGeneralPdf() {
    openPrintableReport({
      title: 'Exportação geral da DCR',
      description: 'Relatório consolidado com indicadores financeiros, WhatsApp, comprovativos, recibos e inadimplência.',
      rows: allRows,
    });
  }

  function exportGeneralExcel() {
    downloadCsv('exportacao-geral-dcr.csv', allRows);
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#061936] via-[#08285A] to-[#061936] p-5 text-white shadow-[0_24px_70px_rgba(7,20,45,.16)] sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-20 h-56 w-56 rounded-full bg-imetro-gold/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-white/80">
              <FileSpreadsheet size={14} />
              Relatórios institucionais
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-4xl">Central de relatórios da DCR</h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/80 sm:text-base">
              Área preparada para exportação dos relatórios financeiros, académicos e operacionais do SecretáriaPay Académico.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportGeneralPdf} className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white shadow-[0_16px_44px_rgba(0,0,0,.12)] transition hover:bg-white/15">
              <FileText size={17} />
              Exportação geral PDF
            </button>
            <button onClick={exportGeneralExcel} className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-imetro-navy shadow-[0_16px_44px_rgba(0,0,0,.12)] transition hover:bg-slate-50">
              <Download size={17} />
              Excel geral
            </button>
          </div>
        </div>
      </section>

      {warning ? (
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 text-amber-900 shadow-[0_16px_46px_rgba(15,23,42,.05)]">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={20} />
            <p className="text-sm font-semibold leading-6">{warning}</p>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickStats.map(({ label, value, description, icon: Icon, tone }) => (
          <div key={label} className="card-premium p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-black text-imetro-navy">{loading ? '...' : value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{description}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${tone}`}>
                {loading ? <Loader2 className="animate-spin" size={22} /> : <Icon size={22} />}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
        {reportDefinitions.map((report) => (
          <ReportCard key={report.id} report={report} summary={readySummary} loading={loading} />
        ))}
      </section>

      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 text-emerald-900 shadow-[0_16px_46px_rgba(15,23,42,.05)]">
        <div className="flex gap-3">
          <ShieldCheck className="mt-1 shrink-0 text-emerald-600" size={22} />
          <div>
            <p className="font-black">Relatórios funcionais</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              Os botões PDF abrem uma versão imprimível para salvar em PDF. Os botões Excel baixam um arquivo CSV compatível com Excel, sem depender de novos endpoints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ report, summary, loading }) {
  const { title, description, icon: Icon, tone, items } = report;
  const tones = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    red: 'bg-red-50 text-red-700 ring-red-100',
  };
  const rows = report.buildRows(summary);

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,.07)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,.10)]">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-300/20 blur-2xl" />
      <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ring-1 ${tones[tone] || tones.blue}`}>
        {loading ? <Loader2 className="animate-spin" size={26} /> : <Icon size={28} />}
      </div>
      <h2 className="relative mt-5 text-lg font-black leading-6 text-imetro-navy">{title}</h2>
      <p className="relative mt-3 text-sm font-semibold leading-6 text-slate-600">{description}</p>

      <div className="relative mt-5 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-xs font-black text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-imetro-gold" />
            {item}
          </div>
        ))}
      </div>

      <div className="relative mt-5 rounded-2xl bg-slate-50 p-3">
        {rows.slice(0, 3).map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-200 py-1.5 last:border-0">
            <span className="text-[11px] font-bold text-slate-500">{label}</span>
            <span className="text-right text-[11px] font-black text-imetro-navy">{value}</span>
          </div>
        ))}
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-2">
        <button disabled={loading} onClick={() => openPrintableReport({ title, description, rows })} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-imetro-navy transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
          <FileText size={15} />
          PDF
        </button>
        <button disabled={loading} onClick={() => downloadCsv(`${report.id}.csv`, rows)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-imetro-navy px-3 py-2.5 text-xs font-black text-white shadow-[0_14px_34px_rgba(7,20,45,.18)] transition hover:bg-imetro-navySoft disabled:cursor-not-allowed disabled:opacity-50">
          <Download size={15} />
          Excel
        </button>
      </div>
    </div>
  );
}

function downloadCsv(fileName, rows) {
  const header = ['Indicador', 'Valor', 'Observação'];
  const lines = [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\n');
  const blob = new Blob([`\uFEFF${lines}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? '').replace(/"/g, '""');
  return `"${text}"`;
}

function openPrintableReport({ title, description, rows }) {
  const htmlRows = rows.map(([label, value, note]) => `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td>${escapeHtml(value)}</td>
      <td>${escapeHtml(note)}</td>
    </tr>
  `).join('');

  const html = `
    <!doctype html>
    <html lang="pt">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body{font-family:Arial,sans-serif;margin:32px;color:#10254a;background:#fff}
          .header{border-bottom:4px solid #d7a928;padding-bottom:18px;margin-bottom:24px}
          .brand{font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#64748b}
          h1{margin:8px 0 6px;font-size:26px;color:#061936}
          p{margin:0;color:#475569;font-size:13px;line-height:1.6}
          table{width:100%;border-collapse:collapse;margin-top:22px;font-size:12px}
          th{background:#061936;color:#fff;text-align:left;padding:12px;border:1px solid #061936}
          td{padding:11px;border:1px solid #dbe3ef;vertical-align:top}
          tr:nth-child(even) td{background:#f8fafc}
          .footer{margin-top:28px;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:14px}
          @media print{button{display:none}body{margin:18px}}
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">SecretáriaPay Académico · IMETRO · DCR</div>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(description || 'Relatório institucional')}</p>
          <p>Gerado em: ${new Date().toLocaleString('pt-AO')}</p>
        </div>
        <table>
          <thead><tr><th>Indicador</th><th>Valor</th><th>Observação</th></tr></thead>
          <tbody>${htmlRows}</tbody>
        </table>
        <div class="footer">Documento gerado pelo painel SecretáriaPay Académico para apoio à decisão da DCR.</div>
        <script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
      </body>
    </html>
  `;

  const reportWindow = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=780');
  if (!reportWindow) return;
  reportWindow.document.open();
  reportWindow.document.write(html);
  reportWindow.document.close();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
