import { ShieldCheck } from 'lucide-react';

export default function ClientNotice({ title = 'Ambiente de demonstração controlada', children }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-900">
      <div className="mb-1 flex items-center gap-2 font-black">
        <ShieldCheck size={16} />
        {title}
      </div>
      <div className="text-amber-800">{children}</div>
    </div>
  );
}
