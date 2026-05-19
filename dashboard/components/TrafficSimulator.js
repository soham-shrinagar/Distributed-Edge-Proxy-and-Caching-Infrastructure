'use strict';

import { useState, useRef, useCallback } from 'react';
import { sendProxyRequest, ENDPOINTS } from '../services/proxy';

const PRESETS = [
  { label: 'Light', intervalMs: 500 },
  { label: 'Normal', intervalMs: 200 },
  { label: 'Heavy', intervalMs: 80 },
  { label: 'Flood', intervalMs: 0 },
];

const SCENARIOS = [
  {
    id: 'lb-demo',
    name: 'Load balancer demo',
    description: 'Steady traffic, cache OFF — watch Backends page split traffic live',
    cacheBust: false,
    intervalMs: 120,
    chaos: false,
    autoStart: true,
  },
  {
    id: 'rate-flood',
    name: 'Rate limit flood',
    description: 'Max-speed burst — triggers 429s on Rate Limit page',
    cacheBust: true,
    intervalMs: 0,
    chaos: false,
    burst: 180,
  },
  {
    id: 'errors',
    name: 'Error & failover',
    description: 'Injects ~35% 500s and timeouts via X-Edge-Chaos header',
    cacheBust: true,
    intervalMs: 150,
    chaos: true,
    autoStart: true,
  },
  {
    id: 'cache-warm',
    name: 'Cache warming',
    description: 'Same URLs repeatedly — cache HIT ratio climbs',
    cacheBust: false,
    intervalMs: 80,
    chaos: false,
    burst: 40,
  },
  {
    id: 'mixed',
    name: 'Mixed traffic',
    description: 'Random endpoints at normal pace',
    cacheBust: false,
    intervalMs: 200,
    chaos: false,
  },
];

function emptyStats() {
  return {
    sent: 0,
    ok: 0,
    errors: 0,
    rateLimited: 0,
    cacheHits: 0,
    cacheMisses: 0,
    chaos: 0,
    totalLatency: 0,
  };
}

