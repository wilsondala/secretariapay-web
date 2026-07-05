export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-[11px] font-black uppercase tracking-[0.22em] text-imetro-gold">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-subtitle">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
