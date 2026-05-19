'use strict';

const Fastify = require('fastify');
const {
  createSimulator,
  generateProducts,
  generateUsers,
  generateAnalytics,
} = require('./simulation');

/**
 * Creates a simulated origin backend with realistic failure/latency behavior.
 */
function createBackendServer({ port, serverId, serverName, loggerConfig = {} }) {
  const simulator = createSimulator({
    failureRate: 0.08,
    timeoutRate: 0.03,
    unhealthyRate: 0.05,
  });

  let requestCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  const app = Fastify({
    logger: {
      level: 'info',
      transport: loggerConfig.pretty
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  app.addHook('onRequest', async (request) => {
    requestCount += 1;
    request.log.info({ method: request.method, url: request.url }, 'incoming request');
  });

  app.get('/health', async () => {
    const healthy = simulator.isHealthy();
    return {
      server: serverName,
      serverId,
      healthy,
      uptime: Date.now() - startTime,
      requestCount,
      errorCount,
      timestamp: new Date().toISOString(),
    };
  });

  app.get('/metrics', async () => ({
    server: serverName,
    serverId,
    requestCount,
    errorCount,
    healthy: simulator.isHealthy(),
    uptime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  }));

  async function handleDataRoute(request, reply, dataFn) {
    const chaos =
      request.headers['x-edge-chaos'] === '1' || request.headers['x-edge-chaos'] === 'true';
    const result = await simulator.simulateRequest(
      chaos ? { failureRate: 0.35, timeoutRate: 0.12, unhealthyRate: 0 } : {}
    );

    if (result.type === 'timeout') {
      return reply.code(504).send({
        server: serverName,
        error: 'Gateway Timeout',
        latency: result.latency,
        timestamp: new Date().toISOString(),
      });
    }

    if (result.type === 'error') {
      errorCount += 1;
      return reply.code(result.statusCode).send({
        server: serverName,
        error: 'Internal Server Error',
        latency: result.latency,
        timestamp: new Date().toISOString(),
      });
    }

    const data = dataFn();
    return {
      server: serverName,
      serverId,
      timestamp: new Date().toISOString(),
      latency: result.latency,
      data,
    };
  }

  app.get('/products', (req, reply) =>
    handleDataRoute(req, reply, () => generateProducts(serverName))
  );

  app.get('/users', (req, reply) =>
    handleDataRoute(req, reply, () => generateUsers(serverName))
  );

  app.get('/analytics', (req, reply) =>
    handleDataRoute(req, reply, () => generateAnalytics(serverName))
  );

  async function start() {
    await app.listen({ port, host: '127.0.0.1' });
    app.log.info(`${serverName} listening on http://127.0.0.1:${port}`);
    return app;
  }

  return { app, start, simulator };
}

module.exports = { createBackendServer };
