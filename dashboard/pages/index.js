'use strict';

import StatCard from '../components/StatCard';
import PageIntro, { ChartPanel } from '../components/PageIntro';
import { OverviewNarrative } from '../components/SystemNarrative';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import PieChartCard from '../charts/PieChartCard';
import { useMetricsContext } from '../hooks/useMetrics';
import { PAGE_META } from '../lib/interpret';

export default function OverviewPage() {
  const { metrics, history } = useMetricsContext();
  const m = metrics || {};
  const meta = PAGE_META['/'];

  const trafficPie =
    m.trafficDistribution?.map((b) => ({
      name: b.name,
      value: b.requests || 0,
    })) || [];

  const hitPct = ((m.cacheHitRatio ?? 0) * 100).toFixed(1);

  return (
    <div className="space-y-8">
      <PageIntro
        title={meta.title}
        problem={meta.problem}
        description={meta.description}
        workflow={meta.workflow}
        tip={meta.tip}
      />

      <OverviewNarrative metrics={m} />

      <section>
        <p className="section-label mb-1">Right now</p>
        <p className="text-xs text-edge-muted mb-4">Values refresh every second as traffic flows through the proxy.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Requests / sec"
            value={(m.requestsPerSecond ?? 0).toFixed(1)}
            hint="How many users are being served per second — higher means more load on the edge."
          />
          <StatCard
            title="Avg Latency"
            value={(m.avgLatency ?? 0).toFixed(0)}
            unit="ms"
            hint="Time from request to response. Lower is faster for end users."
          />
          <StatCard
            title="Cache Hit Ratio"
            value={hitPct}
            unit="%"
            hint={`${hitPct}% of requests were served from cache without contacting a backend server.`}
          />
          <StatCard
            title="Active Backends"
            value={`${m.healthyBackends ?? 0}/${m.backends?.length ?? 3}`}
            hint="Healthy servers available to receive traffic. Unhealthy ones are automatically skipped."
          />
        </div>
      </section>

      <section>
        <p className="section-label mb-1">Since proxy started</p>
        <p className="text-xs text-edge-muted mb-4">Running totals — useful for spotting trends over a demo session.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Total Requests"
            value={m.totalRequests ?? 0}
            hint="Every HTTP call that passed through the edge proxy."
          />
          <StatCard
            title="Active Connections"
            value={m.activeConnections ?? 0}
            hint="Requests currently in flight — being processed right now."
          />
          <StatCard
            title="Failovers"
            value={m.retry?.failoverCount ?? 0}
            hint="Times a failed request was automatically rerouted to another backend."
          />
          <StatCard
            title="Rate Limited"
            value={m.rateLimit?.limitedTotal ?? 0}
            hint="Requests blocked at the edge (HTTP 429) to protect backends from abuse."
          />
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartPanel
          title="Throughput & Latency"
          description="Left axis: how busy the proxy is. Right trend: how fast users get responses. Spikes in latency often follow traffic bursts."
        >
          <TimeSeriesChart
            data={history}
            lines={[
              { key: 'rps', name: 'Req/s', color: '#09090b' },
              { key: 'latency', name: 'Latency (ms)', color: '#71717a' },
            ]}
          />
        </ChartPanel>
        <ChartPanel
          title="Traffic Distribution"
          description="Which backend handled origin traffic in the last 10 seconds. Equal slices = even load balancing."
        >
          <PieChartCard data={trafficPie} />
        </ChartPanel>
      </div>

      <ChartPanel
        title="Cache & Error Rate"
        description="Rising cache line = more requests answered instantly. Rising error line = more failures — check Errors page for recovery details."
      >
        <TimeSeriesChart
          data={history}
          lines={[
            { key: 'cacheHit', name: 'Cache Hit %', color: '#09090b' },
            { key: 'errors', name: 'Error %', color: '#a1a1aa' },
          ]}
        />
      </ChartPanel>
    </div>
  );
}