export default function TrafficSimulator() {
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState(['products', 'users', 'analytics']);
  const [intervalMs, setIntervalMs] = useState(200);
  const [cacheBust, setCacheBust] = useState(false);
  const [chaos, setChaos] = useState(false);
  const [burstCount, setBurstCount] = useState(20);
  const [activeScenario, setActiveScenario] = useState(null);
  const [stats, setStats] = useState(emptyStats);
  const [recent, setRecent] = useState([]);

  const runningRef = useRef(false);
  const statsRef = useRef(emptyStats());
  const chaosRef = useRef(false);
  const cacheBustRef = useRef(false);

  chaosRef.current = chaos;
  cacheBustRef.current = cacheBust;

  const updateStats = useCallback((result) => {
    const s = statsRef.current;
    s.sent += 1;
    s.totalLatency += result.latency;
    if (result.status === 429) s.rateLimited += 1;
    else if (result.ok) s.ok += 1;
    else s.errors += 1;
    if (result.cache === 'HIT') s.cacheHits += 1;
    else if (result.cache === 'MISS') s.cacheMisses += 1;
    if (result.chaos) s.chaos += 1;
    statsRef.current = s;
    setStats({ ...s });
    setRecent((prev) => [{ ...result, id: `${Date.now()}-${Math.random()}` }, ...prev].slice(0, 20));
  }, []);

  const fireOne = useCallback(async () => {
    const enabled = ENDPOINTS.filter((e) => selected.includes(e.id));
    if (!enabled.length) return;
    const ep = enabled[Math.floor(Math.random() * enabled.length)];
    try {
      const result = await sendProxyRequest(ep.path, {
        cacheBust: cacheBustRef.current,
        chaos: chaosRef.current,
      });
      updateStats(result);
    } catch (err) {
      updateStats({
        ok: false,
        status: 0,
        latency: 0,
        cache: '-',
        backend: '-',
        path: ep.path,
        chaos: chaosRef.current,
        error: err.message,
      });
    }
  }, [selected, updateStats]);

  const startContinuous = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);

    const loop = async () => {
      while (runningRef.current) {
        await fireOne();
        if (intervalMs > 0) await new Promise((r) => setTimeout(r, intervalMs));
      }
    };
    loop();
  }, [fireOne, intervalMs]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
  }, []);

  const runBurst = useCallback(
    async (count) => {
      const n = Math.min(Math.max(1, count ?? burstCount), 500);
      for (let i = 0; i < n; i++) await fireOne();
    },
    [burstCount, fireOne]
  );

  const reset = useCallback(() => {
    statsRef.current = emptyStats();
    setStats(emptyStats());
    setRecent([]);
    setActiveScenario(null);
  }, []);

  const applyScenario = useCallback(
    async (scenario) => {
      stop();
      setActiveScenario(scenario.id);
      setCacheBust(scenario.cacheBust);
      setChaos(scenario.chaos ?? false);
      setIntervalMs(scenario.intervalMs ?? 200);
      if (scenario.burst) setBurstCount(scenario.burst);
      cacheBustRef.current = scenario.cacheBust;
      chaosRef.current = scenario.chaos ?? false;
      if (scenario.burst) {
        await runBurst(scenario.burst);
        if (scenario.autoStart) setTimeout(() => startContinuous(), 100);
      } else if (scenario.autoStart) {
        setTimeout(() => startContinuous(), 50);
      }
    },
    [stop, runBurst, startContinuous]
  );

  const toggleEndpoint = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const avgLatency = stats.sent > 0 ? Math.round(stats.totalLatency / stats.sent) : 0;

  return (
    <div className="space-y-6">
      <section className="card">
        <h3 className="card-title">Scenario presets</h3>
        <p className="card-subtitle mb-4">One-click demos for Backends, Rate Limit, Cache, and failover.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={running}
              onClick={() => applyScenario(s)}
              className={`text-left p-4 rounded-lg border transition-colors disabled:opacity-40 ${
                activeScenario === s.id
                  ? 'border-black bg-neutral-50'
                  : 'border-edge-border hover:border-neutral-400 hover:bg-neutral-50'
              }`}
            >
              <p className="text-sm font-medium text-edge-foreground">{s.name}</p>
              <p className="text-xs text-edge-muted mt-1">{s.description}</p>
              {s.chaos && (
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded border border-edge-border text-edge-muted">
                  chaos
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h3 className="card-title">Manual controls</h3>
        <p className="card-subtitle mb-6">Real HTTP through the edge proxy. Metrics update via WebSocket.</p>

        <div className="space-y-5">
          <div>
            <label className="section-label">Endpoints</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {ENDPOINTS.map((ep) => (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => toggleEndpoint(ep.id)}
                  className={`chip ${selected.includes(ep.id) ? 'chip-active' : ''}`}
                >
                  {ep.path}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="section-label">Interval: {intervalMs}ms</label>
              <input
                type="range"
                min={0}
                max={2000}
                step={50}
                value={intervalMs}
                onChange={(e) => setIntervalMs(Number(e.target.value))}
                disabled={running}
                className="w-full mt-2 accent-black"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    disabled={running}
                    onClick={() => setIntervalMs(p.intervalMs)}
                    className="chip text-xs"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="section-label">Burst size</label>
              <input
                type="number"
                min={1}
                max={500}
                value={burstCount}
                onChange={(e) => setBurstCount(Number(e.target.value))}
                disabled={running}
                className="input-field mt-2"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm text-edge-foreground">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={cacheBust} onChange={(e) => setCacheBust(e.target.checked)} />
              Cache bust (unique URL → always MISS)
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={chaos} onChange={(e) => setChaos(e.target.checked)} />
              Error simulation (X-Edge-Chaos header)
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            {!running ? (
              <button
                type="button"
                onClick={startContinuous}
                disabled={!selected.length}
                className="btn-primary"
              >
                Start continuous
              </button>
            ) : (
              <button type="button" onClick={stop} className="btn-danger">
                Stop
              </button>
            )}
            <button
              type="button"
              onClick={() => runBurst()}
              disabled={running || !selected.length}
              className="btn-secondary"
            >
              Send burst ({burstCount})
            </button>
            <button
              type="button"
              onClick={fireOne}
              disabled={running || !selected.length}
              className="btn-secondary"
            >
              Single request
            </button>
            <button type="button" onClick={reset} className="btn-secondary text-edge-muted">
              Reset stats
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <MiniStat label="Sent" value={stats.sent} />
        <MiniStat label="OK" value={stats.ok} />
        <MiniStat label="Errors" value={stats.errors} muted />
        <MiniStat label="429" value={stats.rateLimited} muted />
        <MiniStat label="Chaos" value={stats.chaos} muted />
        <MiniStat label="HIT" value={stats.cacheHits} />
        <MiniStat label="MISS" value={stats.cacheMisses} muted />
        <MiniStat label="Avg ms" value={avgLatency} />
      </div>

      {running && (
        <p className="text-sm text-edge-muted">Sending traffic{chaos ? ' (chaos on)' : ''}…</p>
      )}

      <section className="card">
        <h3 className="section-label mb-3">Recent requests</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-edge-muted">Pick a scenario or press Start</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="table-head">
                  <th className="text-left py-2">Path</th>
                  <th className="text-right py-2">Status</th>
                  <th className="text-right py-2">ms</th>
                  <th className="text-center py-2">Cache</th>
                  <th className="text-left py-2">Backend</th>
                  <th className="text-center py-2">Chaos</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="table-row">
                    <td className="py-2 text-edge-foreground">{r.path}</td>
                    <td className="text-right py-2 text-edge-foreground">{r.status || 'ERR'}</td>
                    <td className="text-right py-2">{r.latency}</td>
                    <td className="text-center py-2">{r.cache}</td>
                    <td className="py-2 text-edge-muted">{r.backend}</td>
                    <td className="text-center py-2">{r.chaos ? '·' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function MiniStat({ label, value, muted }) {
  return (
    <div className="card p-4 text-center">
      <p className="section-label">{label}</p>
      <p className={`text-xl font-semibold font-mono mt-1 ${muted ? 'text-edge-muted' : 'text-edge-foreground'}`}>
        {value}
      </p>
    </div>
  );
}
