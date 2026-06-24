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
  const errorPct = ((m.errorRate ?? 0) * 100).toFixed(2);

  return (
    <div className="space-y-8">
      <PageIntro
        title={meta.title}
        problem={meta.problem}
        description={meta.description}
        workflow={meta.workflow}
        tip={meta.tip}
      />

      <ErrorsNarrative metrics={m} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Error Rate"
          value={errorPct}
          unit="%"
          hint={`${errorPct}% of recent requests failed (4xx or 5xx). The proxy retries and reroutes where possible.`}
        />
        <StatCard
          title="Retry Count"
          value={retry.retryCount ?? 0}
          hint="Times the proxy automatically re-sent a failed request — users don't have to refresh."
        />
        <StatCard
          title="Failovers"
          value={retry.failoverCount ?? 0}
          hint="Times traffic was moved to a different backend after a failure."
        />
        <StatCard
          title="Unhealthy Backends"
          value={m.unhealthyBackends ?? 0}
          hint="Servers currently excluded from rotation — traffic goes to healthy ones only."
        />
      </div>

      <ChartPanel
        title="Error Rate Over Time"
        description="Spikes mean more failures in that window. After Simulator → Error & failover, watch the proxy recover automatically."
      >
        <TimeSeriesChart
          data={history}
          lines={[{ key: 'errors', name: 'Error %', color: '#a1a1aa' }]}
        />
      </ChartPanel>

      <section className="card">
        <p className="section-heading mb-1">Recent Failover Events</p>
        <p className="section-desc mb-5">
          Each row is a story: a backend failed, the proxy retried, and the user still got a response from
          another server.
        </p>
        <ul className="space-y-0 font-mono text-sm">
          {(retry.recentFailovers || []).length === 0 && (
            <li className="empty-state">
              <p className="font-medium text-edge-foreground mb-2">No failovers yet</p>
              <p>
                Run Simulator → Error &amp; failover to inject backend failures. You will see entries like
                &quot;backend-a → backend-b&quot; as the proxy recovers automatically.
              </p>
            </li>
          )}
          {(retry.recentFailovers || []).slice(0, 15).map((ev, i) => (
            <li key={i} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 table-row py-3 px-1">
              <span className="text-edge-foreground">
                {ev.failedServer} failed → rerouted to {ev.reroutedServer}
              </span>
              <span className="text-edge-muted text-xs">
                {ev.retryCount} retr{ev.retryCount === 1 ? 'y' : 'ies'} ·{' '}
                {new Date(ev.timestamp).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
