'use strict';

import StatCard from '../components/StatCard';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import PieChartCard from '../charts/PieChartCard';
import { useMetricsContext } from '../hooks/useMetrics';

export default function OverviewPage() {
  const { metrics, history } = useMetricsContext();
  const m = metrics || {};

  const trafficPie =
    m.trafficDistribution?.map((b) => ({
      name: b.name,
      value: b.requests || 0,
    })) || [];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Requests / sec"
          value={(m.requestsPerSecond ?? 0).toFixed(1)}
          variant="accent"
        />
        <StatCard
          title="Avg Latency"
          value={(m.avgLatency ?? 0).toFixed(0)}
          unit="ms"
          variant="default"
        />
        <StatCard
          title="Cache Hit Ratio"
          value={((m.cacheHitRatio ?? 0) * 100).toFixed(1)}
          unit="%"
          variant="success"
        />
        <StatCard
          title="Active Backends"
          value={`${m.healthyBackends ?? 0}/${m.backends?.length ?? 3}`}
          variant={m.unhealthyBackends > 0 ? 'warning' : 'success'}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Requests" value={m.totalRequests ?? 0} />
        <StatCard title="Active Connections" value={m.activeConnections ?? 0} />
        <StatCard
          title="Failovers"
          value={m.retry?.failoverCount ?? 0}
          variant="warning"
        />
        <StatCard
          title="Rate Limited"
          value={m.rateLimit?.limitedTotal ?? 0}
          variant="danger"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="section-label mb-4">Throughput & Latency</h3>
          <TimeSeriesChart
            data={history}
            lines={[
              { key: 'rps', name: 'Req/s', color: '#0a0a0a' },
              { key: 'latency', name: 'Latency (ms)', color: '#737373' },
            ]}
          />
        </div>
        <div className="card">
          <h3 className="section-label mb-4">Traffic Distribution</h3>
          <PieChartCard data={trafficPie} />
        </div>
      </div>

      <div className="card">
        <h3 className="section-label mb-4">Cache & Error Rate</h3>
        <TimeSeriesChart
          data={history}
          lines={[
            { key: 'cacheHit', name: 'Cache Hit %', color: '#0a0a0a' },
            { key: 'errors', name: 'Error %', color: '#a3a3a3' },
          ]}
        />
      </div>
    </div>
  );
}
