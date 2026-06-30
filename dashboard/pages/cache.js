'use strict';

import StatCard from '../components/StatCard';
import PageIntro, { SectionHeader } from '../components/PageIntro';
import { CacheNarrative } from '../components/SystemNarrative';
import { useMetricsContext } from '../hooks/useMetrics';
import { PAGE_META } from '../lib/interpret';

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-baseline py-2 border-b border-edge-border/40 last:border-0">
      <span className="text-edge-muted text-sm">{label}</span>
      <span className="font-mono text-sm text-edge-foreground">{value}</span>
    </div>
  );
}

export default function CachePage() {
  const { metrics } = useMetricsContext();
  const cache = metrics?.cache || {};
  const l1 = cache.l1 || {};
  const l2 = cache.l2 || {};
  const meta = PAGE_META['/cache'];

  return (
    <div className="space-y-8">
      <PageIntro title={meta.title} description={meta.description} />
      <CacheNarrative metrics={metrics} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Combined Hit Ratio"
          value={((cache.combined?.hitRatio ?? 0) * 100).toFixed(1)}
          unit="%"
        />
        <StatCard title="L1 Hits" value={l1.hits ?? 0} />
        <StatCard title="L2 Hits" value={l2.hits ?? 0} />
        <StatCard title="L1 Size" value={`${l1.size ?? 0}/${l1.maxSize ?? 500}`} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card">
          <SectionHeader title="L1 — In-Memory (LRU)" />
          <div className="space-y-0 font-mono text-sm">
            <Row label="Hits" value={l1.hits} />
            <Row label="Misses" value={l1.misses} />
            <Row label="Evictions" value={l1.evictions} />
            <Row label="Sets" value={l1.sets} />
            <Row label="Hit Ratio" value={`${((l1.hitRatio ?? 0) * 100).toFixed(1)}%`} />
          </div>
        </section>

        <section className="card">
          <SectionHeader title="L2 — Redis" />
          <div className="space-y-0 font-mono text-sm">
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
