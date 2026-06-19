'use strict';

export default function PageIntro({ title, description, tip }) {
  return (
    <header className="page-intro">
      <h1 className="page-title">{title}</h1>
      <p className="page-description">{description}</p>
      {tip && <p className="page-tip">{tip}</p>}
    </header>
  );
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

export function EmptyState({ children }) {
  return <div className="empty-state">{children}</div>;
}
