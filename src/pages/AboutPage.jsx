import { CheckCircle2, Database, Globe2, LockKeyhole, MessageCircle, Server, ShieldCheck } from 'lucide-react';
import { env } from '../config/env.js';
import { appInfo } from '../config/appInfo.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import ClientNotice from '../components/ui/ClientNotice.jsx';

const stack = [
  ['Frontend', 'React + Vite + JavaScript + Tailwind'],
  ['Backend', 'Java 21 + Spring Boot + PostgreSQL + Flyway'],
  ['Produção API', env.apiBaseUrl],
  ['Painel', appInfo.frontendUrl],
  ['Cliente piloto', env.institutionName],
  ['Área responsável', env.dcrName]
];

export default function AboutPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Sistema institucional"
        title="Sobre o SecretáriaPay Académico"
        description="Visão geral do painel, módulos disponíveis, regras de segurança e estado da demonstração para o IMETRO."
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <section className="card p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-imetro-navy text-white">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Posicionamento</p>
              <h2 className="section-title">Plataforma institucional de gestão académico-financeira</h2>
              <p className="mt-2 text-xs leading-6 text-slate-600">
                O SecretáriaPay Académico não é apenas um robô de WhatsApp. É uma plataforma da TRIA Company para apoiar a DCR do IMETRO na automação de propinas, guias de pagamento, comprovativos, recibos, cobrança, importação WebSchool e atendimento institucional.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {appInfo.modules.map((module) => (
              <div key={module.name} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-black text-imetro-ink">{module.name}</h3>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase text-emerald-700">{module.status}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{module.description}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="card p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Versão</p>
            <h2 className="mt-1 text-2xl font-black text-imetro-ink">{appInfo.version}</h2>
            <p className="mt-1 text-xs text-slate-500">{appInfo.releaseName}</p>
            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              <p><strong>Ambiente:</strong> {appInfo.environmentLabel}</p>
              <p><strong>Atualização:</strong> {appInfo.updatedAt}</p>
            </div>
          </section>

          <ClientNotice>
            Este painel está pronto para demonstração controlada. Dados reais devem ser ativados somente com validação formal da universidade e revisão de permissões por perfil.
          </ClientNotice>

          <section className="card p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Stack técnica</p>
            <div className="mt-3 space-y-2">
              {stack.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-100 bg-white p-2">
                  <p className="text-[11px] font-black uppercase text-slate-400">{label}</p>
                  <p className="mt-0.5 break-words text-xs font-semibold text-slate-700">{value}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <section className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <LockKeyhole size={18} className="text-imetro-gold" />
          <h2 className="section-title">Regras de ouro do IMETRO/DCR</h2>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {appInfo.goldenRules.map((rule) => (
            <div key={rule} className="flex gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600">
              <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={16} />
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <InfoCard icon={Server} title="API" text="Conectada à produção" />
        <InfoCard icon={Database} title="Dados" text="PostgreSQL + Flyway" />
        <InfoCard icon={MessageCircle} title="WhatsApp" text="Webhook e envio real" />
        <InfoCard icon={Globe2} title="Painel" text="Vercel + domínio próprio" />
      </section>
    </div>
  );
}

function InfoCard({ icon: Icon, title, text }) {
  return (
    <div className="card p-3">
      <Icon size={18} className="text-imetro-gold" />
      <p className="mt-2 text-sm font-black text-imetro-ink">{title}</p>
      <p className="text-xs text-slate-500">{text}</p>
    </div>
  );
}
