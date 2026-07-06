import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Download,
  FileSpreadsheet,
  FileText,
  MessageCircle,
  ReceiptText,
  ShieldCheck,
  Users,
  WalletCards,
} from 'lucide-react';

const reports = [
  {
    title: 'Relatório financeiro da DCR',
    description: 'Resumo de propinas, mensalidades vencidas, total em aberto, valores recebidos e evolução mensal.',
    icon: BarChart3,
    tone: 'blue',
    items: ['Total em aberto', 'Valores vencidos', 'Recebimentos do mês'],
  },
  {
    title: 'Relatório de cobranças WhatsApp',
    description: 'Cobranças enviadas, estudantes sem contacto oficial, mensagens falhadas e reenviadas.',
    icon: MessageCircle,
    tone: 'green',
    items: ['Guias enviadas', 'Falhas de contacto', 'Reenvios pendentes'],
  },
  {
    title: 'Relatório de comprovativos e recibos',
    description: 'Comprovativos pendentes, aprovados, rejeitados e recibos emitidos pela DCR.',
    icon: ReceiptText,
    tone: 'amber',
    items: ['Pendentes de validação', 'Aprovados', 'Recibos emitidos'],
  },
  {
    title: 'Relatório de estudantes inadimplentes',
    description: 'Lista operacional de estudantes com propinas vencidas, bloqueios e necessidade de contacto.',
    icon: Users,
    tone: 'red',
    items: ['Alunos em atraso', 'Bloqueios', 'Sem contacto oficial'],
  },
];

const quickStats = [
  { label: 'Financeiro', value: 'Mensal', description: 'Resumo executivo', icon: WalletCards, tone: 'bg-blue-50 text-blue-700' },
  { label: 'Cobranças', value: 'DCR', description: 'Operação diária', icon: CalendarDays, tone: 'bg-amber-50 text-amber-700' },
  { label: 'WhatsApp', value: 'Envios', description: 'Mensagens e guias', icon: MessageCircle, tone: 'bg-emerald-50 text-emerald-700' },
  { label: 'Auditoria', value: 'Manual', description: 'Validação e recibos', icon: ShieldCheck, tone: 'bg-red-50 text-red-700' },
];

export default function ReportsPage() {
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
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/78 sm:text-base">
              Área preparada para exportação dos relatórios financeiros, académicos e operacionais do SecretáriaPay Académico.
            </p>
          </div>
          <button className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white shadow-[0_16px_44px_rgba(0,0,0,.12)] transition hover:bg-white/15">
            <Download size={17} />
            Preparar exportação geral
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickStats.map(({ label, value, description, icon: Icon, tone }) => (
          <div key={label} className="card-premium p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-black text-imetro-navy">{value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{description}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${tone}`}>
                <Icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
        {reports.map(({ title, description, icon: Icon, tone, items }) => (
          <ReportCard key={title} title={title} description={description} icon={Icon} tone={tone} items={items} />
        ))}
      </section>

      <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 text-amber-900 shadow-[0_16px_46px_rgba(15,23,42,.05)]">
        <div className="flex gap-3">
          <AlertTriangle className="mt-1 shrink-0 text-amber-600" size={22} />
          <div>
            <p className="font-black">Observação operacional</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              Esta página mantém a rota atual e está pronta para receber exportação PDF/Excel. O botão “Gerar relatório” do topo continua apontando para esta central.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ title, description, icon: Icon, tone, items }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    red: 'bg-red-50 text-red-700 ring-red-100',
  };

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,.07)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,.10)]">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-300/20 blur-2xl" />
      <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ring-1 ${tones[tone] || tones.blue}`}>
        <Icon size={28} />
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

      <div className="relative mt-5 grid grid-cols-2 gap-2">
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-imetro-navy transition hover:bg-slate-50">
          <FileText size={15} />
          PDF
        </button>
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-imetro-navy px-3 py-2.5 text-xs font-black text-white shadow-[0_14px_34px_rgba(7,20,45,.18)] transition hover:bg-imetro-navySoft">
          <Download size={15} />
          Excel
        </button>
      </div>
    </div>
  );
}
