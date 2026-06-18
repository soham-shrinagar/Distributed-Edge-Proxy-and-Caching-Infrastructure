'use strict';

export default function StatCard({ title, value, unit, hint, variant = 'default' }) {
  const accents = {
    default: 'border-t-edge-foreground',
    success: 'border-t-edge-foreground',
    warning: 'border-t-neutral-400',
    danger: 'border-t-neutral-400',
    accent: 'border-t-edge-foreground',
  };

  return (
    <div className={`card border-t-2 ${accents[variant] || accents.default}`}>
      <p className="section-label">{title}</p>
      <p className="text-2xl font-semibold mt-2 font-mono tracking-tight text-edge-foreground">
        {value}
        {unit && <span className="text-sm font-normal text-edge-muted ml-1">{unit}</span>}
      </p>
      {hint && <p className="stat-hint">{hint}</p>}
    </div>
  );
}
