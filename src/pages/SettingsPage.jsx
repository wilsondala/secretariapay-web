import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Mail,
  MessageCircle,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { evaluateDcrPolicy, getSettingsOverview } from '../services/settingsService.js';
import { INSTITUTION_ID, formatMoney, normalizeText, safeText } from '../utils/formatters.js';

const TABS = [
  { key: 'dcr', label: 'Regras DCR' },
  { key: 'services', label: 'Serviços' },
  { key: 'channels', label: 'Canais' },
  { key: 'security', label: 'Segurança' },
];

const channelIcons = {
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
  SMS: Smartphone,
  PDF: WalletCards,
};

export default function SettingsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dcr');
  const [serviceSearch, setServiceSearch] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [evalForm, setEvalForm] = useState({ baseAmount: 45000, dueDate: '2026-07-01', referenceDate: '2026-07-15' });
  const [evaluating, setEvaluating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const overview = await getSettingsOverview(INSTITUTION_ID);
      setData(overview);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Falha ao carregar configurações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const services = useMemo(() => data?.services || [], [data]);
  const filteredServices = useMemo(() => {
    const term = normalizeText(serviceSearch);
    return services.filter((service) => {
      const text = normalizeText([
        service.serviceCode || service.service_code || service.code,
        service.serviceName || service.service_name || service.name,
        service.serviceCategory || service.service_category || service.category,
        service.chargeType || service.charge_type,
      ].join(' '));
      return !term || text.includes(term);
    });
  }, [services, serviceSearch]);

  const stats = useMemo(() => {
    const serviceList = data?.services || [];
    const activeServices = serviceList.filter((item) => item.active !== false);
    const dcrRequired = serviceList.filter((item) => item.requiresDcrValidation || item.requires_dcr_validation).length;
    return {
      services: serviceList.length,
      activeServices: activeServices.length,
      dcrRequired,
      channels: data?.channels?.length || 0,
    };
  }, [data]);

  const handleEvaluate = async (event) => {
    event.preventDefault();
    setEvaluating(true);
    try {
      const result = await evaluateDcrPolicy(INSTITUTION_ID, evalForm);
      setEvaluation(result);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) return <LoadingState message="Carregando configurações DCR/IMETRO..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const institution = data?.institution || {};
  const policy = data?.dcrPolicy || {};

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[.35em] text-imetro-gold">Configurações · IMETRO</p>
          <h1 className="page-title mt-2">Configurações IMETRO/DCR</h1>
          <p className="page-subtitle">Regras DCR, pagamentos, canais oficiais e segurança operacional.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={load}>
            <RefreshCw size={16} className="mr-2" />
            Atualizar
          </button>
          <button className="btn-primary" type="button" title="Edição será liberada em fase posterior">
            <Save size={16} className="mr-2" />
            Guardar alterações
          </button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Serviços configurados" value={stats.services} description={`${stats.activeServices} ativos`} icon={Settings} />
        <StatCard title="Validação DCR" value={stats.dcrRequired} description="Serviços com validação manual" icon={ShieldCheck} tone="success" />
        <StatCard title="Multa principal" value={`${Number(policy.secondPenaltyPercent || policy.second_penalty_percent || 30)}%`} description="Após o dia 15" icon={AlertTriangle} tone="warning" />
        <StatCard title="Canais" value={stats.channels} description="WhatsApp, e-mail, SMS e PDF" icon={MessageCircle} tone="gold" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
        <InstitutionCard institution={institution} />
        <DcrPolicyCard policy={policy} />
      </section>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${activeTab === tab.key ? 'bg-imetro-navy text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'dcr' && (
            <DcrTab
              policy={policy}
              evalForm={evalForm}
              setEvalForm={setEvalForm}
              onEvaluate={handleEvaluate}
              evaluation={evaluation}
              evaluating={evaluating}
            />
          )}

          {activeTab === 'services' && (
            <ServicesTab
              services={filteredServices}
              search={serviceSearch}
              setSearch={setServiceSearch}
            />
          )}

          {activeTab === 'channels' && (
            <ChannelsTab
              channels={data?.channels || []}
              paymentMethods={data?.paymentMethods || []}
            />
          )}

          {activeTab === 'security' && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}

function InstitutionCard({ institution }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.25em] text-slate-400">Instituição</p>
          <h2 className="mt-2 text-base font-black text-imetro-ink">{safeText(institution.name, 'Instituto Superior Politécnico Metropolitano de Angola')}</h2>
          <p className="mt-1 text-sm font-semibold text-imetro-gold">{safeText(institution.acronym || institution.shortName, 'IMETRO')}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-imetro-navy text-white">
          <Building2 size={25} />
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        <Info label="Unidade" value={institution.unit || 'DCR — Divisão de Cobranças e Recebimentos'} />
        <Info label="Moeda" value={institution.currency || 'AOA'} />
        <Info label="E-mail DCR" value={institution.officialEmail || 'dcr_pay@imetroangola.com'} />
        <Info label="Cópia institucional" value={institution.ccEmail || 'df.oi_pay@imetroangola.com'} />
        <Info label="Cidade" value={institution.city || 'Luanda'} />
        <Info label="País" value={institution.country || 'Angola'} />
      </div>
    </div>
  );
}

