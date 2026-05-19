'use strict';

import StatCard from '../components/StatCard';
import { useMetricsContext } from '../hooks/useMetrics';

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-edge-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default function CachePage() {
  const { metrics } = useMetricsContext();
  const cache = metrics?.cache || {};
  const l1 = cache.l1 || {};
  const l2 = cache.l2 || {};

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Combined Hit Ratio"
          value={((cache.combined?.hitRatio ?? 0) * 100).toFixed(1)}
          unit="%"
          variant="success"
        />
        <StatCard title="L1 Hits" value={l1.hits ?? 0} variant="accent" />
        <StatCard title="L2 Hits" value={l2.hits ?? 0} />
        <StatCard title="L1 Size" value={`${l1.size ?? 0}/${l1.maxSize ?? 500}`} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card">
          <h3 className="card-title text-base mb-4">L1 — In-Memory (LRU)</h3>
          <div className="space-y-3 font-mono text-sm">
            <Row label="Hits" value={l1.hits} />
            <Row label="Misses" value={l1.misses} />
            <Row label="Evictions" value={l1.evictions} />
            <Row label="Sets" value={l1.sets} />
            <Row label="Hit Ratio" value={`${((l1.hitRatio ?? 0) * 100).toFixed(1)}%`} />
          </div>
        </section>

        <section className="card">
          <h3 className="card-title text-base mb-4">L2 — Redis Distributed</h3>
          <div className="space-y-3 font-mono text-sm">
            <Row label="Connected" value={l2.connected ? 'Yes' : 'No'} />
            <Row label="Hits" value={l2.hits} />
            <Row label="Misses" value={l2.misses} />
            <Row label="Redis Keys" value={metrics?.redis?.keys ?? 0} />
            <Row label="Memory" value={metrics?.redis?.memory ?? '-'} />
          </div>
        </section>
      </div>
    </div>
  );
}
