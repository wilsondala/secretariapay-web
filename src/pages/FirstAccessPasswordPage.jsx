import { useMemo, useState } from 'react';
import { Eye, EyeOff, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
      { label: 'Uma letra maiúscula', valid: [...password].some((value) => value.toUpperCase() === value && value.toLowerCase() !== value) },
      { label: 'Uma letra minúscula', valid: [...password].some((value) => value.toLowerCase() === value && value.toUpperCase() !== value) },
      { label: 'Um número', valid: /\d/.test(password) },
      { label: 'Um símbolo', valid: /[^\p{L}\p{N}]/u.test(password) },
      { label: 'Confirmação correspondente', valid: Boolean(password) && password === form.confirmPassword },
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
    <main className="min-h-screen bg-[#061936] px-4 py-8 text-[#071A35] sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-8 lg:grid-cols-[.9fr_1.1fr]">
        <section className="hidden text-white lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.14em] text-[#F4B400]">
            <ShieldCheck size={17} />
            Proteção do primeiro acesso
          </div>
          <h1 className="mt-6 text-5xl font-black leading-tight tracking-[-.04em]">
            Defina uma palavra-passe pessoal e segura.
          </h1>
          <p className="mt-5 max-w-xl text-base font-medium leading-8 text-white/70">
            A credencial recebida é temporária. O acesso às áreas institucionais será libertado
            somente depois desta alteração.
          </p>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-[0_30px_100px_rgba(0,0,0,.3)] sm:p-9">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1194DD]/10 text-[#0874B4]">
                <KeyRound size={28} />
              </span>
              <p className="mt-5 text-xs font-black uppercase tracking-[.14em] text-[#0874B4]">
                Primeiro acesso
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-.035em]">
                Alterar palavra-passe
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {user?.fullName || user?.email}
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-5">
            <PasswordField
              label="Palavra-passe temporária"
              name="currentPassword"
              value={form.currentPassword}
              visible={showCurrent}
              onToggle={() => setShowCurrent((current) => !current)}
              onChange={updateField}
              autoComplete="current-password"
            />

            <PasswordField
              label="Nova palavra-passe"
              name="newPassword"
              value={form.newPassword}
              visible={showNew}
              onToggle={() => setShowNew((current) => !current)}
              onChange={updateField}
              autoComplete="new-password"
            />

            <PasswordField
              label="Confirmar nova palavra-passe"
              name="confirmPassword"
              value={form.confirmPassword}
              visible={showNew}
              onToggle={() => setShowNew((current) => !current)}
              onChange={updateField}
              autoComplete="new-password"
            />

            <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
              {requirements.map((requirement) => (
                <p
                  key={requirement.label}
                  className={`text-xs font-bold ${requirement.valid ? 'text-emerald-700' : 'text-slate-500'}`}
                >
                  {requirement.valid ? '✓' : '○'} {requirement.label}
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
              className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#071A35] px-5 text-sm font-black text-white shadow-lg transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'A alterar...' : 'Guardar nova palavra-passe'}
            </button>
          </form>
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
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-[#071A35]">{label}</span>
      <span className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-[#1194DD] focus-within:ring-4 focus-within:ring-[#1194DD]/10">
        <input
          type={visible ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          className="min-h-14 flex-1 border-0 bg-transparent text-sm font-semibold outline-none"
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
