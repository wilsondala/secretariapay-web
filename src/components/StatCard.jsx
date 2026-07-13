export default function StatCard({ title, value, description, icon: Icon, tone = 'navy' }) {
  const tones = {
    navy: {
      card: 'from-[#07142D] via-[#0B2A5B] to-[#061936] text-white border-[#061936]/10 dark:border-[#007DB8]/35 dark:from-[#082B4B] dark:via-[#061F36] dark:to-[#082B4B]',
      icon: 'bg-white/12 text-white ring-white/15 dark:bg-[#007DB8]/18 dark:text-[#E6F0FB] dark:ring-[#007DB8]/30',
      label: 'text-white/82 dark:text-[#DCEBFA]',
      value: 'text-white dark:text-white',
      description: 'text-white/72 dark:text-[#BFD7EE]',
      glow: 'bg-blue-400/20',
      pill: 'bg-white/10 text-white/72 dark:bg-[#007DB8]/16 dark:text-[#DCEBFA]',
      accent: 'bg-[#007DB8]',
    },
    gold: {
      card: 'from-amber-50 via-white to-orange-50 text-slate-900 border-amber-200/80 dark:from-[#082B4B] dark:via-[#061F36] dark:to-[#082B4B] dark:border-[#F2B300]/55 dark:text-white',
      icon: 'bg-amber-500 text-white ring-amber-200 dark:bg-[#F2B300] dark:text-[#082B4B] dark:ring-[#F2B300]/40',
      label: 'text-amber-800 dark:text-[#FDE68A]',
      value: 'text-[#8A4B00] dark:text-white',
      description: 'text-slate-500 dark:text-[#DCEBFA]',
      glow: 'bg-amber-300/35 dark:bg-[#F2B300]/18',
      pill: 'bg-amber-100 text-amber-800 dark:bg-[#F2B300]/18 dark:text-[#FDE68A]',
      accent: 'bg-[#F2B300]',
    },
    danger: {
      card: 'from-red-50 via-white to-rose-50 text-slate-900 border-red-200/80 dark:from-[#082B4B] dark:via-[#061F36] dark:to-[#082B4B] dark:border-red-400/50 dark:text-white',
      icon: 'bg-red-500 text-white ring-red-200 dark:bg-red-500 dark:text-white dark:ring-red-400/40',
      label: 'text-red-800 dark:text-red-200',
      value: 'text-red-600 dark:text-white',
      description: 'text-slate-500 dark:text-[#DCEBFA]',
      glow: 'bg-red-300/30 dark:bg-red-500/16',
      pill: 'bg-red-100 text-red-800 dark:bg-red-500/16 dark:text-red-200',
      accent: 'bg-red-500',
    },
    warning: {
      card: 'from-orange-50 via-white to-amber-50 text-slate-900 border-orange-200/80 dark:from-[#082B4B] dark:via-[#061F36] dark:to-[#082B4B] dark:border-orange-400/50 dark:text-white',
      icon: 'bg-orange-500 text-white ring-orange-200 dark:bg-orange-500 dark:text-white dark:ring-orange-400/40',
      label: 'text-orange-800 dark:text-orange-200',
      value: 'text-orange-600 dark:text-white',
      description: 'text-slate-500 dark:text-[#DCEBFA]',
      glow: 'bg-orange-300/30 dark:bg-orange-500/16',
      pill: 'bg-orange-100 text-orange-800 dark:bg-orange-500/16 dark:text-orange-200',
      accent: 'bg-orange-500',
    },
    success: {
      card: 'from-emerald-50 via-white to-teal-50 text-slate-900 border-emerald-200/80 dark:from-[#082B4B] dark:via-[#061F36] dark:to-[#082B4B] dark:border-emerald-400/50 dark:text-white',
      icon: 'bg-emerald-500 text-white ring-emerald-200 dark:bg-emerald-500 dark:text-white dark:ring-emerald-400/40',
      label: 'text-emerald-800 dark:text-emerald-200',
      value: 'text-emerald-700 dark:text-white',
      description: 'text-slate-500 dark:text-[#DCEBFA]',
      glow: 'bg-emerald-300/30 dark:bg-emerald-500/16',
      pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/16 dark:text-emerald-200',
      accent: 'bg-emerald-500',
    },
    info: {
      card: 'from-[#07142D] via-[#0B2A5B] to-[#061936] text-white border-[#061936]/10 dark:border-[#007DB8]/35 dark:from-[#082B4B] dark:via-[#061F36] dark:to-[#082B4B]',
      icon: 'bg-white/12 text-white ring-white/15 dark:bg-[#007DB8]/18 dark:text-[#E6F0FB] dark:ring-[#007DB8]/30',
      label: 'text-white/82 dark:text-[#DCEBFA]',
      value: 'text-white dark:text-white',
      description: 'text-white/72 dark:text-[#BFD7EE]',
      glow: 'bg-blue-400/20',
      pill: 'bg-white/10 text-white/72 dark:bg-[#007DB8]/16 dark:text-[#DCEBFA]',
      accent: 'bg-[#007DB8]',
    },
  };

  const current = tones[tone] || tones.navy;

  return (
    <div className={`group relative overflow-hidden rounded-[1.15rem] border bg-gradient-to-br p-4 shadow-[0_14px_42px_rgba(15,23,42,.07)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_54px_rgba(15,23,42,.10)] dark:shadow-none ${current.card}`}>
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${current.glow}`} />
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${current.accent}`} />
      <div className="relative flex min-h-[104px] flex-col justify-between gap-3.5">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${current.pill}`}>Indicador</span>
            <p className={`mt-2 max-w-[150px] text-[12px] font-extrabold leading-4 ${current.label}`}>{title}</p>
          </div>
          {Icon && (
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md ring-1 dark:shadow-none ${current.icon}`}>
              <Icon size={19} strokeWidth={2.2} />
            </div>
          )}
        </div>
        <div>
          <p className={`break-words text-[1.55rem] font-extrabold leading-[.95] tracking-[-.035em] drop-shadow-sm ${current.value}`}>{value}</p>
          <p className={`mt-1.5 text-[10px] font-bold leading-4 ${current.description}`}>{description}</p>
        </div>
      </div>
    </div>
  );
}
