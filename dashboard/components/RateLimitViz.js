'use strict';

import { SectionHeader, EmptyState } from './PageIntro';

export default function RateLimitViz({ rateLimit, rateLimitWindow, algorithm, algorithmLabel }) {
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
        <SectionHeader
          title="Rate limit gate"
          description={`Every request passes through this gate before reaching backends. Algorithm: ${algorithmLabel || algorithm}. Over the per-IP cap → HTTP 429.`}
        />

        <div className="relative mx-auto max-w-lg">
          <div className="flex items-stretch gap-px h-24 rounded-lg overflow-hidden border border-edge-border">
            <div
              className="flex-1 bg-neutral-50 flex flex-col items-center justify-center"
              style={{ flex: Math.max(win.allowedPct, 5) }}
            >
              <span className="text-3xl font-semibold font-mono text-edge-foreground">{win.allowed}</span>
              <span className="text-[11px] text-edge-muted mt-1">Passed through</span>
            </div>
            <div className="w-10 shrink-0 flex items-center justify-center bg-white border-x border-edge-border text-[10px] font-medium text-edge-muted [writing-mode:vertical-lr] rotate-180">
              Gate
            </div>
            <div
              className="flex-1 bg-neutral-100 flex flex-col items-center justify-center"
              style={{ flex: Math.max(win.blockedPct, win.blocked > 0 ? 5 : 1) }}
            >
              <span className="text-3xl font-semibold font-mono text-edge-foreground">{win.blocked}</span>
              <span className="text-[11px] text-edge-muted mt-1">HTTP 429 sent</span>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex justify-between text-xs text-edge-muted mb-2">
              <span>Rolling 10s activity</span>
              <span className="font-mono">{total} checks · {max}/min per IP</span>
            </div>
            <div className="h-2 rounded-full bg-neutral-100 border border-edge-border overflow-hidden">
              <div
                className="h-full bg-edge-foreground transition-all duration-500 rounded-full"
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        </div>

        {!rl.redisConnected && (
          <p className="text-center text-sm text-edge-muted mt-5 px-4 py-3 rounded-lg bg-neutral-50 border border-edge-border">
            Redis offline — gate is open. All requests pass through; rate limiting resumes when Redis
            reconnects.
          </p>
        )}
      </section>

      <section className="card">
        <SectionHeader
          title="Recent checks"
          description="Each incoming request is evaluated against the per-IP quota. BLOCKED means the client got HTTP 429."
        />
        {!win.recent?.length ? (
          <EmptyState title="No checks yet">
            <p>
              Run <strong>Simulator → Rate limit flood</strong> to exceed the per-IP cap. Blocked requests
              will appear here as they are rejected at the gate.
            </p>
          </EmptyState>
        ) : (
          <div className="space-y-1 max-h-56 overflow-y-auto font-mono text-xs">
            {win.recent.map((e, i) => (
              <div
                key={`${e.ts}-${i}`}
                className={`flex gap-3 py-2.5 px-3 rounded-lg ${
                  e.type === 'blocked'
                    ? 'bg-neutral-100 border border-edge-border'
                    : 'bg-neutral-50/80'
                }`}
              >
                <span className="text-edge-muted w-16 shrink-0">{e.time}</span>
                <span
                  className={`w-20 shrink-0 font-semibold ${
                    e.type === 'blocked' ? 'text-edge-foreground' : 'text-edge-muted'
                  }`}
                >
                  {e.type === 'blocked' ? 'BLOCKED' : 'OK'}
                </span>
                <span className="text-edge-muted">…{e.clientIp}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
