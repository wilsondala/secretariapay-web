export default function StatCard({ title, value, description, icon: Icon, tone = 'navy' }) {
  const tones = {
    navy: {
      card: 'from-[#07142D] via-[#0B2A5B] to-[#061936] text-white border-[#061936]/10',
      icon: 'bg-white/12 text-white ring-white/15',
      title: 'text-white/80',
      value: 'text-white',
      description: 'text-white/72',
      glow: 'bg-blue-400/20',
    },
    gold: {
      card: 'from-amber-50 via-white to-orange-50 text-slate-900 border-amber-200/80',
      icon: 'bg-amber-500 text-white ring-amber-200',
      title: 'text-amber-800',
      value: 'text-amber-700',
      description: 'text-slate-500',
      glow: 'bg-amber-300/35',
    },
    danger: {
      card: 'from-red-50 via-white to-rose-50 text-slate-900 border-red-200/80',
      icon: 'bg-red-500 text-white ring-red-200',
      title: 'text-red-800',
      value: 'text-red-600',
      description: 'text-slate-500',
      glow: 'bg-red-300/30',
    },
    warning: {
      card: 'from-orange-50 via-white to-amber-50 text-slate-900 border-orange-200/80',
      icon: 'bg-orange-500 text-white ring-orange-200',
      title: 'text-orange-800',
      value: 'text-orange-600',
      description: 'text-slate-500',
      glow: 'bg-orange-300/30',
    },
    success: {
      card: 'from-emerald-50 via-white to-teal-50 text-slate-900 border-emerald-200/80',
      icon: 'bg-emerald-500 text-white ring-emerald-200',
      title: 'text-emerald-800',
      value: 'text-emerald-700',
      description: 'text-slate-500',
      glow: 'bg-emerald-300/30',
    },
  };

  const current = tones[tone] || tones.navy;

  return (
    <div className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-[0_18px_50px_rgba(15,23,42,.07)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,.10)] ${current.card}`}>
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${current.glow}`} />
      <div className="relative flex min-h-[118px] flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-3">
          <p className={`max-w-[150px] text-sm font-black leading-5 ${current.title}`}>{title}</p>
          {Icon && (
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg ring-1 ${current.icon}`}>
              <Icon size={22} strokeWidth={2.2} />
            </div>
          )}
        </div>
        <div>
          <p className={`truncate text-3xl font-black tracking-tight ${current.value}`}>{value}</p>
          <p className={`mt-2 text-xs font-semibold leading-5 ${current.description}`}>{description}</p>
        </div>
      </div>
    </div>
  );
}
