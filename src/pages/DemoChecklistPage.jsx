import { CheckCircle2, ExternalLink, PlayCircle, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { env } from '../config/env.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import ClientNotice from '../components/ui/ClientNotice.jsx';

const demoSteps = [
  { title: 'Login institucional', route: '/login', goal: 'Entrar com utilizador autorizado e mostrar painel protegido.' },
  { title: 'Dashboard', route: '/dashboard', goal: 'Apresentar resumo de estudantes, cobranças, atrasos e operação.' },
  { title: 'Estudantes', route: '/students', goal: 'Pesquisar por matrícula, nome, telefone, WhatsApp ou e-mail.' },
  { title: 'Cobranças', route: '/charges', goal: 'Mostrar propinas, multas, guias PDF e situação de pagamento.' },
  { title: 'WhatsApp', route: '/whatsapp', goal: 'Mostrar guias enviadas, falhas, contactos e histórico multicanal.' },
  { title: 'Importações WebSchool', route: '/imports', goal: 'Mostrar staging, linhas importadas e sincronização com cadastro académico real.' },
  { title: 'Configurações DCR', route: '/settings', goal: 'Apresentar regras de multa, dívida, canais e formas de pagamento.' },
  { title: 'Sobre o sistema', route: '/about', goal: 'Fechar com escopo institucional e regras de segurança.' }
];

const validationPoints = [
  'Confirmar se as regras de multa da DCR estão corretas: dia 10, dia 15, 30 dias e 90 dias.',
  'Confirmar se as formas de pagamento exibidas na guia estão de acordo com o IMETRO.',
  'Confirmar os responsáveis que podem aprovar comprovativos e emitir recibos.',
  'Validar campos mínimos necessários para importação WebSchool.',
  'Validar regra de contacto oficial: WhatsApp, telefone e e-mail cadastrados.',
  'Definir perfis de acesso: DCR, secretaria, direção, tesouraria e administração.'
];

export default function DemoChecklistPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Apresentação ao cliente"
        title="Roteiro de demonstração IMETRO"
        description="Sequência recomendada para apresentar o painel aos responsáveis da faculdade com segurança e clareza."
      >
        <a className="btn-primary" href={env.apiBaseUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={15} className="mr-2" /> API produção
        </a>
      </PageHeader>

      <ClientNotice title="Importante para a reunião">
        Comece explicando que o SecretáriaPay Académico é uma plataforma institucional para DCR, secretaria académica e gestão financeira. O WhatsApp é apenas um dos canais integrados.
      </ClientNotice>

      <div className="grid gap-4 xl:grid-cols-[1fr_.75fr]">
        <section className="card p-4">
          <div className="mb-3 flex items-center gap-2">
            <PlayCircle size={18} className="text-imetro-gold" />
            <h2 className="section-title">Fluxo de apresentação</h2>
          </div>
          <div className="space-y-2">
            {demoSteps.map((step, index) => (
              <Link key={step.route} to={step.route} className="group block rounded-xl border border-slate-200 bg-white p-3 transition hover:border-imetro-gold hover:bg-amber-50/40">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-imetro-navy text-xs font-black text-white">{index + 1}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-black text-imetro-ink">{step.title}</h3>
                      <span className="text-[11px] font-bold text-imetro-gold group-hover:underline">Abrir</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{step.goal}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="card p-4">
            <div className="mb-3 flex items-center gap-2">
              <ShieldAlert size={18} className="text-imetro-gold" />
              <h2 className="section-title">Pontos para validação</h2>
            </div>
            <div className="space-y-2">
              {validationPoints.map((point) => (
                <div key={point} className="flex gap-2 rounded-lg bg-slate-50 p-2 text-xs leading-5 text-slate-600">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Mensagem de venda</p>
            <p className="mt-2 text-sm font-black leading-6 text-imetro-ink">
              Reduzir atrasos de pagamento, automatizar cobranças pelo WhatsApp e dar controlo institucional à DCR.
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              A demonstração deve mostrar controlo, rastreabilidade e segurança, não apenas conversa com robô.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
