import { useState } from 'react';
import {
  AlertCircle,
  FileSearch,
  Loader2,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { getPublicAdmissionPaymentStatus } from '../../services/admissionsService.js';
import PublicAdmissionPaymentPanel from './PublicAdmissionPaymentPanel.jsx';

function readError(error) {
  return error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || 'Não foi possível consultar a candidatura.';
}

const inputClass = 'min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-[#071A35] outline-none transition placeholder:text-slate-400 focus:border-[#1194DD] focus:ring-4 focus:ring-[#1194DD]/10';

export default function PublicAdmissionLookup({ onClose }) {
  const [applicationCode, setApplicationCode] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    setApplication(null);

    const code = applicationCode.trim();
    const document = documentNumber.trim();
    if (!code || !document) {
      setError('Informe o código da candidatura e o número do documento.');
      return;
    }

    setLoading(true);
    try {
      const result = await getPublicAdmissionPaymentStatus(code, document);
      setApplication({
        applicationCode: result.applicationCode,
        status: result.applicationStatus,
        desiredCourseName: result.desiredCourseName,
        desiredShift: result.desiredShift,
        academicYear: result.academicYear,
      });
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setApplication(null);
    setError('');
  }

  return (
    <section id="consulta-candidatura" className="rounded-[2rem] border border-slate-300 bg-white p-5 shadow-[0_24px_70px_rgba(7,26,53,.12)] sm:p-7 lg:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#071A35] text-[#F4B400]">
            <FileSearch size={29} />
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.13em] text-[#1194DD]">Acompanhamento público</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.03em] text-[#071A35] sm:text-3xl">Consultar candidatura</h2>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
              Use o código recebido após a submissão e o mesmo número de documento informado na ficha.
            </p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center self-end rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 md:self-start" aria-label="Fechar consulta">
          <X size={20} />
        </button>
      </div>

      <div className="public-lookup-security-notice mt-6 flex items-start gap-3 rounded-2xl border p-4">
        <ShieldCheck className="mt-0.5 shrink-0" size={20} />
        <p className="text-sm font-semibold leading-6">
          A consulta exige dois dados coincidentes. Quando o piloto financeiro estiver desativado, os dados bancários permanecem ocultos.
        </p>
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label>
          <span className="text-xs font-extrabold uppercase tracking-[.1em] text-slate-500">Código da candidatura</span>
          <input
            value={applicationCode}
            onChange={(event) => setApplicationCode(event.target.value)}
            className={`${inputClass} mt-2`}
            placeholder="IMT-ADM-..."
            autoComplete="off"
          />
        </label>
        <label>
          <span className="text-xs font-extrabold uppercase tracking-[.1em] text-slate-500">BI ou passaporte</span>
          <input
            value={documentNumber}
            onChange={(event) => setDocumentNumber(event.target.value)}
            className={`${inputClass} mt-2`}
            placeholder="Número usado na candidatura"
            autoComplete="off"
          />
        </label>
        <button type="submit" disabled={loading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#1194DD] px-6 py-3 text-sm font-black text-white shadow-lg transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          {loading ? 'A consultar...' : 'Consultar'}
        </button>
      </form>

      {error ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 shrink-0" size={20} />
          <p className="text-sm font-semibold leading-6">{error}</p>
        </div>
      ) : null}

      {application ? (
        <div className="mt-6">
          <div className="flex flex-col gap-3 rounded-3xl bg-[#071A35] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-white/50">Candidatura localizada</p>
              <p className="mt-2 break-all text-base font-black">{application.applicationCode}</p>
              <p className="mt-2 text-sm font-semibold text-white/70">{application.desiredCourseName} · {application.desiredShift} · {application.academicYear}</p>
            </div>
            <button type="button" onClick={clear} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-extrabold text-white">
              Nova consulta
            </button>
          </div>

          <PublicAdmissionPaymentPanel
            application={application}
            documentNumber={documentNumber.trim()}
          />
        </div>
      ) : null}
    </section>
  );
}
