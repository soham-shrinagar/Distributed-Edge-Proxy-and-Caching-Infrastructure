'use strict';

import PieChartCard from '../charts/PieChartCard';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import StatCard from '../components/StatCard';
import PageIntro, { ChartPanel } from '../components/PageIntro';
import { useMetricsContext } from '../hooks/useMetrics';
import { PAGE_META } from '../lib/interpret';

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
  const savings = formatBytes(compression.savingsBytes ?? 0);

  return (
    <div className="space-y-8">
      <PageIntro
        title={meta.title}
        problem={meta.problem}
        description={meta.description}
        workflow={meta.workflow}
        tip={meta.tip}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Req/s"
          value={(m.requestsPerSecond ?? 0).toFixed(1)}
          hint="Current request rate — how much load the edge is handling right now."
        />
        <StatCard
          title="Total Requests"
          value={m.totalRequests ?? 0}
          hint="All requests processed since the proxy started."
        />
        <StatCard
          title="Bandwidth Saved"
          value={savings}
          hint={`${savings} of data not sent to users thanks to response compression.`}
        />
        <StatCard
          title="Compression Ratio"
          value={((compression.overallRatio ?? 1) * 100).toFixed(0)}
          unit="%"
          hint="How much smaller responses are after compression — higher means faster downloads."
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartPanel
          title="Backend Traffic Split"
          description="Shows which origin server handled traffic recently. Uneven slices may mean one server is overloaded or an algorithm favors it."
        >
          <PieChartCard data={pieData} />
        </ChartPanel>
        <ChartPanel
          title="Request Timeline"
          description="Traffic volume over the last minute. Use Simulator to generate load and watch the line move."
        >
          <TimeSeriesChart
            data={history}
            lines={[{ key: 'rps', name: 'Requests/s', color: '#09090b' }]}
          />
        </ChartPanel>
      </div>

      <section className="card overflow-x-auto">
        <p className="section-heading mb-1">Per-Backend Utilization</p>
        <p className="section-desc mb-5">
          Live breakdown per origin server. DOWN servers are excluded from routing — traffic goes elsewhere
          automatically.
        </p>
        <table className="w-full text-sm font-mono min-w-[480px]">
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
            {(m.trafficDistribution || []).length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-edge-muted text-sm">
                  No backend traffic yet — run Simulator → Load balancer demo to see this table fill.
                </td>
              </tr>
            )}
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
                    title={b.healthy ? 'Receiving traffic' : 'Excluded from load balancer'}
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
