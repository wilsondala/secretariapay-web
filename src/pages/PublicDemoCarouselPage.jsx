import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  Landmark,
  LockKeyhole,
  MessageCircle,
  MonitorSmartphone,
  QrCode,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Users,
  WalletCards,
} from 'lucide-react';

const slides = [
  {
    eyebrow: 'Demonstração institucional',
    title: 'SecretáriaPay Académico para o IMETRO',
    subtitle: 'Automação de propinas, guias, comprovativos, recibos e atendimento académico-financeiro pelo WhatsApp.',
    icon: GraduationCap,
    accent: 'from-emerald-500 to-cyan-500',
    bullets: [
      'Cliente piloto: Instituto Superior Politécnico Metropolitano de Angola (IMETRO).',
      'Área principal: DCR — Divisão de Cobranças e Recebimentos.',
      'Canal principal: WhatsApp integrado ao painel administrativo.',
    ],
    note: 'Objetivo da apresentação: mostrar como o IMETRO ganha controlo financeiro, agilidade no atendimento e segurança operacional.',
  },
  {
    eyebrow: 'Problema real',
    title: 'O desafio actual da cobrança académica',
    subtitle: 'Alunos solicitam informação por múltiplos canais, a DCR valida manualmente, e a instituição precisa de rastreabilidade.',
    icon: ClipboardCheck,
    accent: 'from-amber-500 to-orange-500',
    bullets: [
      'Pedidos de propina, recibos e comprovativos chegam em grande volume.',
      'Informações financeiras exigem segurança e confirmação com dados oficiais.',
      'Atrasos, multas e bloqueios académicos precisam de regra clara e registada.',
    ],
    note: 'O sistema reduz retrabalho sem retirar a validação institucional da DCR.',
  },
  {
    eyebrow: 'Solução',
    title: 'Uma plataforma, não apenas um robô',
    subtitle: 'O SecretáriaPay organiza o fluxo académico-financeiro completo: estudante, cobrança, guia, comprovativo, recibo e histórico.',
    icon: MonitorSmartphone,
    accent: 'from-blue-600 to-indigo-600',
    bullets: [
      'Painel web para responsáveis da faculdade.',
      'Robô WhatsApp personalizado para o IMETRO.',
      'Base académica integrada com estudantes, cursos, turmas e ano académico.',
    ],
    note: 'A proposta é dar controlo institucional e não depender de conversas soltas no WhatsApp.',
  },
  {
    eyebrow: 'Regra de ouro',
    title: 'Segurança dos dados do estudante',
    subtitle: 'Mesmo que alguém peça de outro telefone, o sistema só envia informação financeira para contactos oficialmente cadastrados.',
    icon: ShieldCheck,
    accent: 'from-slate-700 to-slate-950',
    bullets: [
      'Busca por número de estudante, e-mail, telefone ou WhatsApp cadastrado.',
      'Guia, recibo e situação financeira só vão para contacto oficial.',
      'Protege aluno, DCR e instituição contra vazamento de dados.',
    ],
    note: 'Esta regra foi aplicada no fluxo WhatsApp e deve ser mantida como política institucional do IMETRO.',
  },
  {
    eyebrow: 'Atendimento WhatsApp',
    title: 'Robô IMETRO/DCR com fluxo real',
    subtitle: 'O aluno consegue consultar propina, receber guia, ver atrasos, enviar comprovativo e solicitar recibo.',
    icon: Bot,
    accent: 'from-green-500 to-emerald-700',
    bullets: [
      'Menu em português com linguagem institucional do IMETRO.',
      'Encerramento do atendimento por opção 0.',
      'Consequências do atraso explicadas de forma clara.',
    ],
    note: 'O robô não confirma pagamento automaticamente: comprovativos ficam pendentes de validação manual da DCR.',
  },
  {
    eyebrow: 'Propinas e guias',
    title: 'Geração e envio de guias de pagamento',
    subtitle: 'A DCR pode gerar propinas reais e enviar a guia em PDF pelo WhatsApp, e-mail ou SMS/link.',
    icon: QrCode,
    accent: 'from-cyan-500 to-blue-600',
    bullets: [
      'Cobranças por estudante, mês, curso, turma e ano académico.',
      'PDF com dados do IMETRO, cobrança, vencimento e valor.',
      'Idempotência: o sistema evita duplicar cobranças e envios.',
    ],
    note: 'O aluno recebe orientação de pagamento e a DCR mantém o histórico de envio.',
  },
  {
    eyebrow: 'Multas e atraso',
    title: 'Política DCR configurada',
    subtitle: 'O painel apresenta regras de multa, dívida, inadimplência e restrição académica de forma operacional.',
    icon: WalletCards,
    accent: 'from-red-500 to-rose-700',
    bullets: [
      'Até ao dia 10: sem multa.',
      'Após o dia 10: multa de 20%; após o dia 15: multa de 30%.',
      'Após 30 dias: dívida; após 90 dias: inadimplência.',
    ],
    note: 'As regras podem ser exibidas ao aluno e usadas pela equipa financeira no painel.',
  },
  {
    eyebrow: 'Comprovativos e recibos',
    title: 'Validação manual com rastreabilidade',
    subtitle: 'O estudante envia o comprovativo; a DCR analisa, aprova ou rejeita; recibo só sai após validação.',
    icon: ReceiptText,
    accent: 'from-purple-500 to-violet-700',
    bullets: [
      'Comprovativos ficam pendentes de análise.',
      'Aprovação e rejeição com observação da DCR.',
      'Recibo institucional digital após confirmação.',
    ],
    note: 'O sistema respeita o controlo interno: automação no atendimento, decisão final pela DCR.',
  },
  {
    eyebrow: 'WebSchool / dados académicos',
    title: 'Sincronização com cadastro real',
    subtitle: 'O staging WebSchool pode ser ligado aos estudantes, cursos e turmas reais do cadastro académico.',
    icon: RefreshCw,
    accent: 'from-teal-500 to-lime-600',
    bullets: [
      'Importação por lote, linhas válidas e inválidas.',
      'Sincronização com students, courses e academic_classes.',
      'Relatório de estudantes criados, atualizados ou reutilizados.',
    ],
    note: 'Essa camada facilita a entrada do sistema na realidade operacional da faculdade.',
  },
  {
    eyebrow: 'Painel administrativo',
    title: 'Visão para responsáveis da faculdade',
    subtitle: 'O painel reúne dashboard, estudantes, cobranças, comprovativos, recibos, WhatsApp, importações e configurações.',
    icon: BarChart3,
    accent: 'from-sky-500 to-indigo-700',
    bullets: [
      'Dashboard com indicadores financeiros e académicos.',
      'Busca por matrícula, nome, telefone, WhatsApp e e-mail.',
      'Histórico de mensagens, guias enviadas e falhas de contacto.',
    ],
    note: 'A equipa deixa de depender apenas de planilhas e passa a gerir o fluxo por evidência.',
  },
  {
    eyebrow: 'Benefícios esperados',
    title: 'Impacto para o IMETRO',
    subtitle: 'Menos atraso, menos fila, menos retrabalho e mais controlo sobre a vida financeira académica.',
    icon: CheckCircle2,
    accent: 'from-emerald-600 to-green-800',
    bullets: [
      'Redução de solicitações repetitivas na secretaria/DCR.',
      'Maior velocidade no envio de guias e orientação ao estudante.',
      'Rastreabilidade de cobranças, comprovativos, recibos e mensagens.',
    ],
    note: 'O SecretáriaPay melhora atendimento sem perder segurança institucional.',
  },
  {
    eyebrow: 'Próximos passos',
    title: 'Validação controlada com o cliente',
    subtitle: 'A próxima etapa é apresentar o fluxo, recolher observações da equipa IMETRO e ajustar antes de escalar.',
    icon: Landmark,
    accent: 'from-zinc-700 to-black',
    bullets: [
      'Validar linguagem, regras DCR e formatos de guia/recibo.',
      'Confirmar serviços cobrados e formas de pagamento oficiais.',
      'Definir utilizadores, perfis de acesso e operação piloto.',
    ],
    note: 'A demonstração deve ser feita com dados controlados e números de teste autorizados.',
  },
];

