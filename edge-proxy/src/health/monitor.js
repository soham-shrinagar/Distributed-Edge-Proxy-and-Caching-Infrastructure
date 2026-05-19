'use strict';

const http = require('http');
const config = require('../config');
const { getPool } = require('../load-balancer');
const { logger } = require('../logging/logger');

const healthEvents = [];
let intervalHandle = null;

function recordEvent(type, backend) {
  healthEvents.unshift({ type, backend, timestamp: new Date().toISOString() });
  if (healthEvents.length > 50) healthEvents.pop();
}

function checkBackendHealth(backend) {
  return new Promise((resolve) => {
    const start = Date.now();
    const url = new URL('/health', backend.url);
    const req = http.get(
      { hostname: url.hostname, port: url.port, path: url.pathname, timeout: 3000 },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          const latency = Date.now() - start;
          let healthy = res.statusCode === 200;
          if (healthy) {
            try {
              healthy = JSON.parse(body).healthy !== false;
            } catch {
              healthy = false;
            }
          }
          resolve({ backend, healthy, latency });
        });
      }
    );
    req.on('error', () => resolve({ backend, healthy: false, latency: Date.now() - start }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ backend, healthy: false, latency: Date.now() - start });
    });
  });
}

async function runHealthChecks() {
  const pool = getPool();
  for (const backend of pool.backends) {
    const { healthy, latency } = await checkBackendHealth(backend);
    if (healthy) {
      if (!backend.healthy) {
        recordEvent('recovery', backend.name);
        logger.info({ backend: backend.name }, 'Backend recovered');
      }
      pool.markHealthy(backend.id, latency);
    } else {
      if (backend.healthy) {
        recordEvent('unhealthy', backend.name);
        logger.warn({ backend: backend.name }, 'Backend unhealthy');
      }
      pool.markUnhealthy(backend.id);
    }
  }
}

function startHealthMonitor() {
  if (intervalHandle) return;
  runHealthChecks();
  intervalHandle = setInterval(runHealthChecks, config.health.intervalMs);
  logger.info({ intervalMs: config.health.intervalMs }, 'Health monitor started');
}

function getHealthEvents() {
  return [...healthEvents];
}

module.exports = { startHealthMonitor, getHealthEvents };
