'use strict';

const { fetch } = require('undici');

const PROXY = process.env.PROXY_URL || 'http://127.0.0.1:8080';
const ENDPOINTS = ['/products', '/users', '/analytics'];
const INTERVAL_MS = Number(process.env.INTERVAL_MS) || 200;
const DURATION_MS = Number(process.env.DURATION_MS) || 120_000;

let running = true;
let sent = 0;
let errors = 0;

async function sendRequest() {
  const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
  try {
    const res = await fetch(`${PROXY}${endpoint}`);
    sent += 1;
    if (!res.ok) errors += 1;
    const cache = res.headers.get('x-cache-status') || '-';
    const backend = res.headers.get('x-backend-server') || '-';
    process.stdout.write(`\r  ${sent} reqs | errors: ${errors} | ${endpoint} | cache:${cache} | ${backend}   `);
  } catch {
    errors += 1;
    sent += 1;
  }
}

console.log(`EdgeFlow Traffic Generator → ${PROXY}`);
console.log(`Interval: ${INTERVAL_MS}ms | Duration: ${DURATION_MS / 1000}s\n`);

const timer = setInterval(() => {
  if (!running) return;
  sendRequest();
}, INTERVAL_MS);

setTimeout(() => {
  running = false;
  clearInterval(timer);
  console.log(`\n\nDone. Sent ${sent} requests, ${errors} errors.`);
  process.exit(0);
}, DURATION_MS);

process.on('SIGINT', () => {
  clearInterval(timer);
  console.log(`\n\nStopped. Sent ${sent} requests.`);
  process.exit(0);
});
