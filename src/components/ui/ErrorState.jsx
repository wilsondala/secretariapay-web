import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({ title = 'Não foi possível carregar os dados', message, onRetry }) {
  return (
    <div className="card border-red-100 bg-red-50/60 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="font-black text-red-900">{title}</h3>
            <p className="mt-1 text-sm text-red-700">{message || 'Verifique sua sessão, permissões e a disponibilidade da API.'}</p>
          </div>
        </div>
        {onRetry && (
          <button className="btn-secondary border-red-200 bg-white text-red-700 hover:bg-red-50" onClick={onRetry}>
            <RefreshCw size={16} className="mr-2" />
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}
