'use strict';

const cacheManager = require('../cache/cache-manager');
const { fetchWithRetry } = require('../retry/failover');
const { compressResponse } = require('../compression/compressor');
const { checkRateLimit } = require('../rate-limiter');
const { recordRequest, incrementActiveConnections, decrementActiveConnections } = require('../metrics/collector');
const { insertRequestLog } = require('../services/postgres');
const { generateTraceId, getClientIp } = require('../utils/trace');
const config = require('../config');
const { logger } = require('../logging/logger');
const { recordRouting } = require('../metrics/events');
const { getPool } = require('../load-balancer');

function setProxyHeaders(reply, { traceId, clientIp, cacheStatus, backendName }) {
  reply.header('X-Trace-Id', traceId);
  reply.header('X-Proxy-Server', config.proxy.name);
  reply.header('X-Forwarded-For', clientIp);
  reply.header('X-Cache-Status', cacheStatus);
  if (backendName) reply.header('X-Backend-Server', backendName);
}

async function sendCompressed(reply, body, acceptEncoding, contentType) {
  const { body: out, encoding } = await compressResponse(body, acceptEncoding);
  if (encoding) reply.header('Content-Encoding', encoding);
  reply.header('Content-Type', contentType || 'application/json');
  return out;
}

async function handleProxyRequest(request, reply) {
  const traceId = generateTraceId();
  const clientIp = getClientIp(request);
  const start = Date.now();
  const url = request.url.split('?')[0];
  const queryString = request.url.includes('?') ? request.url.split('?')[1] : '';
  const acceptEncoding = request.headers['accept-encoding'] || '';

  incrementActiveConnections();

  const rateResult = await checkRateLimit(clientIp);
  if (!rateResult.allowed) {
    decrementActiveConnections();
    reply.header('Retry-After', Math.ceil(rateResult.resetMs / 1000));
    recordRequest({ statusCode: 429, latency: Date.now() - start, rateLimited: true });
    recordRouting({
      backendId: 'rate-limit',
      backendName: 'Rate limiter',
      algorithm: getPool().algorithm,
      path: url,
      status: 429,
      outcome: 'rate-limited',
    });
    return reply.code(429).send({ error: 'Too Many Requests', retryAfterMs: rateResult.resetMs });
  }

  const cacheResult = await cacheManager.get('GET', url, queryString);

  if (cacheResult.hit && cacheResult.entry) {
    const latency = Date.now() - start;
    setProxyHeaders(reply, {
      traceId,
      clientIp,
      cacheStatus: cacheResult.stale ? 'STALE' : 'HIT',
      backendName: cacheResult.entry.sourceServer || 'cache',
    });
    const body = await sendCompressed(
      reply,
      cacheResult.entry.value,
      acceptEncoding,
      cacheResult.entry.headers?.['content-type']
    );
    recordRequest({ statusCode: 200, latency, cacheHit: true, backendId: 'cache' });
    recordRouting({
      backendId: 'cache',
      backendName: cacheResult.entry.sourceServer || 'cache',
      algorithm: getPool().algorithm,
      path: url,
      status: 200,
      outcome: 'cache-hit',
    });
    insertRequestLog({
      ip: clientIp,
      endpoint: url,
      method: 'GET',
      statusCode: 200,
      latency,
      cacheHit: true,
      backendServer: 'cache',
    });
    decrementActiveConnections();
    return reply.code(200).send(body);
  }

  try {
    const pathWithQuery = queryString ? `${url}?${queryString}` : url;
    const chaos = request.headers['x-edge-chaos'] === '1' || request.headers['x-edge-chaos'] === 'true';
    const origin = await fetchWithRetry(
      pathWithQuery,
      { method: 'GET', headers: chaos ? { 'X-Edge-Chaos': '1' } : {} },
      clientIp
    );
    const latency = Date.now() - start;

    setProxyHeaders(reply, {
      traceId,
      clientIp,
      cacheStatus: 'MISS',
      backendName: origin.backend.name,
    });

    if (origin.statusCode === 200) {
      await cacheManager.set('GET', url, queryString, origin.body, origin.headers, 200, origin.backend.name);
    }

    const body = await sendCompressed(
      reply,
      origin.body,
      acceptEncoding,
      origin.headers['content-type']
    );

    recordRequest({
      statusCode: origin.statusCode,
      latency,
      cacheMiss: true,
      backendId: origin.backend.id,
    });
    insertRequestLog({
      ip: clientIp,
      endpoint: url,
      method: 'GET',
      statusCode: origin.statusCode,
      latency,
      cacheHit: false,
      backendServer: origin.backend.name,
    });

    decrementActiveConnections();
    return reply.code(origin.statusCode).send(body);
  } catch (err) {
    const latency = Date.now() - start;
    logger.error({ err: err.message, traceId, url }, 'Proxy request failed');
    recordRequest({ statusCode: 502, latency, cacheMiss: true });
    insertRequestLog({
      ip: clientIp,
      endpoint: url,
      method: 'GET',
      statusCode: 502,
      latency,
      cacheHit: false,
      backendServer: null,
    });
    decrementActiveConnections();
    return reply.code(502).send({ error: 'Bad Gateway', message: err.message, traceId });
  }
}

module.exports = { handleProxyRequest };
