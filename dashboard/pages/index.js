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

  return (
    <div className="space-y-8">
      <PageIntro title={meta.title} description={meta.description} />
      <OverviewNarrative metrics={m} />

      <section>
        <p className="section-label mb-4">Right now</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard title="Requests / sec" value={(m.requestsPerSecond ?? 0).toFixed(1)} />
          <StatCard title="Avg Latency" value={(m.avgLatency ?? 0).toFixed(0)} unit="ms" />
          <StatCard
            title="Cache Hit Ratio"
            value={((m.cacheHitRatio ?? 0) * 100).toFixed(1)}
            unit="%"
          />
          <StatCard
            title="Active Backends"
            value={`${m.healthyBackends ?? 0}/${m.backends?.length ?? 3}`}
          />
        </div>
      </section>

      <section>
        <p className="section-label mb-4">Cumulative</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard title="Total Requests" value={m.totalRequests ?? 0} />
          <StatCard title="Active Connections" value={m.activeConnections ?? 0} />
          <StatCard title="Failovers" value={m.retry?.failoverCount ?? 0} />
          <StatCard title="Rate Limited" value={m.rateLimit?.limitedTotal ?? 0} />
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartPanel title="Throughput & Latency" description="Last minute.">
          <TimeSeriesChart
            data={history}
            lines={[
              { key: 'rps', name: 'Req/s', color: '#09090b' },
              { key: 'latency', name: 'Latency (ms)', color: '#71717a' },
            ]}
          />
        </ChartPanel>
        <ChartPanel title="Traffic Distribution" description="Origin traffic, last 10s.">
          <PieChartCard data={trafficPie} />
        </ChartPanel>
      </div>

      <ChartPanel title="Cache & Error Rate" description="Last minute.">
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
