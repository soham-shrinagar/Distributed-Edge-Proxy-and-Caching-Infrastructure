'use strict';

import StatCard from '../components/StatCard';
import PageIntro, { ChartPanel } from '../components/PageIntro';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import { useMetricsContext } from '../hooks/useMetrics';
import { PAGE_META } from '../lib/pageMeta';

export default function ErrorsPage() {
  const { metrics, history } = useMetricsContext();
  const m = metrics || {};
  const retry = m.retry || {};
  const meta = PAGE_META['/errors'];

  return (
    <div className="space-y-8">
      <PageIntro title={meta.title} description={meta.description} tip={meta.tip} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Error Rate"
          value={((m.errorRate ?? 0) * 100).toFixed(2)}
          unit="%"
          hint="4xx + 5xx share"
          variant="danger"
        />
        <StatCard title="Retry Count" value={retry.retryCount ?? 0} hint="Automatic retries" variant="warning" />
        <StatCard title="Failovers" value={retry.failoverCount ?? 0} hint="Switched backend" variant="warning" />
        <StatCard
          title="Unhealthy Backends"
          value={m.unhealthyBackends ?? 0}
          hint="Removed from pool"
          variant={m.unhealthyBackends > 0 ? 'danger' : 'success'}
        />
      </div>

      <ChartPanel title="Error Rate Over Time" description="Percentage of failed requests in the rolling window.">
        <TimeSeriesChart
          data={history}
          lines={[{ key: 'errors', name: 'Error %', color: '#a1a1aa' }]}
        />
      </ChartPanel>

      <section className="card">
        <p className="section-heading mb-1">Recent Failover Events</p>
        <p className="section-desc mb-5">
          When a backend fails, the proxy retries on another server automatically.
        </p>
        <ul className="space-y-0 font-mono text-sm">
          {(retry.recentFailovers || []).length === 0 && (
            <li className="empty-state">No failover events yet — try Error & failover in Simulator</li>
          )}
          {(retry.recentFailovers || []).slice(0, 15).map((ev, i) => (
            <li key={i} className="flex justify-between table-row py-3 px-1">
              <span className="text-edge-foreground">
                {ev.failedServer} → {ev.reroutedServer}
              </span>
              <span className="text-edge-muted text-xs">
                retries: {ev.retryCount} · {new Date(ev.timestamp).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
