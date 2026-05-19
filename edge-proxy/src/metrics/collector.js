'use strict';

const { getCacheStats } = require('../cache/cache-manager');
const { getPool } = require('../load-balancer');
const { getRetryStats } = require('../retry/failover');
const { getCompressionStats } = require('../compression/compressor');
const { getRateLimitStats } = require('../rate-limiter');
const { getRedisStats, isRedisAvailable } = require('../services/redis');
const { getHealthEvents } = require('../health/monitor');
const { getRoutingLog, getRateLimitWindow } = require('./events');
const { insertTrafficMetric } = require('../services/postgres');

const WINDOW_MS = 10_000;
const requestTimestamps = [];
const latencySamples = [];
const errorTimestamps = [];
const limitedTimestamps = [];
const backendTrafficWindow = {};

let totalRequests = 0;
let cacheHits = 0;
let cacheMisses = 0;
let activeConnections = 0;

function pruneWindow(arr, now = Date.now()) {
  const cutoff = now - WINDOW_MS;
  while (arr.length && arr[0] < cutoff) arr.shift();
}

function recordRequest(meta) {
  totalRequests += 1;
  const now = Date.now();
  requestTimestamps.push(now);
  pruneWindow(requestTimestamps, now);

  if (meta.latency != null) {
    latencySamples.push(meta.latency);
    if (latencySamples.length > 500) latencySamples.shift();
  }
  if (meta.cacheHit) cacheHits += 1;
  else if (meta.cacheMiss) cacheMisses += 1;

  if (meta.statusCode >= 400) {
    errorTimestamps.push(now);
    pruneWindow(errorTimestamps, now);
  }
  if (meta.statusCode === 429 || meta.rateLimited) {
    limitedTimestamps.push(now);
    pruneWindow(limitedTimestamps, now);
  }

  if (meta.backendId && meta.backendId !== 'cache') {
    if (!backendTrafficWindow[meta.backendId]) backendTrafficWindow[meta.backendId] = [];
    backendTrafficWindow[meta.backendId].push(now);
    pruneWindow(backendTrafficWindow[meta.backendId], now);
  }
}

function resetBackendTrafficWindow() {
  for (const key of Object.keys(backendTrafficWindow)) {
    backendTrafficWindow[key] = [];
  }
  const { clearRoutingLog } = require('./events');
  clearRoutingLog();
}

function incrementActiveConnections() {
  activeConnections += 1;
}

function decrementActiveConnections() {
  if (activeConnections > 0) activeConnections -= 1;
}

function getTrafficDistribution() {
  const pool = getPool();
  const counts = {};
  let total = 0;

  for (const [id, times] of Object.entries(backendTrafficWindow)) {
    pruneWindow(times);
    counts[id] = times.length;
    total += times.length;
  }

  if (total === 0) total = 1;

  return pool.getSnapshot().map((b) => ({
    id: b.id,
    name: b.name,
    requests: counts[b.id] || 0,
    percentage: Math.round(((counts[b.id] || 0) / total) * 10000) / 100,
    healthy: b.healthy,
    activeConnections: b.activeConnections,
    peakConnections: b.peakConnections,
    responseTime: b.responseTime,
    weight: b.weight,
  }));
}

async function getSnapshot() {
  const cache = getCacheStats();
  const pool = getPool();
  const backends = pool.getSnapshot();
  const cacheTotal = cacheHits + cacheMisses;
  const rateLimit = getRateLimitStats();

  pruneWindow(limitedTimestamps);

  return {
    timestamp: new Date().toISOString(),
    requestsPerSecond: Math.round((requestTimestamps.length / (WINDOW_MS / 1000)) * 100) / 100,
    totalRequests,
    activeConnections,
    avgLatency:
      latencySamples.length > 0
        ? Math.round((latencySamples.reduce((a, b) => a + b, 0) / latencySamples.length) * 100) / 100
        : 0,
    cacheHitRatio: cacheTotal > 0 ? cacheHits / cacheTotal : cache.combined.hitRatio,
    cacheMissRatio: cacheTotal > 0 ? cacheMisses / cacheTotal : 0,
    cacheHits,
    cacheMisses,
    cache,
    backends,
    healthyBackends: backends.filter((b) => b.healthy).length,
    unhealthyBackends: backends.filter((b) => !b.healthy).length,
    loadBalancer: { algorithm: pool.algorithm },
    retry: getRetryStats(),
    compression: getCompressionStats(),
    rateLimit: {
      ...rateLimit,
      limitedLast10s: limitedTimestamps.length,
      redisConnected: isRedisAvailable(),
    },
    redis: await getRedisStats(),
    trafficDistribution: getTrafficDistribution(),
    healthEvents: getHealthEvents(),
    routingLog: getRoutingLog(),
    rateLimitWindow: getRateLimitWindow(),
    errorRate:
      requestTimestamps.length > 0
        ? Math.round((errorTimestamps.length / requestTimestamps.length) * 10000) / 10000
        : 0,
    memoryUsage: process.memoryUsage(),
  };
}

function startMetricsPersistence() {
  setInterval(async () => {
    const cache = getCacheStats();
    const avg =
      latencySamples.length > 0
        ? latencySamples.reduce((a, b) => a + b, 0) / latencySamples.length
        : 0;
    await insertTrafficMetric({
      requestsPerSecond: requestTimestamps.length / (WINDOW_MS / 1000),
      cacheHitRatio: cache.combined.hitRatio,
      avgLatency: avg,
      errorRate:
        requestTimestamps.length > 0 ? errorTimestamps.length / requestTimestamps.length : 0,
    });
  }, 30_000);
}

module.exports = {
  recordRequest,
  getSnapshot,
  resetBackendTrafficWindow,
  incrementActiveConnections,
  decrementActiveConnections,
  startMetricsPersistence,
};
