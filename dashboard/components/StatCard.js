'use strict';

export default function StatCard({ title, value, unit, hint }) {
  return (
    <div className="card">
      <p className="section-label">{title}</p>
      <p className="text-xl sm:text-2xl font-semibold mt-1.5 font-mono tracking-tight text-edge-foreground">
        {value}
        {unit && <span className="text-sm font-normal text-edge-muted ml-1">{unit}</span>}
      </p>
      {hint && <p className="stat-hint">{hint}</p>}
    </div>
  );
}
