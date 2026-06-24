'use strict';

import StatCard from '../components/StatCard';
import PageIntro, { SectionHeader } from '../components/PageIntro';
import { CacheNarrative } from '../components/SystemNarrative';
import { useMetricsContext } from '../hooks/useMetrics';
import { PAGE_META } from '../lib/interpret';

function Row({ label, value, hint }) {
  return (
    <div className="flex justify-between items-baseline py-2 border-b border-edge-border/40 last:border-0">
      <div>
        <span className="text-edge-muted text-sm">{label}</span>
        {hint && <p className="text-[10px] text-edge-muted/80 mt-0.5">{hint}</p>}
      </div>
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
  const hitPct = ((cache.combined?.hitRatio ?? 0) * 100).toFixed(1);

  return (
    <div className="space-y-8">
      <PageIntro
        title={meta.title}
        problem={meta.problem}
        description={meta.description}
        workflow={meta.workflow}
        tip={meta.tip}
      />

      <CacheNarrative metrics={metrics} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Combined Hit Ratio"
          value={hitPct}
          unit="%"
          hint={`${hitPct}% of requests answered from cache — the rest reached origin servers.`}
        />
        <StatCard
          title="L1 Hits"
          value={l1.hits ?? 0}
          hint="Served from in-memory cache — fastest path, no network hop."
        />
        <StatCard
          title="L2 Hits"
          value={l2.hits ?? 0}
          hint="Served from Redis — shared across proxy instances."
        />
        <StatCard
          title="L1 Size"
          value={`${l1.size ?? 0}/${l1.maxSize ?? 500}`}
          hint="Cache entries stored. When full, oldest entries are removed automatically."
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card">
          <SectionHeader
            title="L1 — In-Memory (LRU)"
            description="Checked first on every request. If the answer is here, the backend is never contacted."
          />
          <div className="space-y-0 font-mono text-sm">
            <Row label="Hits" value={l1.hits} hint="Requests answered from memory" />
            <Row label="Misses" value={l1.misses} hint="Not in L1 — checked L2 or backend next" />
            <Row label="Evictions" value={l1.evictions} hint="Entries removed when cache was full" />
            <Row label="Sets" value={l1.sets} hint="New entries stored after backend responses" />
            <Row
              label="Hit Ratio"
              value={`${((l1.hitRatio ?? 0) * 100).toFixed(1)}%`}
              hint="L1-only efficiency"
            />
          </div>
        </section>

        <section className="card">
          <SectionHeader
            title="L2 — Redis Distributed"
            description="Shared cache layer. Survives proxy restarts. Used when L1 misses but Redis has the answer."
          />
          <div className="space-y-0 font-mono text-sm">
            <Row
              label="Connected"
              value={l2.connected ? 'Yes' : 'No'}
              hint={l2.connected ? 'L2 is active' : 'Only L1 available'}
            />
            <Row label="Hits" value={l2.hits} hint="Requests answered from Redis" />
            <Row label="Misses" value={l2.misses} hint="Not in Redis — fetched from backend" />
            <Row label="Redis Keys" value={metrics?.redis?.keys ?? 0} hint="Cached entries in Redis" />
            <Row label="Memory" value={metrics?.redis?.memory ?? '-'} hint="Redis storage used" />
          </div>
        </section>
      </div>
    </div>
  );
}
