import { AlertTriangle, RefreshCw } from 'lucide-react';

const friendly = (message) => {
  if (!message) return 'Verifique sua sessão, permissões e disponibilidade da API.';
  if (String(message).includes('400')) return 'A API recusou a consulta. Alguns endpoints administrativos ainda podem estar em padronização.';
  if (String(message).includes('401')) return 'Sessão expirada ou acesso não autorizado. Faça login novamente.';
  if (String(message).includes('403')) return 'O seu perfil não tem permissão para aceder a estes dados.';
  if (String(message).includes('404')) return 'Endpoint ainda não disponível para esta tela.';
  if (String(message).includes('Network')) return 'Não foi possível comunicar com a API. Verifique internet, CORS ou disponibilidade do servidor.';
  return message;
};

export default function ErrorState({ title = 'Não foi possível carregar os dados', message, onRetry, soft = false }) {
  return (
    <div className={`card p-4 ${soft ? 'border-amber-100 bg-amber-50/60' : 'border-red-100 bg-red-50/60'}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${soft ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className={`font-black ${soft ? 'text-amber-900' : 'text-red-900'}`}>{title}</h3>
            <p className={`mt-1 text-sm ${soft ? 'text-amber-800' : 'text-red-700'}`}>{friendly(message)}</p>
          </div>
        </div>
        {onRetry && (
          <button className={`btn-secondary bg-white ${soft ? 'border-amber-200 text-amber-800 hover:bg-amber-50' : 'border-red-200 text-red-700 hover:bg-red-50'}`} onClick={onRetry}>
            <RefreshCw size={16} className="mr-2" />
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}
