'use strict';

import StatCard from '../components/StatCard';
import PageIntro from '../components/PageIntro';
import { useMetricsContext } from '../hooks/useMetrics';
import { PAGE_META } from '../lib/pageMeta';

export default function HealthPage() {
  const { metrics } = useMetricsContext();
  const m = metrics || {};
  const events = m.healthEvents || [];
  const mem = m.memoryUsage || {};
  const meta = PAGE_META['/health'];

  return (
    <div className="space-y-8">
      <PageIntro title={meta.title} description={meta.description} tip={meta.tip} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Healthy Backends" value={m.healthyBackends ?? 0} hint="Receiving traffic" />
        <StatCard
          title="Unhealthy"
          value={m.unhealthyBackends ?? 0}
          hint="Excluded from LB"
        />
        <StatCard title="Heap Used" value={`${((mem.heapUsed || 0) / 1048576).toFixed(1)} MB`} hint="Proxy memory" />
        <StatCard
          title="Redis"
          value={m.redis?.connected ? 'Connected' : 'Offline'}
          hint="L2 cache + rate limits"
        />
      </div>

      <section className="card">
        <p className="section-heading mb-1">Health Events</p>
        <p className="section-desc mb-5">State changes detected by periodic probes every 5 seconds.</p>
        <ul className="space-y-0 font-mono text-sm max-h-96 overflow-y-auto">
          {events.length === 0 && (
            <li className="empty-state">No state changes yet — health checks run every 5s</li>
          )}
          {events.map((ev, i) => (
            <li key={i} className="flex flex-col sm:flex-row sm:gap-4 table-row py-3 px-1">
              <span
                className={`text-xs font-medium w-20 shrink-0 ${
                  ev.type === 'recovery' ? 'text-edge-foreground' : 'text-edge-muted'
                }`}
              >
                {ev.type}
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
