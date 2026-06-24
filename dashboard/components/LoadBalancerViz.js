'use strict';

import { SectionHeader, EmptyState } from './PageIntro';

const COLORS = {
  'backend-a': { bar: 'bg-neutral-900', ring: 'ring-black', text: 'text-black' },
  'backend-b': { bar: 'bg-neutral-600', ring: 'ring-neutral-600', text: 'text-neutral-600' },
  'backend-c': { bar: 'bg-neutral-400', ring: 'ring-neutral-400', text: 'text-neutral-500' },
  cache: { bar: 'bg-neutral-300', ring: 'ring-neutral-400', text: 'text-neutral-500' },
};

function colorFor(id) {
  return COLORS[id] || { bar: 'bg-neutral-400', ring: 'ring-neutral-400', text: 'text-neutral-500' };
}

export default function LoadBalancerViz({ backends, distribution, routingLog, algorithm, algorithmLabel }) {
  const last = routingLog?.[0];
  const activeId = last?.backendId || null;
  const totalReqs = distribution.reduce((s, d) => s + (d.requests || 0), 0);

  return (
    <div className="space-y-6">
      <section className="card">
        <SectionHeader
          title="Request path"
          description="Follow each request: Client → Edge proxy → Backend or Cache. The highlighted node shows where the most recent request was handled."
        />

        <div className="flex flex-col items-stretch sm:items-center lg:flex-row justify-center gap-2 sm:gap-3 lg:gap-5 py-4 sm:py-6">
          <div className="flow-node max-w-xs sm:max-w-none mx-auto sm:mx-0">
            <p className="section-label">1 · Client</p>
            <p className="text-xs text-edge-muted mt-2">User or app sends HTTP request</p>
          </div>

          <span className="flow-arrow text-center sm:hidden">↓</span>
          <span className="flow-arrow hidden sm:block lg:block">→</span>

          <div className={`flow-node px-4 sm:px-6 max-w-xs sm:max-w-none mx-auto sm:mx-0 ${last ? 'flow-node-active' : ''}`}>
            <p className="section-label">2 · Edge proxy</p>
            <p className="font-mono text-sm mt-2 text-edge-foreground">:8080</p>
            <p className="text-[10px] text-edge-muted mt-1 font-mono">{algorithmLabel || algorithm}</p>
            {last && (
              <p className="text-[11px] mt-2 text-edge-muted">
                {last.outcome === 'cache-hit'
                  ? 'Answered from cache — backend skipped'
                  : `Routed to ${last.backendName}`}
              </p>
            )}
          </div>

          <span className="flow-arrow text-center sm:hidden">↓</span>
          <span className="flow-arrow hidden sm:block">→</span>

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 w-full sm:w-auto">
            {backends.map((b) => {
              const c = colorFor(b.id);
              const isActive = activeId === b.id;
              const port = b.url ? new URL(b.url).port : '?';
              return (
                <div
                  key={b.id}
                  className={`relative flow-node min-w-0 sm:min-w-[108px] ${
                    isActive ? 'flow-node-active' : ''
                  } ${!b.healthy ? 'opacity-60' : ''}`}
                >
                  <p className={`text-xs font-medium ${c.text}`}>{b.name}</p>
                  <p className="text-xs text-edge-muted mt-1 font-mono">:{port}</p>
                  <p className="text-lg font-mono mt-1 text-edge-foreground">{b.activeConnections}</p>
                  <p className="text-[10px] text-edge-muted">active requests</p>
                  {!b.healthy && (
                    <span className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded bg-black text-white">
                      DOWN
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-full bg-black text-white font-medium">
                      routed
                    </span>
                  )}
                </div>
              );
            })}
            <div
              className={`flow-node min-w-0 sm:min-w-[108px] ${activeId === 'cache' ? 'flow-node-active' : ''}`}
            >
              <p className="text-xs font-medium text-edge-foreground">Cache</p>
              <p className="text-[10px] text-edge-muted mt-1">Fast path if answer is stored</p>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <SectionHeader
          title="Traffic split"
          description="How origin traffic was divided across backends in the last 10 seconds. Cache hits are not counted — they never reach a backend."
          action={
            <span className="text-xs text-edge-muted font-mono bg-neutral-50 px-2 py-1 rounded-md border border-edge-border">
              {totalReqs} reqs
            </span>
          }
        />
        {totalReqs === 0 ? (
          <EmptyState title="Waiting for backend traffic">
            <p>
              Run <strong>Simulator → Load balancer demo</strong> with cache bust OFF. As requests hit each
              server, this bar shows how load is distributed.
            </p>
          </EmptyState>
        ) : (
          <>
            <div className="flex h-6 rounded-md overflow-hidden mb-4 border border-edge-border">
              {distribution.map((d) => {
                const pct = d.percentage || 0;
                if (pct <= 0) return null;
                const c = colorFor(d.id);
                return (
                  <div
                    key={d.id}
                    className={`${c.bar} flex items-center justify-center text-[10px] font-medium text-white transition-all duration-500`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                    title={`${d.name}: ${pct}%`}
                  >
                    {pct >= 12 ? `${pct}%` : ''}
                  </div>
                );
              })}
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {distribution.map((d) => {
                const c = colorFor(d.id);
                return (
                  <div key={d.id} className="flex items-center gap-2 text-sm">
                    <span className={`w-2.5 h-2.5 rounded-full ${c.bar}`} />
                    <span className="text-edge-muted">{d.name}</span>
                    <span className="font-mono ml-auto text-edge-foreground">{d.requests}</span>
                    <span className={`font-semibold ${c.text}`}>{d.percentage}%</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section className="card">
        <SectionHeader
          title="Live routing log"
          description="Newest request at top. Each line shows what the proxy decided and the outcome for that request."
        />
        {!routingLog?.length ? (
          <EmptyState title="No requests yet">
            <p>
              Send traffic via Simulator. Each entry will show the path taken — cache hit, backend routed,
              blocked, or failed.
            </p>
          </EmptyState>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
            {routingLog.map((e, i) => (
              <div
                key={`${e.ts}-${i}`}
                className={`flex flex-wrap gap-x-3 gap-y-1 py-2 px-3 rounded-md ${
                  i === 0 ? 'bg-neutral-100 border border-edge-border' : 'bg-neutral-50'
                }`}
              >
                <span className="text-edge-muted">{e.time}</span>
                <span className={outcomeColor(e.outcome)}>{outcomeLabel(e)}</span>
                <span className="text-edge-foreground">{e.path}</span>
                {e.status > 0 && <span className="text-edge-muted">HTTP {e.status}</span>}
                {e.error && <span className="text-edge-muted truncate">{e.error}</span>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function outcomeColor(outcome) {
  if (outcome === 'cache-hit') return 'text-edge-foreground font-medium';
  if (outcome === 'rate-limited') return 'text-edge-muted font-medium';
  if (outcome === 'success') return 'text-edge-foreground';
  if (outcome === 'failed') return 'text-edge-muted line-through';
  return 'text-edge-muted';
}

function outcomeLabel(e) {
  if (e.outcome === 'cache-hit') return `CACHE ← ${e.backendName}`;
  if (e.outcome === 'rate-limited') return 'BLOCKED';
  if (e.outcome === 'failed') return `FAIL @ ${e.backendName}`;
  if (e.backendId === 'cache') return 'CACHE';
  return `→ ${e.backendName}`;
}
