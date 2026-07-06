import { BarChart3, Download, FileText, MessageCircle, ReceiptText } from 'lucide-react';

const reports = [
  {
    title: 'Relatório financeiro da DCR',
    description: 'Resumo de propinas, mensalidades vencidas, total em aberto e evolução mensal.',
    icon: BarChart3,
  },
  {
    title: 'Relatório de cobranças WhatsApp',
    description: 'Cobranças enviadas, estudantes sem contacto oficial, mensagens falhadas e reenviadas.',
    icon: MessageCircle,
  },
  {
    title: 'Relatório de comprovativos e recibos',
    description: 'Comprovativos pendentes, aprovados, rejeitados e recibos emitidos pela DCR.',
    icon: ReceiptText,
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-gradient-to-r from-[#061936] via-[#08285a] to-[#061936] p-7 text-white shadow-soft">
        <p className="text-sm font-bold uppercase tracking-[.14em] text-white/80">Relatórios institucionais</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Central de relatórios da DCR</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-white/82">
          Área preparada para exportação dos relatórios financeiros, académicos e operacionais do SecretáriaPay Académico.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {reports.map(({ title, description, icon: Icon }) => (
          <div key={title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_16px_46px_rgba(15,23,42,.06)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Icon size={30} />
            </div>
            <h2 className="mt-5 text-lg font-black text-imetro-navy">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            <button className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-imetro-navy transition hover:bg-slate-50">
              <Download size={17} />
              Preparar exportação
            </button>
          </div>
        ))}
      </section>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <div className="flex gap-3">
          <FileText className="mt-1" size={22} />
          <div>
            <p className="font-black">Observação da fase 8.3</p>
            <p className="mt-1 text-sm leading-6">
              Esta página está preparada para receber exportação PDF/Excel na próxima fase. O botão “Gerar relatório” do topo já aponta para esta central.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
