'use strict';

import StatCard from '../components/StatCard';
import PageIntro, { ChartPanel } from '../components/PageIntro';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import PieChartCard from '../charts/PieChartCard';
import { useMetricsContext } from '../hooks/useMetrics';
import { PAGE_META } from '../lib/pageMeta';

export default function OverviewPage() {
  const { metrics, history } = useMetricsContext();
  const m = metrics || {};
  const meta = PAGE_META['/'];

  const trafficPie =
    m.trafficDistribution?.map((b) => ({
      name: b.name,
      value: b.requests || 0,
    })) || [];

  return (
    <div className="space-y-8">
      <PageIntro title={meta.title} description={meta.description} tip={meta.tip} />

      <section>
        <p className="section-label mb-4">Real-time</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Requests / sec"
            value={(m.requestsPerSecond ?? 0).toFixed(1)}
            hint="Rolling 10s average"
            variant="accent"
          />
          <StatCard
            title="Avg Latency"
            value={(m.avgLatency ?? 0).toFixed(0)}
            unit="ms"
            hint="End-to-end through proxy"
          />
          <StatCard
            title="Cache Hit Ratio"
            value={((m.cacheHitRatio ?? 0) * 100).toFixed(1)}
            unit="%"
            hint="L1 + L2 combined"
            variant="success"
          />
          <StatCard
            title="Active Backends"
            value={`${m.healthyBackends ?? 0}/${m.backends?.length ?? 3}`}
            hint="Healthy / total pool"
            variant={m.unhealthyBackends > 0 ? 'warning' : 'success'}
          />
        </div>
      </section>

      <section>
        <p className="section-label mb-4">Cumulative</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Requests" value={m.totalRequests ?? 0} hint="Since proxy start" />
          <StatCard title="Active Connections" value={m.activeConnections ?? 0} hint="In-flight now" />
          <StatCard
            title="Failovers"
            value={m.retry?.failoverCount ?? 0}
            hint="Rerouted after failure"
            variant="warning"
          />
          <StatCard
            title="Rate Limited"
            value={m.rateLimit?.limitedTotal ?? 0}
            hint="429 responses sent"
            variant="danger"
          />
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartPanel
          title="Throughput & Latency"
          description="Request rate and response time over the last minute."
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
          description="Which backend handled origin traffic in the last 10 seconds."
        >
          <PieChartCard data={trafficPie} />
        </ChartPanel>
      </div>

      <ChartPanel
        title="Cache & Error Rate"
        description="Cache efficiency vs failures — lower error line is better."
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
