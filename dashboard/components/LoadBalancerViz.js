'use strict';

const COLORS = {
  'backend-a': { bar: 'bg-neutral-900', ring: 'ring-black', text: 'text-black' },
  'backend-b': { bar: 'bg-neutral-600', ring: 'ring-neutral-600', text: 'text-neutral-600' },
  'backend-c': { bar: 'bg-neutral-400', ring: 'ring-neutral-400', text: 'text-neutral-500' },
  cache: { bar: 'bg-neutral-300', ring: 'ring-neutral-400', text: 'text-neutral-500' },
};

function colorFor(id) {
  return COLORS[id] || { bar: 'bg-neutral-400', ring: 'ring-neutral-400', text: 'text-neutral-500' };
}

export default function LoadBalancerViz({ backends, distribution, routingLog, algorithm }) {
  const last = routingLog?.[0];
  const activeId = last?.backendId || null;
  const totalReqs = distribution.reduce((s, d) => s + (d.requests || 0), 0);

  return (
    <div className="space-y-6">
      <section className="card">
        <h3 className="card-title">How traffic flows</h3>
        <p className="card-subtitle mb-6">
          Each request hits the edge proxy first. The proxy picks a backend using{' '}
          <span className="font-mono text-edge-foreground">{algorithm}</span>, then forwards
          the request. Cached responses skip backends.
        </p>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6 py-4">
          <div className="text-center px-4 py-3 rounded-lg border border-edge-border bg-edge-surface">
            <p className="section-label">Client</p>
            <p className="text-lg mt-2 text-edge-foreground">◎</p>
          </div>

          <span className="text-edge-muted text-xl hidden sm:block">→</span>

          <div
            className={`text-center px-6 py-4 rounded-lg border-2 ${
              last ? 'border-black bg-neutral-50' : 'border-edge-border bg-white'
            }`}
          >
            <p className="section-label">Edge proxy</p>
            <p className="font-mono text-sm mt-1 text-edge-foreground">:8080</p>
            {last && (
              <p className="text-xs mt-2 text-edge-muted">
                Last:{' '}
                {last.outcome === 'cache-hit' ? 'served from cache' : `→ ${last.backendName}`}
              </p>
            )}
          </div>

          <span className="text-edge-muted text-xl hidden sm:block">→</span>

          <div className="flex flex-wrap justify-center gap-3">
            {backends.map((b) => {
              const c = colorFor(b.id);
              const isActive = activeId === b.id;
              const inFlight = b.activeConnections > 0;
              const port = b.url ? new URL(b.url).port : '?';
              return (
                <div
                  key={b.id}
                  className={`relative text-center px-4 py-3 rounded-lg border min-w-[100px] transition-all ${
                    isActive
                      ? `border-black ring-1 ring-black bg-neutral-50 scale-[1.02]`
                      : inFlight
                        ? 'border-neutral-400 bg-neutral-50'
                        : b.healthy
                          ? 'border-edge-border bg-white'
                          : 'border-neutral-400 bg-neutral-100'
                  }`}
                >
                  <p className={`text-xs font-medium ${c.text}`}>{b.name}</p>
                  <p className="text-xs text-edge-muted mt-1 font-mono">:{port}</p>
                  <p className="text-lg font-mono mt-1 text-edge-foreground">{b.activeConnections}</p>
                  <p className="text-[10px] text-edge-muted">in-flight</p>
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
              className={`relative text-center px-4 py-3 rounded-lg border min-w-[100px] ${
                activeId === 'cache'
                  ? 'border-black ring-1 ring-black bg-neutral-50 scale-[1.02]'
                  : 'border-edge-border bg-white'
              }`}
            >
              <p className="text-xs font-medium text-edge-foreground">Cache</p>
              <p className="text-[10px] text-edge-muted mt-1">L1 + Redis</p>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="flex justify-between items-baseline mb-4">
          <h3 className="card-title">Traffic split (last 10s)</h3>
          <span className="text-xs text-edge-muted font-mono">{totalReqs} origin requests</span>
        </div>
        {totalReqs === 0 ? (
          <div className="rounded-lg border border-dashed border-edge-border p-8 text-center">
            <p className="text-sm text-edge-muted">No backend traffic yet</p>
            <p className="text-xs text-edge-muted mt-2">
              Simulator → Load balancer demo → Start (cache bust OFF)
            </p>
          </div>
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
        <h3 className="card-title mb-3">Live routing log</h3>
        {!routingLog?.length ? (
          <p className="text-sm text-edge-muted">Waiting for requests through the proxy…</p>
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
