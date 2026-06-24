'use strict';

import StatCard from '../components/StatCard';
import PageIntro from '../components/PageIntro';
import { HealthNarrative } from '../components/SystemNarrative';
import { useMetricsContext } from '../hooks/useMetrics';
import { PAGE_META } from '../lib/interpret';

export default function HealthPage() {
  const { metrics } = useMetricsContext();
  const m = metrics || {};
  const events = m.healthEvents || [];
  const mem = m.memoryUsage || {};
  const meta = PAGE_META['/health'];

  return (
    <div className="space-y-8">
      <PageIntro
        title={meta.title}
        problem={meta.problem}
        description={meta.description}
        workflow={meta.workflow}
        tip={meta.tip}
      />

      <HealthNarrative metrics={m} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Healthy Backends"
          value={m.healthyBackends ?? 0}
          hint="Servers passing health checks and eligible to receive traffic."
        />
        <StatCard
          title="Unhealthy"
          value={m.unhealthyBackends ?? 0}
          hint="Servers failing probes — automatically removed from load balancing."
        />
        <StatCard
          title="Heap Used"
          value={`${((mem.heapUsed || 0) / 1048576).toFixed(1)} MB`}
          hint="Memory used by the proxy process itself."
        />
        <StatCard
          title="Redis"
          value={m.redis?.connected ? 'Connected' : 'Offline'}
          hint={
            m.redis?.connected
              ? 'Shared cache and rate limits are active.'
              : 'L2 cache and rate limits unavailable until Redis reconnects.'
          }
        />
      </div>

      <section className="card">
        <p className="section-heading mb-1">Health Events</p>
        <p className="section-desc mb-5">
          Automatic state changes detected every 5 seconds. Recovery means a server came back and rejoined the
          pool.
        </p>
        <ul className="space-y-0 font-mono text-sm max-h-96 overflow-y-auto">
          {events.length === 0 && (
            <li className="empty-state">
              <p className="font-medium text-edge-foreground mb-2">No state changes yet</p>
              <p>
                Health probes run every 5 seconds. When a backend goes down or recovers, an event appears here
                — try Simulator → Error &amp; failover to trigger one.
              </p>
            </li>
          )}
          {events.map((ev, i) => (
            <li key={i} className="flex flex-col sm:flex-row sm:gap-4 table-row py-3 px-1">
              <span
                className={`text-xs font-medium w-24 shrink-0 ${
                  ev.type === 'recovery' ? 'text-edge-foreground' : 'text-edge-muted'
                }`}
              >
                {ev.type === 'recovery' ? 'Recovered' : 'Went offline'}
              </span>
              <span className="text-edge-foreground">{ev.backend}</span>
              <span className="text-edge-muted sm:ml-auto text-xs">
                {new Date(ev.timestamp).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
