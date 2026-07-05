import { RefreshCw } from 'lucide-react';

export default function LoadingState({ message = 'Carregando dados...' }) {
  return (
    <div className="card flex min-h-56 items-center justify-center p-8 text-center">
      <div>
        <RefreshCw className="mx-auto animate-spin text-imetro-navy" size={28} />
        <p className="mt-3 text-sm font-semibold text-slate-600">{message}</p>
      </div>
    </div>
  );
}
