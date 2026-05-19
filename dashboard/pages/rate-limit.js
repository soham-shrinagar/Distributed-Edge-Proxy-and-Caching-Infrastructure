'use strict';

import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import RateLimitViz from '../components/RateLimitViz';
import { useMetricsContext } from '../hooks/useMetrics';
import { fetchAdmin } from '../services/ws';

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
      {!connected && (
        <div className="alert">WebSocket disconnected — metrics may be stale.</div>
      )}

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Blocked (10s)" value={metrics?.rateLimitWindow?.blocked ?? rl.limitedLast10s ?? 0} variant="danger" />
        <StatCard title="Allowed (10s)" value={metrics?.rateLimitWindow?.allowed ?? 0} variant="success" />
        <StatCard title="Blocked (total)" value={rl.limitedTotal ?? 0} variant="warning" />
        <StatCard title="Cap" value={`${rl.max ?? 100}/min`} />
      </div>

      <section>
        <p className="text-sm text-edge-muted mb-3">Switch algorithm (live)</p>
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

      <section className="card text-sm text-edge-foreground space-y-2">
        <p className="card-title">{policy.title}</p>
        <p>{policy.body}</p>
        <p className="text-edge-muted text-xs pt-2 border-t border-edge-border">
          Policy: <strong>{rl.max ?? 100} requests / minute / IP</strong> via Redis.
          Over limit → <code className="font-mono text-edge-foreground">429</code> + Retry-After header.
        </p>
      </section>
    </div>
  );
}
