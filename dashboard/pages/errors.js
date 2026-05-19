'use strict';

import StatCard from '../components/StatCard';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import { useMetricsContext } from '../hooks/useMetrics';

export default function ErrorsPage() {
  const { metrics, history } = useMetricsContext();
  const m = metrics || {};
  const retry = m.retry || {};

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Error Rate"
          value={((m.errorRate ?? 0) * 100).toFixed(2)}
          unit="%"
          variant="danger"
        />
        <StatCard title="Retry Count" value={retry.retryCount ?? 0} variant="warning" />
        <StatCard title="Failovers" value={retry.failoverCount ?? 0} variant="warning" />
        <StatCard
          title="Unhealthy Backends"
          value={m.unhealthyBackends ?? 0}
          variant={m.unhealthyBackends > 0 ? 'danger' : 'success'}
        />
      </div>

      <section className="card">
        <h3 className="section-label mb-4">Error Rate Over Time</h3>
        <TimeSeriesChart
          data={history}
          lines={[{ key: 'errors', name: 'Error %', color: '#a3a3a3' }]}
        />
      </section>

      <section className="card">
        <h3 className="section-label mb-4">Recent Failover Events</h3>
        <ul className="space-y-2 font-mono text-sm">
          {(retry.recentFailovers || []).length === 0 && (
            <li className="text-edge-muted">No failover events yet</li>
          )}
          {(retry.recentFailovers || []).slice(0, 15).map((ev, i) => (
            <li key={i} className="flex justify-between border-b border-edge-border/30 py-2">
              <span>
                {ev.failedServer} → {ev.reroutedServer}
              </span>
              <span className="text-edge-muted">
                retries: {ev.retryCount} · {new Date(ev.timestamp).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
