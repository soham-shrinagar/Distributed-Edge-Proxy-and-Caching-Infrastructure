'use strict';

import Link from 'next/link';

export default function PageIntro({ title, description }) {
  return (
    <header className="page-intro">
      <h1 className="page-title">{title}</h1>
      {description && <p className="page-description">{description}</p>}
    </header>
  );
}

export function OutcomeBanner({ children }) {
  return <div className="alert text-sm">{children}</div>;
}

export function SectionHeader({ title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 sm:mb-5">
      <div className="min-w-0">
        <h2 className="section-heading">{title}</h2>
        {description && <p className="section-desc">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function ChartPanel({ title, description, children, className = '' }) {
  return (
    <section className={`card chart-panel ${className}`}>
      <SectionHeader title={title} description={description} />
      {children}
    </section>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="empty-state">
      {title && <p className="font-medium text-edge-foreground mb-1">{title}</p>}
      <div className="text-sm">{children}</div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function SimulatorLink({ children }) {
  return (
    <Link href="/simulator" className="text-edge-foreground font-medium underline underline-offset-2 hover:no-underline">
      {children || 'Simulator'}
    </Link>
  );
}
