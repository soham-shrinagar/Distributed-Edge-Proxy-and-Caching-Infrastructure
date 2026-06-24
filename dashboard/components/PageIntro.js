'use strict';

import Link from 'next/link';

export default function PageIntro({ title, description, tip, problem, workflow }) {
  return (
    <header className="page-intro space-y-4">
      <div>
        <h1 className="page-title">{title}</h1>
        {problem && <p className="text-sm text-edge-foreground mt-2 max-w-2xl leading-relaxed">{problem}</p>}
        <p className="page-description">{description}</p>
        {tip && <p className="page-tip">{tip}</p>}
      </div>
      {workflow?.length > 0 && <WorkflowGuide steps={workflow} />}
    </header>
  );
}

export function WorkflowGuide({ steps }) {
  return (
    <div className="rounded-lg border border-edge-border bg-neutral-50 px-4 py-3 sm:px-5 sm:py-4">
      <p className="section-label mb-2.5">Try this workflow</p>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="text-sm leading-relaxed">
            <span className="font-medium text-edge-foreground">
              {i + 1}. {step.action}
            </span>
            <span className="text-edge-muted"> — {step.result}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function OutcomeBanner({ title, children }) {
  return (
    <div className="alert">
      {title && <p className="font-medium text-edge-foreground text-sm mb-1">{title}</p>}
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
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

export function EmptyState({ title, children, action }) {
  return (
    <div className="empty-state">
      {title && <p className="font-medium text-edge-foreground mb-2">{title}</p>}
      <div className="text-sm leading-relaxed">{children}</div>
      {action && <div className="mt-4">{action}</div>}
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
