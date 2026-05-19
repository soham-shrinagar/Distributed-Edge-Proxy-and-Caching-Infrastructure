'use strict';

const autocannon = require('autocannon');

const PROXY = process.env.PROXY_URL || 'http://127.0.0.1:8080';
const DURATION = Number(process.env.DURATION) || 30;
const CONNECTIONS = Number(process.env.CONNECTIONS) || 50;

async function runTest(name, url) {
  console.log(`\n━━━ ${name} ━━━`);
  console.log(`Target: ${url}\n`);

  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url,
        connections: CONNECTIONS,
        duration: DURATION,
        pipelining: 1,
      },
      (err, result) => {
        if (err) return reject(err);
        console.log(autocannon.printResult(result, { renderLatencyTable: true }));
        resolve(result);
      }
    );
    autocannon.track(instance, { renderProgressBar: true });
  });
}

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   EdgeFlow Stress Test (autocannon)    ║');
  console.log('╚════════════════════════════════════════╝');

  await runTest('Products (cacheable)', `${PROXY}/products`);
  await runTest('Users (cacheable)', `${PROXY}/users`);
  await runTest('Analytics', `${PROXY}/analytics`);

  console.log('\n✓ Stress test complete. Check dashboard for live metrics.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
