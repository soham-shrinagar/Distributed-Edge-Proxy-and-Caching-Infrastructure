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
      <PageIntro
        title={meta.title}
        problem={meta.problem}
        description={meta.description}
        workflow={meta.workflow}
        tip={meta.tip}
      />

      {!connected && (
        <OutcomeBanner title={CONNECTION_STATUS.disconnected.label}>
          {CONNECTION_STATUS.disconnected.detail}
        </OutcomeBanner>
      )}

      {!redisOk && (
        <OutcomeBanner title="Rate limiting disabled">
          Redis is offline, so the gate is open — all requests pass through. Start Redis and restart the proxy
          to enforce per-IP limits again.
        </OutcomeBanner>
      )}

      {redisOk && blocked > 0 && (
        <OutcomeBanner title="Rate limit is active">
          {blocked} request{blocked !== 1 ? 's' : ''} blocked in the last 10 seconds. Those clients received HTTP
          429 — backends were protected from the excess load.
        </OutcomeBanner>
      )}

      <RateLimitViz
        rateLimit={rl}
        rateLimitWindow={metrics?.rateLimitWindow}
        algorithm={algo}
        algorithmLabel={policy.label}
      />

      <section>
        <p className="section-label mb-1">Gate activity</p>
        <p className="text-xs text-edge-muted mb-4">
          Every request is checked before it reaches a backend. Blocked requests stop here.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Blocked (10s)"
            value={blocked}
            hint="Recent requests rejected with HTTP 429 — never reached a backend."
          />
          <StatCard
            title="Allowed (10s)"
            value={metrics?.rateLimitWindow?.allowed ?? 0}
            hint="Requests under the per-IP cap that proceeded to routing and backends."
          />
          <StatCard
            title="Blocked (total)"
            value={rl.limitedTotal ?? 0}
            hint="All-time blocked requests since the proxy started."
          />
          <StatCard
            title="Cap"
            value={`${rl.max ?? 100}/min`}
            hint="Maximum requests allowed per client IP per minute."
          />
        </div>
      </section>

      <section className="card">
        <SectionHeader
          title="Counting algorithm"
          description="Click to switch how the proxy counts requests. Behavior changes immediately for new traffic."
        />
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
        <div className="mt-4 space-y-2 text-sm leading-relaxed">
          <p className="font-medium text-edge-foreground">{policy.label}</p>
          <p className="text-edge-muted">{policy.summary}</p>
          <p className="text-edge-muted">
            <span className="text-edge-foreground">What you will see:</span> {policy.outcome}
          </p>
        </div>
      </section>

      <section className="card space-y-2">
        <p className="card-title">How blocking works</p>
        <p className="text-sm text-edge-muted leading-relaxed">
          Each client IP gets <strong>{rl.max ?? 100} requests per minute</strong>. When they exceed that,
          the proxy responds with <code className="font-mono text-edge-foreground">429 Too Many Requests</code>{' '}
          and a Retry-After header — the backend never sees those requests.
        </p>
      </section>
    </div>
  );
}
