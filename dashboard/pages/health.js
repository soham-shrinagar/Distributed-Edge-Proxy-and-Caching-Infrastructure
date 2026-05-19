'use strict';

import StatCard from '../components/StatCard';
import { useMetricsContext } from '../hooks/useMetrics';

export default function HealthPage() {
  const { metrics } = useMetricsContext();
  const m = metrics || {};
  const events = m.healthEvents || [];
  const mem = m.memoryUsage || {};

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Healthy Backends" value={m.healthyBackends ?? 0} variant="success" />
        <StatCard
          title="Unhealthy"
          value={m.unhealthyBackends ?? 0}
          variant={m.unhealthyBackends > 0 ? 'danger' : 'success'}
        />
        <StatCard title="Heap Used" value={`${((mem.heapUsed || 0) / 1048576).toFixed(1)} MB`} />
        <StatCard
          title="Redis"
          value={m.redis?.connected ? 'Connected' : 'Offline'}
          variant={m.redis?.connected ? 'success' : 'warning'}
        />
      </div>

      <section className="card">
        <h3 className="section-label mb-4">Health events (live via WebSocket)</h3>
        <ul className="space-y-2 font-mono text-sm max-h-96 overflow-y-auto">
          {events.length === 0 && (
            <li className="text-edge-muted">No state changes yet — health checks run every 5s</li>
          )}
          {events.map((ev, i) => (
            <li key={i} className="flex gap-4">
              <span className={ev.type === 'recovery' ? 'text-edge-foreground' : 'text-edge-muted'}>
                {ev.type.toUpperCase()}
              </span>
              <span>{ev.backend}</span>
              <span className="text-edge-muted ml-auto">
                {new Date(ev.timestamp).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
