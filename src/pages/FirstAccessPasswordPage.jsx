import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import imetroMonogram from '../assets/imetroMonogram.js';
import useAuth from '../shared/auth/useAuth.js';

const INITIAL_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function FirstAccessPasswordPage() {
  const navigate = useNavigate();
  const { user, changePassword, logout, loading } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');

  const requirements = useMemo(() => {
    const password = form.newPassword;

    return [
      { label: 'Pelo menos 10 caracteres', valid: password.length >= 10 },
      {
        label: 'Uma letra maiúscula',
        valid: [...password].some(
          (value) => value.toUpperCase() === value && value.toLowerCase() !== value,
        ),
      },
      {
        label: 'Uma letra minúscula',
        valid: [...password].some(
          (value) => value.toLowerCase() === value && value.toUpperCase() !== value,
        ),
      },
      { label: 'Um número', valid: /\d/.test(password) },
      { label: 'Um símbolo', valid: /[^\p{L}\p{N}]/u.test(password) },
      {
        label: 'Confirmação correspondente',
        valid: Boolean(password) && password === form.confirmPassword,
      },
    ];
  }, [form.newPassword, form.confirmPassword]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');

    try {
      await changePassword(form);
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
          || requestError?.response?.data?.error
          || requestError?.message
          || 'Não foi possível alterar a palavra-passe.',
      );
    }
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden px-4 py-7 sm:px-6 lg:py-10"
      style={{
        background:
          'radial-gradient(circle at 18% 22%, rgba(244,180,0,.18), transparent 27rem), radial-gradient(circle at 86% 78%, rgba(17,148,221,.19), transparent 31rem), linear-gradient(135deg, #03142D 0%, #071F44 52%, #03142D 100%)',
        color: '#071A35',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,.11) 1px, transparent 0)',
          backgroundSize: '26px 26px',
        }}
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-1/2 hidden w-[58vw] max-w-[850px] -translate-y-1/2 lg:block">
          <div className="absolute inset-[8%] rounded-full bg-[#F4B400]/15 blur-[90px]" />
          <img
            src={imetroMonogram}
            alt=""
            aria-hidden="true"
            className="relative w-full opacity-[.24] drop-shadow-[0_30px_85px_rgba(244,180,0,.18)]"
          />
        </div>

        <img
          src={imetroMonogram}
          alt=""
          aria-hidden="true"
          className="absolute left-1/2 top-5 w-[410px] -translate-x-1/2 opacity-[.11] sm:w-[520px] lg:hidden"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#03142D]/10 to-[#03142D]/55" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[.95fr_1.05fr]">
        <section className="relative hidden min-h-[560px] flex-col justify-end pb-14 text-white lg:flex">
          <div className="max-w-[520px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F4B400]/35 bg-[#F4B400]/10 px-4 py-2 text-xs font-black uppercase tracking-[.16em] text-[#FFD76A] backdrop-blur-md">
              <ShieldCheck size={17} />
              Proteção do primeiro acesso
            </div>

            <p className="mt-7 text-sm font-black uppercase tracking-[.22em] text-[#F4B400]">
              IMETRO · SecretáriaPay
            </p>

            <h1 className="mt-4 text-5xl font-black leading-[1.02] tracking-[-.045em] xl:text-6xl">
              Defina uma palavra-passe pessoal e segura.
            </h1>

            <p className="mt-6 max-w-xl text-base font-medium leading-8 text-white/78">
              A credencial recebida é temporária. O acesso às áreas institucionais será
              libertado somente depois desta alteração.
            </p>

            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.07] p-4 backdrop-blur-md">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                <CheckCircle2 size={23} />
              </span>
              <div>
                <p className="text-sm font-black text-white">Acesso institucional protegido</p>
                <p className="mt-1 text-xs font-semibold text-white/58">
                  A palavra-passe temporária deixará de funcionar após a alteração.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="relative mx-auto w-full max-w-[570px] overflow-hidden rounded-[2.2rem] border border-white/70 p-6 shadow-[0_35px_120px_rgba(0,0,0,.46)] backdrop-blur-xl sm:p-9"
          style={{ backgroundColor: 'rgba(255,255,255,.975)', color: '#071A35' }}
        >
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#E4A900] via-[#FFD76A] to-[#0874B4]" />
          <div className="absolute -right-24 -top-24 h-60 w-60 rounded-full bg-[#F4B400]/10 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0874B4]/10 text-[#0874B4] ring-1 ring-[#0874B4]/10">
                <KeyRound size={28} />
              </span>

              <p className="mt-5 text-xs font-black uppercase tracking-[.16em] text-[#0874B4]">
                Primeiro acesso
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#071A35] sm:text-[2.15rem]">
                Alterar palavra-passe
              </h2>

              <p className="mt-2 text-sm font-bold text-slate-600">
                {user?.fullName || user?.email}
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>

          <div className="relative mt-6 rounded-2xl border border-[#F4B400]/25 bg-[#FFF9E8] px-4 py-3">
            <p className="text-sm font-bold leading-6 text-[#5A4410]">
              Use a palavra-passe temporária recebida e defina uma nova palavra-passe exclusiva.
            </p>
          </div>

          <form onSubmit={submit} className="relative mt-6 space-y-5">
            <PasswordField
              label="Palavra-passe temporária"
              name="currentPassword"
              value={form.currentPassword}
              visible={showCurrent}
              onToggle={() => setShowCurrent((current) => !current)}
              onChange={updateField}
              autoComplete="current-password"
              placeholder="Digite a palavra-passe temporária"
            />

            <PasswordField
              label="Nova palavra-passe"
              name="newPassword"
              value={form.newPassword}
              visible={showNew}
              onToggle={() => setShowNew((current) => !current)}
              onChange={updateField}
              autoComplete="new-password"
              placeholder="Crie uma nova palavra-passe"
            />

            <PasswordField
              label="Confirmar nova palavra-passe"
              name="confirmPassword"
              value={form.confirmPassword}
              visible={showNew}
              onToggle={() => setShowNew((current) => !current)}
              onChange={updateField}
              autoComplete="new-password"
              placeholder="Repita a nova palavra-passe"
            />

            <div
              className="grid gap-2 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2"
              style={{ backgroundColor: '#F8FAFC' }}
            >
              {requirements.map((requirement) => (
                <p
                  key={requirement.label}
                  className={`flex items-center gap-2 text-xs font-bold ${
                    requirement.valid ? 'text-emerald-700' : 'text-slate-600'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                      requirement.valid
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-300 bg-white text-slate-400'
                    }`}
                  >
                    {requirement.valid ? '✓' : '○'}
                  </span>
                  {requirement.label}
                </p>
              ))}
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#071A35] to-[#0B2B5B] px-5 text-sm font-black text-white shadow-[0_18px_45px_rgba(7,26,53,.25)] transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_24px_55px_rgba(7,26,53,.32)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'A alterar...' : 'Guardar nova palavra-passe'}
            </button>
          </form>

          <p className="relative mt-5 text-center text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">
            Universidade Metropolitana de Angola · IMETRO
          </p>
        </section>
      </div>
    </main>
  );
}

function PasswordField({
  label,
  name,
  value,
  visible,
  onToggle,
  onChange,
  autoComplete,
  placeholder,
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-[#071A35]">{label}</span>

      <span
        className="mt-2 flex items-center rounded-2xl border px-4 transition focus-within:border-[#0874B4] focus-within:ring-4 focus-within:ring-[#0874B4]/10"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
      >
        <input
          type={visible ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          className="min-h-14 flex-1 border-0 bg-transparent text-sm font-semibold text-[#071A35] outline-none placeholder:text-slate-400"
          style={{ color: '#071A35' }}
        />

        <button
          type="button"
          onClick={onToggle}
          className="ml-3 text-slate-400 transition hover:text-[#0874B4]"
          aria-label={visible ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </span>
    </label>
  );
}
