'use strict';

import PieChartCard from '../charts/PieChartCard';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import StatCard from '../components/StatCard';
import PageIntro, { ChartPanel } from '../components/PageIntro';
import { useMetricsContext } from '../hooks/useMetrics';
import { PAGE_META } from '../lib/pageMeta';

export default function TrafficPage() {
  const { metrics, history } = useMetricsContext();
  const m = metrics || {};
  const meta = PAGE_META['/traffic'];

  const pieData =
    m.trafficDistribution?.map((b) => ({
      name: b.name,
      value: b.requests || 1,
    })) || [];

  const compression = m.compression || {};

  return (
    <div className="space-y-8">
      <PageIntro title={meta.title} description={meta.description} tip={meta.tip} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Req/s"
          value={(m.requestsPerSecond ?? 0).toFixed(1)}
          hint="Current throughput"
        />
        <StatCard title="Total Requests" value={m.totalRequests ?? 0} hint="Lifetime count" />
        <StatCard
          title="Bandwidth Saved"
          value={formatBytes(compression.savingsBytes ?? 0)}
          hint="Via compression"
        />
        <StatCard
          title="Compression Ratio"
          value={((compression.overallRatio ?? 1) * 100).toFixed(0)}
          unit="%"
          hint="Bytes reduced"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartPanel
          title="Backend Traffic Split"
          description="Share of origin requests per backend in the last 10 seconds."
        >
          <PieChartCard data={pieData} />
        </ChartPanel>
        <ChartPanel title="Request Timeline" description="Requests per second over the last minute.">
          <TimeSeriesChart
            data={history}
            lines={[{ key: 'rps', name: 'Requests/s', color: '#09090b' }]}
          />
        </ChartPanel>
      </div>

      <section className="card overflow-x-auto">
        <p className="section-heading mb-1">Per-Backend Utilization</p>
        <p className="section-desc mb-5">Live connection and request counts per origin server.</p>
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="table-head">
              <th className="text-left py-3">Backend</th>
              <th className="text-right py-3">Requests</th>
              <th className="text-right py-3">%</th>
              <th className="text-right py-3">Connections</th>
              <th className="text-right py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(m.trafficDistribution || []).map((b) => (
              <tr key={b.id} className="table-row">
                <td className="py-3">{b.name}</td>
                <td className="text-right py-3">{b.requests}</td>
                <td className="text-right py-3">{b.percentage}%</td>
                <td className="text-right py-3">{b.activeConnections}</td>
                <td className="text-right py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs ${
                      b.healthy ? 'bg-neutral-100 text-edge-foreground' : 'bg-neutral-200 text-edge-muted'
                    }`}
                  >
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
