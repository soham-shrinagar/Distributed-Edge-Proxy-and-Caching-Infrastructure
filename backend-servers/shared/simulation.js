'use strict';

/**
 * Realistic backend behavior simulation: latency tiers, random failures, timeouts.
 */

const LATENCY_TIERS = [100, 300, 500];

function randomLatency() {
  return LATENCY_TIERS[Math.floor(Math.random() * LATENCY_TIERS.length)];
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {object} opts
 * @param {number} opts.failureRate - 0-1 probability of 500 error
 * @param {number} opts.timeoutRate - 0-1 probability of hanging past timeout
 * @param {number} opts.unhealthyRate - 0-1 chance health reports unhealthy
 */
function createSimulator(opts = {}) {
  const failureRate = opts.failureRate ?? 0.08;
  const timeoutRate = opts.timeoutRate ?? 0.03;
  const unhealthyRate = opts.unhealthyRate ?? 0.05;

  let forceUnhealthy = false;
  let recoveryTimer = null;

  function scheduleRecovery() {
    if (recoveryTimer) clearTimeout(recoveryTimer);
    recoveryTimer = setTimeout(() => {
      forceUnhealthy = false;
    }, 15_000 + Math.random() * 20_000);
  }

  async function simulateRequest(overrides = {}) {
    const failRate = overrides.failureRate ?? failureRate;
    const toutRate = overrides.timeoutRate ?? timeoutRate;
    const latency = randomLatency();

    if (Math.random() < toutRate) {
      await delay(12_000);
      return { type: 'timeout', latency };
    }

    if (Math.random() < failRate) {
      await delay(latency);
      return { type: 'error', latency, statusCode: 500 };
    }

    if (Math.random() < unhealthyRate) {
      forceUnhealthy = true;
      scheduleRecovery();
    }

    await delay(latency);
    return { type: 'success', latency };
  }

  function isHealthy() {
    return !forceUnhealthy;
  }

  return { simulateRequest, isHealthy, randomLatency };
}

function generateProducts(serverName, count = 12) {
  return Array.from({ length: count }, (_, i) => ({
    id: `prod-${serverName}-${i + 1}`,
    name: `Product ${i + 1}`,
    price: Math.round((19.99 + Math.random() * 180) * 100) / 100,
    category: ['compute', 'storage', 'network', 'security'][i % 4],
  }));
}

function generateUsers(serverName, count = 8) {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${serverName}-${i + 1}`,
    email: `user${i + 1}@${serverName.toLowerCase().replace(/\s/g, '')}.edgeflow.io`,
    tier: ['free', 'pro', 'enterprise'][i % 3],
    region: ['us-east', 'eu-west', 'ap-south'][i % 3],
  }));
}

function generateAnalytics(serverName) {
  return {
    requestsToday: Math.floor(10_000 + Math.random() * 90_000),
    avgResponseMs: randomLatency(),
    errorRate: Math.round(Math.random() * 500) / 10000,
    topEndpoints: ['/products', '/users', '/analytics'].map((ep) => ({
      endpoint: ep,
      hits: Math.floor(1000 + Math.random() * 50_000),
    })),
    server: serverName,
  };
}

module.exports = {
  createSimulator,
  generateProducts,
  generateUsers,
  generateAnalytics,
  randomLatency,
  delay,
};
