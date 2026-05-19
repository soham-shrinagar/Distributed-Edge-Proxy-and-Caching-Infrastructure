'use strict';

const { getPool } = require('../load-balancer');
const { setAlgorithm: setRateLimitAlgorithm } = require('../rate-limiter');
const { getRecentRequestLogs } = require('../services/postgres');
const { resetBackendTrafficWindow } = require('../metrics/collector');

const LB_ALGORITHMS = ['round-robin', 'weighted-round-robin', 'least-connections', 'ip-hash'];
const RL_ALGORITHMS = ['token-bucket', 'fixed-window', 'sliding-window'];

async function adminRoutes(fastify) {
  fastify.post('/api/admin/load-balancer', async (request) => {
    const { algorithm } = request.body || {};
    if (!LB_ALGORITHMS.includes(algorithm)) {
      return { error: 'Invalid algorithm', valid: LB_ALGORITHMS };
    }
    getPool().setAlgorithm(algorithm);
    resetBackendTrafficWindow();
    return {
      success: true,
      algorithm,
      hint: 'Traffic % resets for 10s window. Use Simulator with cache bust OFF to see LB differences.',
    };
  });

  fastify.post('/api/admin/rate-limiter', async (request) => {
    const { algorithm } = request.body || {};
    if (!RL_ALGORITHMS.includes(algorithm)) {
      return { error: 'Invalid algorithm', valid: RL_ALGORITHMS };
    }
    setRateLimitAlgorithm(algorithm);
    return { success: true, algorithm };
  });

  fastify.get('/api/admin/logs/requests', async (request) => {
    const limit = Number(request.query.limit) || 100;
    return getRecentRequestLogs(limit);
  });
}

module.exports = adminRoutes;
