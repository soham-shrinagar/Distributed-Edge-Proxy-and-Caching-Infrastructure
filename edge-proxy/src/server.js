'use strict';

const Fastify = require('fastify');
const cors = require('@fastify/cors');
const websocket = require('@fastify/websocket');
const config = require('./config');
const { logger } = require('./logging/logger');
const { connectDatabase } = require('./services/postgres');
const { connectRedis } = require('./services/redis');
const { startHealthMonitor } = require('./health/monitor');
const { startMetricsBroadcast, registerClient } = require('./websocket/metrics-stream');
const { startMetricsPersistence } = require('./metrics/collector');
const { handleProxyRequest } = require('./proxy/handler');
const adminRoutes = require('./middleware/admin-routes');
const { WS_PATH } = require('../../shared/constants');

const PROXY_ROUTES = ['/products', '/users', '/analytics'];

async function buildServer() {
  const app = Fastify({ logger: false, trustProxy: true });
  await app.register(cors, { origin: true });
  await app.register(websocket);

  app.get('/health', async () => ({
    service: 'EdgeFlow Proxy',
    status: 'healthy',
    port: config.proxy.port,
  }));

  await app.register(adminRoutes);

  app.get(WS_PATH, { websocket: true }, (socket) => registerClient(socket));

  for (const route of PROXY_ROUTES) {
    app.get(route, handleProxyRequest);
  }

  return app;
}

async function start() {
  try {
    await connectRedis();
  } catch (err) {
    logger.warn({ err: err.message }, 'Redis not available — L1 cache and rate limits limited');
  }

  try {
    await connectDatabase();
  } catch (err) {
    logger.warn({ err: err.message }, 'PostgreSQL not available — request logs disabled');
  }

  startHealthMonitor();
  startMetricsBroadcast(1000);
  startMetricsPersistence();

  const app = await buildServer();
  await app.listen({ port: config.proxy.port, host: config.proxy.host });
  logger.info({ port: config.proxy.port }, 'EdgeFlow Proxy started');
  return app;
}

if (require.main === module) {
  start().catch((err) => {
    logger.fatal({ err }, 'Failed to start proxy');
    process.exit(1);
  });
}

module.exports = { buildServer, start };
