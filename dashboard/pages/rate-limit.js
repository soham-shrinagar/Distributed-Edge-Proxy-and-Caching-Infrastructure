'use strict';

import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import PageIntro, { SectionHeader, OutcomeBanner } from '../components/PageIntro';
import RateLimitViz from '../components/RateLimitViz';
import { useMetricsContext } from '../hooks/useMetrics';
import { fetchAdmin } from '../services/ws';
import { PAGE_META, RATE_LIMIT_ALGORITHMS, CONNECTION_STATUS } from '../lib/interpret';

const ALGORITHMS = ['token-bucket', 'fixed-window', 'sliding-window'];

export default function RateLimitPage() {
  const { metrics, connected } = useMetricsContext();
  const rl = metrics?.rateLimit || {};
  const [algo, setAlgo] = useState('token-bucket');
  const meta = PAGE_META['/rate-limit'];

  useEffect(() => {
    if (rl.algorithm) setAlgo(rl.algorithm);
  }, [rl.algorithm]);

  const policy = RATE_LIMIT_ALGORITHMS[algo] || RATE_LIMIT_ALGORITHMS['token-bucket'];
  const redisOk = rl.redisConnected ?? metrics?.redis?.connected;
  const blocked = metrics?.rateLimitWindow?.blocked ?? rl.limitedLast10s ?? 0;

  async function switchAlgo(name) {
    await fetchAdmin('rate-limiter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ algorithm: name }),
    });
    setAlgo(name);
  }

  return (
    <div className="space-y-8">
      <PageIntro title={meta.title} description={meta.description} />

      {!connected && <OutcomeBanner>{CONNECTION_STATUS.disconnected.detail}</OutcomeBanner>}
      {!redisOk && <OutcomeBanner>Redis offline — rate limiting disabled.</OutcomeBanner>}

      <RateLimitViz
        rateLimit={rl}
        rateLimitWindow={metrics?.rateLimitWindow}
        algorithm={algo}
        algorithmLabel={policy.label}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Blocked (10s)" value={blocked} />
        <StatCard title="Allowed (10s)" value={metrics?.rateLimitWindow?.allowed ?? 0} />
        <StatCard title="Blocked (total)" value={rl.limitedTotal ?? 0} />
        <StatCard title="Cap" value={`${rl.max ?? 100}/min`} />
      </div>

      <section className="card">
        <SectionHeader title="Algorithm" />
        <div className="flex flex-wrap gap-2">
          {ALGORITHMS.map((a) => {
            const info = RATE_LIMIT_ALGORITHMS[a];
            return (
              <button
                key={a}
                type="button"
                onClick={() => switchAlgo(a)}
                className={algo === a ? 'chip chip-active' : 'chip'}
                title={info?.summary}
              >
                {info?.label || a}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-edge-muted mt-4">{policy.summary}</p>
        <p className="text-xs text-edge-muted mt-3 pt-3 border-t border-edge-border">
          {rl.max ?? 100} requests/min per IP · over limit → 429
        </p>
      </section>
    </div>
  );
}
