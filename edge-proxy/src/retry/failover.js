'use strict';

const { forwardToBackend } = require('../proxy/forward');
const config = require('../config');
const { getPool } = require('../load-balancer');
const { logger } = require('../logging/logger');
const { recordRouting } = require('../metrics/events');

let retryCount = 0;
let failoverCount = 0;
const recentFailovers = [];

async function fetchWithRetry(url, options, clientIp) {
  const pool = getPool();
  const excludeIds = [];
  let lastError = null;
  let failedServer = null;

  for (let attempt = 0; attempt <= config.retry.maxRetries; attempt++) {
    const backend = pool.select(clientIp, excludeIds);
    if (!backend) break;

    pool.incrementConnections(backend.id);
    try {
      const result = await forwardToBackend(
        backend,
        url,
        options.method || 'GET',
        options.headers || {}
      );
      pool.decrementConnections(backend.id);
      pool.recordRequest(backend.id);

      recordRouting({
        backendId: backend.id,
        backendName: backend.name,
        algorithm: pool.algorithm,
        path: url.split('?')[0],
        status: result.statusCode,
        outcome: 'success',
      });

      if (failedServer) {
        failoverCount += 1;
        recentFailovers.unshift({
          failedServer,
          reroutedServer: backend.name,
          retryCount: attempt,
          timestamp: new Date().toISOString(),
        });
        if (recentFailovers.length > 50) recentFailovers.pop();
        logger.info({ from: failedServer, to: backend.name }, 'Failover succeeded');
      }
      return result;
    } catch (err) {
      pool.decrementConnections(backend.id);
      recordRouting({
        backendId: backend.id,
        backendName: backend.name,
        algorithm: pool.algorithm,
        path: url.split('?')[0],
        status: 0,
        outcome: 'failed',
        error: err.message,
      });
      lastError = err;
      failedServer = failedServer || backend.name;
      pool.markUnhealthy(backend.id);
      excludeIds.push(backend.id);
      retryCount += 1;
      logger.warn({ backend: backend.name, attempt, err: err.message }, 'Retrying another backend');
      await new Promise((r) => setTimeout(r, config.retry.backoffMs * Math.pow(2, attempt)));
    }
  }

  throw lastError || new Error('All backends failed');
}

function getRetryStats() {
  return { retryCount, failoverCount, recentFailovers: [...recentFailovers] };
}

module.exports = { fetchWithRetry, getRetryStats };
