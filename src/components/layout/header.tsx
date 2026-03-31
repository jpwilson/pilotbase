"use client";

interface HeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, badge, actions }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-black text-slate-900 font-headline">{title}</h2>
        {badge && (
          <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-on-primary-fixed-variant">
            {badge}
          </span>
        )}
        {subtitle && <span className="text-sm text-on-surface-variant">{subtitle}</span>}
      </div>
      <div className="flex items-center gap-6">
        {actions}
        <button className="relative text-slate-500 transition-colors hover:text-orange-500">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-surface bg-error" />
        </button>
      </div>
    </header>
  );
}
