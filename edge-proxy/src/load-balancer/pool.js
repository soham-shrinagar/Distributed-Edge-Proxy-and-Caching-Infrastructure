'use strict';

const config = require('../config');
const { BACKENDS } = require('../../../shared/constants');

function createBackendPool() {
  return BACKENDS.map((b) => ({
    id: b.id,
    name: b.name,
    url: b.url,
    healthy: true,
    activeConnections: 0,
    peakConnections: 0,
    weight: b.weight,
    failureCount: 0,
    responseTime: 0,
    requestCount: 0,
  }));
}

class BackendPool {
  constructor() {
    this.backends = createBackendPool();
    this.algorithm = config.loadBalancer.algorithm || 'round-robin';
    this._rrIndex = 0;
    this._wrrIndex = 0;
    this._wrrCurrentWeight = 0;
    this._wrrMaxWeight = Math.max(...this.backends.map((b) => b.weight));
    this._wrrGcd = gcd(...this.backends.map((b) => b.weight));
  }

  setAlgorithm(algorithm) {
    this.algorithm = algorithm;
    this._rrIndex = 0;
    this._wrrIndex = 0;
    this._wrrCurrentWeight = 0;
  }

  getHealthyBackends(excludeIds = []) {
    return this.backends.filter((b) => b.healthy && !excludeIds.includes(b.id));
  }

  getBackendById(id) {
    return this.backends.find((b) => b.id === id);
  }

  markUnhealthy(id) {
    const b = this.getBackendById(id);
    if (b) {
      b.healthy = false;
      b.failureCount += 1;
    }
  }

  markHealthy(id, responseTime = 0) {
    const b = this.getBackendById(id);
    if (b) {
      b.healthy = true;
      b.responseTime = responseTime;
    }
  }

  incrementConnections(id) {
    const b = this.getBackendById(id);
    if (b) {
      b.activeConnections += 1;
      b.peakConnections = Math.max(b.peakConnections, b.activeConnections);
    }
  }

  decrementConnections(id) {
    const b = this.getBackendById(id);
    if (b && b.activeConnections > 0) b.activeConnections -= 1;
  }

  recordRequest(id) {
    const b = this.getBackendById(id);
    if (b) b.requestCount += 1;
  }

  getSnapshot() {
    return this.backends.map((b) => ({ ...b }));
  }

  select(clientIp, excludeIds = []) {
    const healthy = this.getHealthyBackends(excludeIds);
    if (!healthy.length) return null;

    switch (this.algorithm) {
      case 'weighted-round-robin':
        return this._weightedRoundRobin(healthy);
      case 'least-connections':
        return this._leastConnections(healthy);
      case 'ip-hash':
        return this._ipHash(healthy, clientIp);
      default:
        return this._roundRobin(healthy);
    }
  }

  _roundRobin(healthy) {
    const backend = healthy[this._rrIndex % healthy.length];
    this._rrIndex = (this._rrIndex + 1) % healthy.length;
    return backend;
  }

  _weightedRoundRobin(healthy) {
    const maxW = Math.max(...healthy.map((b) => b.weight));
    const g = gcd(...healthy.map((b) => b.weight));
    let idx = 0;
    let currentWeight = maxW;

    for (let i = 0; i < healthy.length * 20; i++) {
      idx = (idx + 1) % healthy.length;
      if (idx === 0) {
        currentWeight -= g;
        if (currentWeight <= 0) currentWeight = maxW;
      }
      if (healthy[idx].weight >= currentWeight) return healthy[idx];
    }
    return healthy[0];
  }

  _leastConnections(healthy) {
    return healthy.reduce((min, b) =>
      b.activeConnections < min.activeConnections ? b : min
    );
  }

  _ipHash(healthy, clientIp) {
    let hash = 0;
    const str = clientIp || 'unknown';
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return healthy[Math.abs(hash) % healthy.length];
  }
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

module.exports = { BackendPool };
