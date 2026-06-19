'use strict';

import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import PageIntro, { SectionHeader } from '../components/PageIntro';
import RateLimitViz from '../components/RateLimitViz';
import { useMetricsContext } from '../hooks/useMetrics';
import { fetchAdmin } from '../services/ws';
import { PAGE_META } from '../lib/pageMeta';

const ALGORITHMS = ['token-bucket', 'fixed-window', 'sliding-window'];

const POLICY = {
  'token-bucket': {
    title: 'Token bucket',
    body: 'Tokens refill smoothly over time. Allows short bursts, then throttles. Best for APIs with occasional spikes.',
  },
  'fixed-window': {
    title: 'Fixed window',
    body: 'Counts requests per calendar minute window, then resets. Simple; can allow 2× traffic at window boundaries.',
  },
  'sliding-window': {
    title: 'Sliding window',
    body: 'Counts requests in the rolling last 60 seconds. Stricter and smoother than fixed window.',
  },
};

export default function RateLimitPage() {
  const { metrics, connected } = useMetricsContext();
  const rl = metrics?.rateLimit || {};
  const [algo, setAlgo] = useState('token-bucket');
  const meta = PAGE_META['/rate-limit'];

  useEffect(() => {
    if (rl.algorithm) setAlgo(rl.algorithm);
  }, [rl.algorithm]);

  const policy = POLICY[algo] || POLICY['token-bucket'];
  const redisOk = rl.redisConnected ?? metrics?.redis?.connected;

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
      <PageIntro title={meta.title} description={meta.description} tip={meta.tip} />

      {!connected && <div className="alert">WebSocket disconnected — metrics may be stale.</div>}

      {!redisOk && (
        <div className="alert">
          Redis is offline — rate limiting is <strong>disabled</strong>. Start Redis and restart the
          proxy.
        </div>
      )}

      <RateLimitViz
        rateLimit={rl}
        rateLimitWindow={metrics?.rateLimitWindow}
        algorithm={algo}
      />

      <section>
        <p className="section-label mb-4">Counters</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Blocked (10s)"
            value={metrics?.rateLimitWindow?.blocked ?? rl.limitedLast10s ?? 0}
            hint="Recent rejections"
          />
          <StatCard
            title="Allowed (10s)"
            value={metrics?.rateLimitWindow?.allowed ?? 0}
            hint="Passed the gate"
          />
          <StatCard
            title="Blocked (total)"
            value={rl.limitedTotal ?? 0}
            hint="All-time 429s"
          />
          <StatCard title="Cap" value={`${rl.max ?? 100}/min`} hint="Per client IP" />
        </div>
      </section>

      <section className="card">
        <SectionHeader
          title="Algorithm"
          description="Each approach counts requests differently — switch to compare behavior."
        />
        <div className="flex flex-wrap gap-2">
          {ALGORITHMS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => switchAlgo(a)}
              className={algo === a ? 'chip chip-active' : 'chip'}
            >
              {a}
            </button>
          ))}
        </div>
      </section>

      <section className="card space-y-2">
        <p className="card-title">{policy.title}</p>
        <p className="text-sm text-edge-muted leading-relaxed">{policy.body}</p>
        <p className="text-xs text-edge-muted pt-4 border-t border-edge-border">
          Policy: <strong>{rl.max ?? 100} requests / minute / IP</strong> via Redis. Over limit →{' '}
          <code className="font-mono text-edge-foreground">429</code> + Retry-After header.
        </p>
      </section>
    </div>
  );
}
