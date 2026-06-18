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
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h2 className="section-heading">{title}</h2>
        {description && <p className="section-desc">{description}</p>}
      </div>
      {action}
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
