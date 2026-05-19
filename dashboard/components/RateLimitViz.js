'use strict';

export default function RateLimitViz({ rateLimit, rateLimitWindow, algorithm }) {
  const rl = rateLimit || {};
  const win = rateLimitWindow || {
    allowed: 0,
    blocked: 0,
    allowedPct: 100,
    blockedPct: 0,
    recent: [],
  };
  const max = rl.max ?? 100;
  const total = win.allowed + win.blocked;
  const usagePct = total > 0 ? Math.min(100, Math.round((total / max) * 100)) : 0;

  return (
    <div className="space-y-6">
      <section className="card">
        <h3 className="card-title">Rate limit gate</h3>
        <p className="card-subtitle mb-6">
          Every request is checked in Redis before reaching a backend. Over the limit →{' '}
          <code className="font-mono text-edge-foreground">429</code>. Algorithm:{' '}
          <span className="font-mono text-edge-foreground">{algorithm}</span>
        </p>

        <div className="relative mx-auto max-w-lg">
          <div className="flex items-stretch gap-px h-20 rounded-lg overflow-hidden border border-edge-border">
            <div
              className="flex-1 bg-neutral-50 flex flex-col items-center justify-center"
              style={{ flex: Math.max(win.allowedPct, 5) }}
            >
              <span className="text-2xl font-semibold text-edge-foreground">{win.allowed}</span>
              <span className="text-xs text-edge-muted mt-1">allowed (10s)</span>
            </div>
            <div className="w-px bg-edge-border shrink-0" />
            <div
              className="flex-1 bg-neutral-100 flex flex-col items-center justify-center"
              style={{ flex: Math.max(win.blockedPct, win.blocked > 0 ? 5 : 1) }}
            >
              <span className="text-2xl font-semibold text-edge-foreground">{win.blocked}</span>
              <span className="text-xs text-edge-muted mt-1">blocked (10s)</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-edge-muted mb-1">
              <span>Activity (rolling 10s)</span>
              <span className="font-mono">{total} checks · {max}/min per IP</span>
            </div>
            <div className="h-1.5 rounded-full bg-neutral-100 border border-edge-border overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-500"
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        </div>

        {!rl.redisConnected && (
          <p className="text-center text-sm text-edge-muted mt-4">
            Redis offline — gate is open (all requests pass through)
          </p>
        )}
      </section>

      <section className="card">
        <h3 className="card-title mb-3">Recent checks</h3>
        {!win.recent?.length ? (
          <div className="rounded-lg border border-dashed border-edge-border p-6 text-center">
            <p className="text-sm text-edge-muted">No rate-limit checks yet</p>
            <p className="text-xs text-edge-muted mt-2">
              Simulator → Rate limit flood → Send burst
            </p>
          </div>
        ) : (
          <div className="space-y-1 max-h-56 overflow-y-auto font-mono text-xs">
            {win.recent.map((e, i) => (
              <div
                key={`${e.ts}-${i}`}
                className={`flex gap-3 py-2 px-3 rounded-md ${
                  e.type === 'blocked' ? 'bg-neutral-100 border border-edge-border' : 'bg-neutral-50'
                }`}
              >
                <span className="text-edge-muted">{e.time}</span>
                <span
                  className={
                    e.type === 'blocked' ? 'text-edge-foreground font-semibold' : 'text-edge-muted'
                  }
                >
                  {e.type === 'blocked' ? 'BLOCKED' : 'ALLOWED'}
                </span>
                <span className="text-edge-muted">IP …{e.clientIp}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
