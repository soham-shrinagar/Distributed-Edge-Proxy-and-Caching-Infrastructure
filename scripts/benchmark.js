'use strict';

const autocannon = require('autocannon');

const PROXY = process.env.PROXY_URL || 'http://127.0.0.1:8080';
const DIRECT = process.env.DIRECT_URL || 'http://127.0.0.1:3001';

async function benchmark(label, url, duration = 15) {
  return new Promise((resolve, reject) => {
    autocannon({ url, connections: 20, duration }, (err, result) => {
      if (err) return reject(err);
      resolve({
        label,
        requests: result.requests.total,
        throughput: result.requests.average,
        latencyAvg: result.latency.average,
        latencyP99: result.latency.p99,
        errors: result.errors,
      });
    });
  });
}

async function main() {
  console.log('EdgeFlow Performance Benchmark\n');

  const phases = [
    { label: 'Direct Backend (no proxy)', url: `${DIRECT}/products` },
    { label: 'Proxy — Cold Cache', url: `${PROXY}/products?bench=cold-${Date.now()}` },
  ];

  const cold = await benchmark(phases[0].label, phases[0].url);
  const coldProxy = await benchmark(phases[1].label, phases[1].url);

  await new Promise((r) => setTimeout(r, 500));
  const warmProxy = await benchmark('Proxy — Warm Cache', `${PROXY}/products`);

  const results = [cold, coldProxy, warmProxy];

  console.log('\n┌─────────────────────────────┬──────────┬──────────┬──────────┐');
  console.log('│ Scenario                    │ Req/s    │ Avg ms   │ P99 ms   │');
  console.log('├─────────────────────────────┼──────────┼──────────┼──────────┤');
  for (const r of results) {
    const name = r.label.padEnd(27);
    console.log(
      `│ ${name} │ ${String(r.throughput.toFixed(1)).padStart(8)} │ ${String(r.latencyAvg.toFixed(1)).padStart(8)} │ ${String(r.latencyP99.toFixed(1)).padStart(8)} │`
    );
  }
  console.log('└─────────────────────────────┴──────────┴──────────┴──────────┘');

  const improvement =
    coldProxy.latencyAvg > 0
      ? ((coldProxy.latencyAvg - warmProxy.latencyAvg) / coldProxy.latencyAvg) * 100
      : 0;

  console.log(`\nCache latency improvement: ~${improvement.toFixed(1)}%`);
  console.log('Open http://localhost:3000 for live observability.\n');
}

main().catch(console.error);
