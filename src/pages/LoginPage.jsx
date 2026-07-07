import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import useAuth from '../shared/auth/useAuth.js';
import { env } from '../config/env.js';

const secretariaPayLogo = 'data:image/webp;base64,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';

export default function LoginPage() {
  const { isAuthenticated, login, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [form, setForm] = useState({ email: 'admin@secretariapay.com', password: '' });
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  if (isAuthenticated) return <Navigate to={from} replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');

    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Não foi possível iniciar sessão.');
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#061936] text-[#10254a]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(215,169,40,.22),transparent_27rem),radial-gradient(circle_at_bottom_right,rgba(13,148,136,.26),transparent_28rem)]" />
        <div className="absolute inset-x-0 top-0 h-[42vh] bg-gradient-to-br from-[#061936] via-[#092a5a] to-[#061936]" />
        <div className="absolute right-[-6rem] top-[5.5rem] hidden h-[30rem] w-[38rem] rounded-[4rem] border border-white/10 bg-white/5 opacity-30 blur-[1px] lg:block" />
        <div className="absolute -bottom-24 -right-28 h-72 w-72 rounded-full border-[22px] border-imetro-gold/35" />
        <div className="absolute bottom-[18%] -left-20 h-44 w-[34rem] rotate-[-10deg] rounded-full border-t-[18px] border-imetro-gold/60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.08)_1px,transparent_0)] [background-size:22px_22px] opacity-40" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
          <section className="hidden text-white lg:block">
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.16em] text-imetro-gold">
                <GraduationCap size={16} />
                Sistema de gestão de pagamentos académicos
              </div>
              <h1 className="mt-7 text-5xl font-black leading-tight tracking-tight">
                Pagamentos académicos com controlo, automação e recibos digitais.
              </h1>
              <p className="mt-5 text-base font-medium leading-8 text-white/76">
                Plataforma institucional para propinas, guias, comprovativos, recibos e atendimento financeiro via WhatsApp.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <InfoPill title="WhatsApp financeiro" text="Guias e recibos em PDF" />
                <InfoPill title="Validação DCR" text="Comprovativos organizados" />
                <InfoPill title="Pagamentos" text="Automático e manual" />
                <InfoPill title="IMETRO" text="Gestão académica-financeira" />
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[520px]">
            <div className="mb-6 text-center sm:mb-7">
              <div className="mx-auto flex max-w-[390px] justify-center rounded-[2rem] bg-white/95 px-5 py-3 shadow-[0_18px_55px_rgba(0,0,0,.14)] backdrop-blur">
                <img src={secretariaPayLogo} alt="SecretariaPay" className="h-auto w-full object-contain" />
              </div>
              <div className="mt-4 flex items-center justify-center gap-3 text-imetro-gold">
                <span className="h-px w-20 bg-imetro-gold/70" />
                <GraduationCap size={20} />
                <span className="h-px w-20 bg-imetro-gold/70" />
              </div>
              <p className="mt-3 text-[11px] font-black uppercase tracking-[.30em] text-white/85">
                Sistema de gestão de pagamentos académicos
              </p>
            </div>

            <div className="rounded-[2.2rem] bg-white/95 p-5 shadow-[0_32px_90px_rgba(0,0,0,.24)] ring-1 ring-white/65 backdrop-blur sm:p-8">
              <div className="mb-7 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-imetro-navy shadow-inner ring-1 ring-slate-100">
                  <ShieldCheck size={35} strokeWidth={2.2} />
                </div>
                <h2 className="mt-5 text-2xl font-black tracking-tight text-imetro-navy">Entrar no painel</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-slate-500">
                  {env.institutionName} ({env.institutionShortName})
                </p>
              </div>

              <form className="space-y-5" onSubmit={submit}>
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">E-mail</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                      <Mail size={22} />
                    </span>
                    <input
                      className="h-16 w-full rounded-3xl border border-slate-200 bg-white pl-[4.5rem] pr-4 text-base font-black text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,.04)] outline-none transition placeholder:text-slate-400 focus:border-imetro-gold focus:ring-4 focus:ring-imetro-gold/15"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">Senha</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                      <LockKeyhole size={22} />
                    </span>
                    <input
                      className="h-16 w-full rounded-3xl border border-slate-200 bg-white pl-[4.5rem] pr-14 text-base font-black text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,.04)] outline-none transition placeholder:text-slate-400 focus:border-imetro-gold focus:ring-4 focus:ring-imetro-gold/15"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-2xl p-2 text-slate-400 transition hover:bg-slate-50 hover:text-imetro-navy"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <label className="inline-flex cursor-pointer items-center gap-3 font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-imetro-navy focus:ring-imetro-gold"
                    />
                    Lembrar-me
                  </label>
                  <button type="button" className="font-black text-emerald-600 transition hover:text-emerald-700">
                    Esqueceu a senha?
                  </button>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
                    {error}
                  </div>
                ) : null}

                <button
                  className="group mt-2 flex h-16 w-full items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-[#061936] to-[#08285A] text-lg font-black text-white shadow-[0_22px_45px_rgba(6,25,54,.32)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_65px_rgba(6,25,54,.38)] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={loading}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                  <ArrowRight className="transition group-hover:translate-x-1" size={25} />
                </button>
              </form>
            </div>

            <div className="mx-auto mt-6 flex max-w-sm flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/95 text-imetro-navy shadow-[0_18px_45px_rgba(0,0,0,.12)]">
                <CheckCircle2 size={29} />
              </div>
              <p className="mt-3 text-sm font-black leading-6 text-white">
                Educação que transforma.
                <span className="block text-emerald-300">Gestão que simplifica.</span>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function InfoPill({ title, text }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-1 text-xs font-semibold text-white/62">{text}</p>
    </div>
  );
}
