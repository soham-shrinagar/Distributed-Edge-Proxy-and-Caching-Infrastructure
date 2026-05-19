'use strict';

export default function StatCard({ title, value, unit, trend, variant = 'default' }) {
  const colors = {
    default: 'text-edge-foreground',
    success: 'text-edge-foreground',
    warning: 'text-edge-muted',
    danger: 'text-edge-muted',
    accent: 'text-edge-foreground',
  };

  return (
    <div className="card">
      <p className="section-label">{title}</p>
      <p className={`text-2xl font-semibold mt-2 font-mono tracking-tight ${colors[variant]}`}>
        {value}
        {unit && <span className="text-sm font-normal text-edge-muted ml-1">{unit}</span>}
      </p>
      {trend != null && <p className="text-xs text-edge-muted mt-2">{trend}</p>}
    </div>
  );
}
