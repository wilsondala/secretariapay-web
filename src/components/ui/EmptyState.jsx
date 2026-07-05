export default function EmptyState({ title = 'Nenhum registro encontrado', message = 'Altere os filtros ou tente novamente.' }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p className="font-black text-slate-800">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
    </div>
  );
}