const quickModules = [
  { label: 'WhatsApp', value: 'Atendimento e envio de guias', icon: MessageCircle },
  { label: 'DCR', value: 'Validação de pagamentos', icon: LockKeyhole },
  { label: 'Estudantes', value: 'Cadastro e situação financeira', icon: Users },
  { label: 'Painel', value: 'Indicadores e rastreabilidade', icon: BarChart3 },
];

export default function PublicDemoCarouselPage() {
  const [current, setCurrent] = useState(0);
  const activeSlide = slides[current];
  const Icon = activeSlide.icon;

  const progress = useMemo(() => Math.round(((current + 1) / slides.length) * 100), [current]);

  const goNext = () => setCurrent((index) => (index + 1) % slides.length);
  const goPrevious = () => setCurrent((index) => (index - 1 + slides.length) % slides.length);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'ArrowLeft') goPrevious();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-blue-700/20 blur-3xl" />
      </div>

      <section className="relative z-10 flex min-h-screen flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mx-auto flex w-full max-w-7xl flex-col gap-3 rounded-3xl border border-white/10 bg-white/8 px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-lg">
              <GraduationCap size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">SecretáriaPay Académico</p>
              <h1 className="text-sm font-bold sm:text-base">Demonstração pública IMETRO/DCR</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">Instituto Superior Politécnico Metropolitano de Angola</span>
            <a
              href="/login"
              className="rounded-full bg-emerald-400 px-3 py-1 font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Entrar no painel
            </a>
          </div>
        </header>

        <div className="mx-auto grid w-full max-w-7xl flex-1 gap-5 py-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
          <article className="relative flex min-h-[560px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-white text-slate-950 shadow-2xl shadow-black/30">
            <div className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${activeSlide.accent}`} />

            <div className="grid flex-1 gap-6 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:p-10">
              <div className="flex flex-col justify-center">
                <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {activeSlide.eyebrow}
                </div>

                <h2 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  {activeSlide.title}
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                  {activeSlide.subtitle}
                </p>

                <div className="mt-7 grid gap-3">
                  {activeSlide.bullets.map((bullet) => (
                    <div key={bullet} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="flex flex-col justify-center gap-4">
                <div className={`rounded-[2rem] bg-gradient-to-br ${activeSlide.accent} p-5 text-white shadow-xl`}>
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur">
                    <Icon size={42} />
                  </div>
                  <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Ponto-chave</p>
                  <p className="mt-2 text-lg font-bold leading-7">{activeSlide.note}</p>
                </div>

                <div className="grid gap-2 rounded-[2rem] border border-slate-100 bg-slate-50 p-4">
                  {quickModules.map((item) => {
                    const ModuleIcon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-sm">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                          <ModuleIcon size={17} />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
                          <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </aside>
            </div>

            <footer className="border-t border-slate-100 bg-slate-50 px-6 py-4 md:px-8 lg:px-10">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={goPrevious}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
                    aria-label="Slide anterior"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white shadow-sm transition hover:bg-slate-800"
                    aria-label="Próximo slide"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <span className="text-sm font-semibold text-slate-600">
                    Slide {current + 1} de {slides.length}
                  </span>
                </div>

                <div className="w-full max-w-sm">
                  <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500">
                    <span>Progresso</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className={`h-full rounded-full bg-gradient-to-r ${activeSlide.accent}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            </footer>
          </article>

          <aside className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Roteiro</p>
              <h3 className="mt-2 text-xl font-black">Apresentação ao cliente</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Use as setas do teclado ou os botões para navegar. Esta página é pública e não exige login.
              </p>
            </div>

            <div className="grid flex-1 gap-2 overflow-auto pr-1">
              {slides.map((slide, index) => {
                const SlideIcon = slide.icon;
                const active = index === current;
                return (
                  <button
                    key={slide.title}
                    type="button"
                    onClick={() => setCurrent(index)}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                      active
                        ? 'border-emerald-300 bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/20'
                        : 'border-white/10 bg-white/8 text-slate-200 hover:bg-white/14'
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-slate-950 text-white' : 'bg-white/10 text-emerald-200'}`}>
                      <SlideIcon size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{String(index + 1).padStart(2, '0')} · {slide.eyebrow}</p>
                      <p className="truncate text-sm font-bold">{slide.title}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={goPrevious}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-sm font-bold text-white transition hover:bg-white/15"
              >
                <ArrowLeft size={16} /> Anterior
              </button>
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-3 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
              >
                Próximo <ArrowRight size={16} />
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
