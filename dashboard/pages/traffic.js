'use strict';

import PieChartCard from '../charts/PieChartCard';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import StatCard from '../components/StatCard';
import { useMetricsContext } from '../hooks/useMetrics';

export default function TrafficPage() {
  const { metrics, history } = useMetricsContext();
  const m = metrics || {};

  const pieData =
    m.trafficDistribution?.map((b) => ({
      name: b.name,
      value: b.requests || 1,
    })) || [];

  const compression = m.compression || {};

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Req/s" value={(m.requestsPerSecond ?? 0).toFixed(1)} variant="accent" />
        <StatCard title="Total Requests" value={m.totalRequests ?? 0} />
        <StatCard
          title="Bandwidth Saved"
          value={formatBytes(compression.savingsBytes ?? 0)}
        />
        <StatCard
          title="Compression Ratio"
          value={((compression.overallRatio ?? 1) * 100).toFixed(0)}
          unit="%"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card">
          <h3 className="section-label mb-4">Backend Traffic Split</h3>
          <PieChartCard data={pieData} />
        </section>
        <section className="card">
          <h3 className="section-label mb-4">Request Timeline</h3>
          <TimeSeriesChart
            data={history}
            lines={[{ key: 'rps', name: 'Requests/s', color: '#0a0a0a' }]}
          />
        </section>
      </div>

      <section className="card overflow-x-auto">
        <h3 className="section-label mb-4">Per-Backend Utilization</h3>
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="text-edge-muted border-b border-edge-border">
              <th className="text-left py-2">Backend</th>
              <th className="text-right py-2">Requests</th>
              <th className="text-right py-2">%</th>
              <th className="text-right py-2">Connections</th>
              <th className="text-right py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {(m.trafficDistribution || []).map((b) => (
              <tr key={b.id} className="border-b border-edge-border/50">
                <td className="py-2">{b.name}</td>
                <td className="text-right">{b.requests}</td>
                <td className="text-right">{b.percentage}%</td>
                <td className="text-right">{b.activeConnections}</td>
                <td className="text-right">
                  <span className={b.healthy ? 'text-edge-foreground' : 'text-edge-muted'}>
                    {b.healthy ? 'UP' : 'DOWN'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
