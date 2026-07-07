import {
  Banknote,
  BarChart3,
  Check,
  FileCheck2,
  FileText,
  GraduationCap,
  HelpCircle,
  LockKeyhole,
  MessageCircle,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  UploadCloud,
  Users,
  WalletCards,
} from 'lucide-react';
import { env } from '../config/env.js';

const whatsappNumber = import.meta.env.VITE_SECRETARIA_WHATSAPP || '244930123456';
const whatsappText = encodeURIComponent('Olá, Secretaria. Quero solicitar a minha guia de pagamento pelo SecretáriaPay Académico.');
const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;
const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(whatsappUrl)}`;

const features = [
  {
    icon: GraduationCap,
    title: 'Cobranças inteligentes',
    text: 'Avisos automáticos antes do vencimento, no vencimento e após atraso.',
  },
  {
    icon: FileText,
    title: 'Guias e pagamentos',
    text: 'Emissão de guias com referência para múltiplos meios de pagamento.',
  },
  {
    icon: ShieldCheck,
    title: 'Comprovativos e recibos',
    text: 'Envie comprovativos pelo WhatsApp e receba o seu recibo digital.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios financeiros',
    text: 'Dashboards e relatórios que dão visão clara da situação financeira.',
  },
  {
    icon: LockKeyhole,
    title: 'Segurança e auditoria',
    text: 'Dados protegidos, ações registadas e permissões por perfil.',
  },
  {
    icon: Users,
    title: 'Atendimento humano',
    text: 'Atendimento rápido e humanizado sempre que você precisar.',
  },
];

const steps = [
  { icon: MessageCircle, title: 'Fale connosco', text: 'Chame a Secretaria pelo WhatsApp e informe a sua solicitação.' },
  { icon: ReceiptText, title: 'Receba sua guia', text: 'Receba a guia com valor atualizado e referência para pagamento.' },
  { icon: WalletCards, title: 'Realize o pagamento', text: 'Efetue o pagamento pelo meio que for mais conveniente.' },
  { icon: UploadCloud, title: 'Envie o comprovativo', text: 'Envie o comprovativo pelo WhatsApp de forma simples e segura.' },
  { icon: ShieldCheck, title: 'Confirmação e recibo', text: 'Após confirmação, enviamos o recibo digital e a regularização.' },
];

const paymentMethods = [
  { icon: Smartphone, title: 'Multicaixa Express', text: 'Pagamento seguro e rápido.' },
  { icon: FileCheck2, title: 'Pagamento por Referência', text: 'Pague em bancos parceiros.' },
  { icon: Banknote, title: 'Transferência bancária', text: 'Envie o comprovativo para confirmação.' },
  { icon: WalletCards, title: 'Unitel Money / Afrimoney', text: 'Integração em desenvolvimento.' },
  { icon: HelpCircle, title: 'Outros meios', text: 'Novas opções em breve.' },
];

export default function PublicHomePage() {
  return (
    <div className="min-h-screen bg-white text-[#061936]">
      <header className="relative overflow-hidden bg-[#061936] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#061936] via-[#08285A] to-[#030b18]" />
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.15)_1px,transparent_0)] [background-size:22px_22px]" />
          <div className="absolute right-0 top-8 hidden h-[34rem] w-[54rem] rounded-l-[9rem] border border-white/10 bg-white/5 lg:block" />
          <div className="absolute -right-20 bottom-8 h-72 w-72 rounded-full border-[18px] border-imetro-gold/75" />
          <div className="absolute -right-28 bottom-2 h-72 w-72 rounded-full border-[18px] border-emerald-600/70" />
          <div className="absolute inset-x-0 bottom-[-1px] h-20 rounded-t-[55%] bg-white" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-8 sm:px-7 lg:px-8 lg:pb-28">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <LogoMark />
            <div className="flex flex-wrap items-center gap-3 text-sm font-black text-white/85">
              <span className="rounded-full bg-emerald-500 p-3 text-white shadow-[0_18px_40px_rgba(16,185,129,.28)]">
                <MessageCircle size={22} />
              </span>
              <div className="rounded-3xl border border-white/15 bg-white/10 px-4 py-3 shadow-[0_16px_44px_rgba(0,0,0,.12)] backdrop-blur">
                <p className="text-sm font-black">QR Code WhatsApp</p>
                <p className="text-xs font-semibold text-white/70">Peça seu boleto ou guia</p>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <section>
              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Gestão inteligente de pagamentos <span className="text-imetro-gold">académicos</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-white/82 sm:text-lg">
                O SecretáriaPay centraliza propinas, guias, comprovativos, cobranças e atendimento financeiro do IMETRO em uma plataforma segura, simples e eficiente.
              </p>
              <div className="mt-7 inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white/90 ring-1 ring-white/15">
                <ShieldCheck className="text-imetro-gold" size={22} />
                {env.institutionName} ({env.institutionShortName})
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_.9fr]">
              <div className="rounded-[2rem] border border-white/20 bg-white/10 p-6 shadow-[0_28px_90px_rgba(0,0,0,.18)] backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg">
                    <MessageCircle size={26} />
                  </span>
                  <h2 className="text-xl font-black">Atendimento via WhatsApp</h2>
                </div>
                <p className="mt-4 text-sm font-semibold leading-6 text-white/80">Fale connosco de forma rápida, prática e segura.</p>
                <ul className="mt-5 space-y-3 text-sm font-semibold text-white/88">
                  {['Guias de pagamento', 'Dúvidas sobre pagamentos', 'Comprovativos e recibos', 'Informações financeiras', 'Avisos e vencimentos'].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <Check size={18} className="text-emerald-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-4 text-base font-black text-white shadow-[0_18px_45px_rgba(16,185,129,.25)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(16,185,129,.32)]">
                  <MessageCircle size={24} />
                  Falar com a Secretaria
                </a>
              </div>

              <div className="rounded-[2rem] border border-white/20 bg-white/10 p-6 text-center shadow-[0_28px_90px_rgba(0,0,0,.18)] backdrop-blur-xl">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg">
                  <MessageCircle size={26} />
                </div>
                <h2 className="mt-3 text-xl font-black">QR Code WhatsApp</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/80">Aponte a câmara do seu celular e fale com a Secretaria.</p>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mx-auto mt-4 block w-full max-w-[230px] rounded-3xl bg-white p-3 shadow-[0_18px_50px_rgba(0,0,0,.25)]">
                  <img src={qrCodeUrl} alt="QR Code WhatsApp SecretariaPay" className="h-auto w-full rounded-2xl" />
                </a>
                <p className="mt-3 text-sm font-black leading-5 text-white">Peça o seu boleto ou a sua guia de pagamento</p>
              </div>
            </section>
          </div>
        </div>
      </header>

      <main className="relative -mt-10 bg-white">
        <section className="mx-auto max-w-7xl px-5 py-8 text-center sm:px-7 lg:px-8">
          <h2 className="text-3xl font-black tracking-tight text-[#061936]">Bem-vindo ao SecretáriaPay Académico</h2>
          <p className="mx-auto mt-3 max-w-3xl text-base font-medium leading-7 text-slate-600">
            Uma solução desenvolvida para simplificar a vida financeira dos estudantes e modernizar a gestão académica do IMETRO.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {features.map((feature) => <FeatureCard key={feature.title} {...feature} />)}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-6 sm:px-7 lg:px-8">
          <h2 className="text-center text-3xl font-black tracking-tight text-[#061936]">Como funciona?</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-5">
            {steps.map((step, index) => <StepCard key={step.title} step={step} number={index + 1} />)}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-6 sm:px-7 lg:px-8">
          <h2 className="text-center text-3xl font-black tracking-tight text-[#061936]">Formas de pagamento</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {paymentMethods.map((method) => <PaymentCard key={method.title} {...method} />)}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-7 lg:px-8">
          <div className="grid items-center gap-5 rounded-[2rem] bg-gradient-to-r from-[#061936] via-[#08285A] to-emerald-700 p-6 text-white shadow-[0_28px_80px_rgba(7,20,45,.20)] md:grid-cols-[auto_1fr_auto] md:p-8">
            <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white text-emerald-500 shadow-xl">
              <MessageCircle size={58} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">Fale agora com a Secretaria <span className="block text-emerald-300">pelo WhatsApp</span></h2>
              <p className="mt-2 text-base font-semibold text-white/82">Atendimento rápido, seguro e humanizado para você.</p>
            </div>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-8 py-4 text-lg font-black text-white shadow-[0_18px_45px_rgba(16,185,129,.28)] transition hover:-translate-y-0.5">
              <MessageCircle size={26} />
              Falar com a Secretaria
            </a>
          </div>
        </section>
      </main>

      <footer className="relative overflow-hidden bg-[#061936] text-white">
        <div className="pointer-events-none absolute -bottom-20 -left-24 h-56 w-56 rounded-full border-[16px] border-imetro-gold/65" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-56 w-56 rounded-full border-[16px] border-emerald-600/65" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-7 md:grid-cols-[1.2fr_.8fr_.8fr] lg:px-8">
          <div>
            <LogoMark small />
            <p className="mt-4 max-w-sm text-sm font-medium leading-6 text-white/75">{env.institutionName} ({env.institutionShortName})</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] border border-imetro-gold/40 bg-white/10 text-imetro-gold">
              <GraduationCap size={42} />
            </div>
            <p className="text-xl font-black leading-8">Educação que transforma. <span className="block text-emerald-300">Gestão que simplifica.</span></p>
          </div>
          <div>
            <h3 className="text-base font-black">Contacto</h3>
            <div className="mt-4 space-y-3 text-sm font-semibold text-white/75">
              <p>WhatsApp: +{whatsappNumber}</p>
              <p>Luanda, Angola</p>
            </div>
          </div>
        </div>
        <div className="relative border-t border-white/10 py-4 text-center text-xs font-semibold text-white/60">
          © 2026 SecretáriaPay Académico — Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

function LogoMark({ small = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`${small ? 'h-12 w-12' : 'h-16 w-16'} flex shrink-0 items-center justify-center rounded-2xl bg-white/10 text-emerald-300 ring-1 ring-white/15`}>
        <ShieldCheck size={small ? 28 : 38} />
      </div>
      <div>
        <p className={`${small ? 'text-2xl' : 'text-4xl'} font-black leading-none tracking-tight text-white`}>Secretaria<span className="text-emerald-400">Pay</span></p>
        <p className="mt-1 text-center text-xs font-black uppercase tracking-[.35em] text-imetro-gold">Académico</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-[1.7rem] border border-slate-100 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,.07)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,.10)]">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-[#061936]">
        <Icon size={38} />
      </div>
      <h3 className="mt-5 text-base font-black leading-5 text-[#061936]">{title}</h3>
      <p className="mt-4 text-sm font-medium leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function StepCard({ step, number }) {
  const Icon = step.icon;
  return (
    <div className="relative text-center">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white shadow-lg">{number}</div>
      <div className="mx-auto mt-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-[#061936]">
        <Icon size={36} />
      </div>
      <h3 className="mt-4 text-base font-black text-[#061936]">{step.title}</h3>
      <p className="mx-auto mt-3 max-w-[190px] text-sm font-medium leading-6 text-slate-600">{step.text}</p>
    </div>
  );
}

function PaymentCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-100 bg-white p-6 text-center shadow-[0_16px_48px_rgba(15,23,42,.06)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-[#061936]">
        <Icon size={34} />
      </div>
      <h3 className="mt-4 text-lg font-black leading-6 text-[#061936]">{title}</h3>
      <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{text}</p>
    </div>
  );
}