function DcrPolicyCard({ policy }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.25em] text-slate-400">Política financeira</p>
          <h2 className="mt-2 text-base font-black text-imetro-ink">{policy.policyName || policy.policy_name || 'Política DCR IMETRO 2026'}</h2>
          <p className="mt-2 text-sm text-slate-500">Código: <strong className="text-imetro-ink">{policy.policyCode || policy.policy_code || 'IMETRO_DCR_2026'}</strong></p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <CheckCircle2 size={25} />
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Rule label="Sem multa" value={`Até dia ${policy.noPenaltyUntilDay || policy.no_penalty_until_day || 10}`} />
        <Rule label="1ª multa" value={`${policy.firstPenaltyPercent || policy.first_penalty_percent || 20}% após dia ${policy.firstPenaltyStartDay || policy.first_penalty_start_day || 11}`} tone="warning" />
        <Rule label="2ª multa" value={`${policy.secondPenaltyPercent || policy.second_penalty_percent || 30}% após dia ${policy.secondPenaltyStartDay || policy.second_penalty_start_day || 15}`} tone="danger" />
        <Rule label="Dívida" value={`Após ${policy.debtAfterDays || policy.debt_after_days || 30} dias`} />
        <Rule label="Inadimplência" value={`Após ${policy.delinquencyAfterDays || policy.delinquency_after_days || 90} dias`} tone="danger" />
        <Rule label="WhatsApp" value={`${policy.whatsappAllowedStart || policy.whatsapp_allowed_start || '07:00'} às ${policy.whatsappAllowedEnd || policy.whatsapp_allowed_end || '19:00'}`} />
      </div>
    </div>
  );
}

function DcrTab({ policy, evalForm, setEvalForm, onEvaluate, evaluation, evaluating }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_.9fr]">
      <div className="rounded-xl bg-slate-50 p-4">
        <h3 className="text-base font-black text-imetro-ink">Regras operacionais da DCR</h3>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <p>• A propina é considerada em janela normal até ao dia {policy.noPenaltyUntilDay || 10}.</p>
          <p>• Após o dia {policy.firstPenaltyStartDay || 11}, aplica-se multa de {policy.firstPenaltyPercent || 20}%.</p>
          <p>• Após o dia {policy.secondPenaltyStartDay || 15}, aplica-se multa de {policy.secondPenaltyPercent || 30}%.</p>
          <p>• Após {policy.debtAfterDays || 30} dias, a pendência passa a dívida.</p>
          <p>• Após {policy.delinquencyAfterDays || 90} dias, o estudante pode ser classificado como inadimplente.</p>
          <p>• O recibo institucional só é emitido após validação manual da DCR.</p>
        </div>
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          Regra de ouro: guias, recibos e informações financeiras devem ser enviados apenas para os contactos oficiais cadastrados no IMETRO.
        </div>
      </div>

      <form onSubmit={onEvaluate} className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-black text-imetro-ink">Simular regra DCR</h3>
        <div className="mt-3 grid gap-3">
          <label>
            <span className="label">Valor base</span>
            <input className="input" type="number" value={evalForm.baseAmount} onChange={(e) => setEvalForm((prev) => ({ ...prev, baseAmount: e.target.value }))} />
          </label>
          <label>
            <span className="label">Vencimento</span>
            <input className="input" type="date" value={evalForm.dueDate} onChange={(e) => setEvalForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
          </label>
          <label>
            <span className="label">Data de referência</span>
            <input className="input" type="date" value={evalForm.referenceDate} onChange={(e) => setEvalForm((prev) => ({ ...prev, referenceDate: e.target.value }))} />
          </label>
          <button className="btn-primary" disabled={evaluating}>
            <CalendarClock size={16} className="mr-2" />
            {evaluating ? 'A calcular...' : 'Calcular multa'}
          </button>
        </div>

        {evaluation && (
          <div className="mt-5 rounded-xl bg-imetro-navy p-4 text-white">
            <p className="text-sm text-white/60">Resultado</p>
            <p className="mt-2 text-base font-black">{formatMoney(evaluation.totalAmount || evaluation.total_amount, evaluation.currency || 'AOA')}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <span>Base: <strong>{formatMoney(evaluation.baseAmount || evaluation.base_amount, evaluation.currency || 'AOA')}</strong></span>
              <span>Multa: <strong>{formatMoney(evaluation.penaltyAmount || evaluation.penalty_amount, evaluation.currency || 'AOA')}</strong></span>
              <span>Percentual: <strong>{Number(evaluation.penaltyPercent || evaluation.penalty_percent || 0)}%</strong></span>
              <span>Status: <strong>{evaluation.status || '-'}</strong></span>
            </div>
            <p className="mt-3 text-sm text-white/75">{evaluation.message || 'Regra avaliada.'}</p>
          </div>
        )}
      </form>
    </div>
  );
}

