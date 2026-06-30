'use strict';

import StatCard from '../components/StatCard';
import PageIntro, { ChartPanel } from '../components/PageIntro';
import { ErrorsNarrative } from '../components/SystemNarrative';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import { useMetricsContext } from '../hooks/useMetrics';
import { PAGE_META } from '../lib/interpret';

export default function ErrorsPage() {
  const { metrics, history } = useMetricsContext();
  const m = metrics || {};
  const retry = m.retry || {};
  const meta = PAGE_META['/errors'];

  return (
    <div className="space-y-8">
      <PageIntro title={meta.title} description={meta.description} />
      <ErrorsNarrative metrics={m} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Error Rate" value={((m.errorRate ?? 0) * 100).toFixed(2)} unit="%" />
        <StatCard title="Retry Count" value={retry.retryCount ?? 0} />
        <StatCard title="Failovers" value={retry.failoverCount ?? 0} />
        <StatCard title="Unhealthy Backends" value={m.unhealthyBackends ?? 0} />
      </div>

      <ChartPanel title="Error Rate Over Time">
        <TimeSeriesChart
          data={history}
          lines={[{ key: 'errors', name: 'Error %', color: '#a1a1aa' }]}
        />
      </ChartPanel>

      <section className="card">
        <p className="section-heading mb-4">Recent Failover Events</p>
        <ul className="space-y-0 font-mono text-sm">
          {(retry.recentFailovers || []).length === 0 && (
            <li className="empty-state">No failovers yet</li>
          )}
          {(retry.recentFailovers || []).slice(0, 15).map((ev, i) => (
            <li key={i} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 table-row py-3 px-1">
              <span className="text-edge-foreground">
                {ev.failedServer} → {ev.reroutedServer}
              </span>
              <span className="text-edge-muted text-xs">
                {ev.retryCount} retries · {new Date(ev.timestamp).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