function ServicesTab({ services, search, setSearch }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-base font-black text-imetro-ink">Catálogo de serviços cobrados</h3>
          <p className="text-sm text-slate-500">Serviços que podem gerar cobrança e exigem validação DCR.</p>
        </div>
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input className="input pl-10" placeholder="Buscar serviço, código ou categoria..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Serviço</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Cobrança</th>
              <th className="px-4 py-3">Moeda</th>
              <th className="px-4 py-3">DCR</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map((service) => (
              <tr key={service.id || service.serviceCode || service.service_code || service.code} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-black text-imetro-ink">{service.serviceCode || service.service_code || service.code}</td>
                <td className="px-4 py-3 text-slate-700">{service.serviceName || service.service_name || service.name}</td>
                <td className="px-4 py-3 text-slate-500">{service.serviceCategory || service.service_category || service.category}</td>
                <td className="px-4 py-3 text-slate-500">{service.chargeType || service.charge_type || '-'}</td>
                <td className="px-4 py-3 font-semibold text-slate-700">{service.currency || 'AOA'}</td>
                <td className="px-4 py-3"><StatusBadge status={(service.requiresDcrValidation || service.requires_dcr_validation) ? 'PENDING_REVIEW' : 'ACTIVE'} /></td>
                <td className="px-4 py-3"><StatusBadge status={service.active === false ? 'CANCELLED' : 'ACTIVE'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChannelsTab({ channels, paymentMethods }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
      <div>
        <h3 className="text-base font-black text-imetro-ink">Canais de comunicação</h3>
        <div className="mt-4 grid gap-3">
          {channels.map((channel) => {
            const Icon = channelIcons[channel.code] || MessageCircle;
            return (
              <div key={channel.code || channel.name} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-imetro-navy text-white"><Icon size={20} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-black text-imetro-ink">{channel.name}</h4>
                      <StatusBadge status={channel.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING'} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{channel.description}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-wide text-imetro-gold">{channel.mode}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-base font-black text-imetro-ink">Formas de pagamento</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {paymentMethods.map((method) => (
            <div key={method.code || method.name} className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-imetro-ink">{method.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{method.description || 'Forma de pagamento habilitada.'}</p>
                </div>
                <Banknote className="text-imetro-gold" size={20} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SecurityTab() {
  const rules = [
    'Informação financeira só pode ser enviada para WhatsApp, telefone ou e-mail cadastrados oficialmente no IMETRO.',
    'Pedido feito por contacto não cadastrado não deve expor valor, dívida, recibo ou guia no número solicitante.',
    'Comprovativo recebido pelo robô fica pendente de validação manual da DCR.',
    'Recibo institucional só é emitido após aprovação da DCR.',
    'Envio de guias respeita janela institucional de comunicação, preferencialmente das 07h às 19h.',
    'Dados de produção, tokens e backups .env não devem ser versionados no GitHub.',
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
      <div className="rounded-xl bg-imetro-navy p-4 text-white">
        <ShieldCheck size={32} className="text-imetro-gold" />
        <h3 className="mt-4 text-base font-black">Regra de ouro SecretáriaPay</h3>
        <p className="mt-3 text-sm leading-6 text-white/75">O sistema deve proteger os dados financeiros dos estudantes e manter a DCR como autoridade final para validação de pagamento, emissão de recibo e regularização académica.</p>
      </div>
      <div className="space-y-3">
        {rules.map((rule) => (
          <div key={rule} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} />
            <p className="text-sm font-medium leading-6 text-slate-600">{rule}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-imetro-ink">{safeText(value)}</p>
    </div>
  );
}

function Rule({ label, value, tone = 'navy' }) {
  const classes = {
    navy: 'bg-slate-50 text-imetro-ink',
    warning: 'bg-amber-50 text-amber-800',
    danger: 'bg-red-50 text-red-700',
  };
  return (
    <div className={`rounded-xl p-4 ${classes[tone]}`}>
      <p className="text-xs font-black uppercase tracking-wide opacity-60">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}
