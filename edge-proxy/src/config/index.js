'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const path = require('path');

const config = {
  env: process.env.NODE_ENV || 'development',
  proxy: {
    port: Number(process.env.PROXY_PORT || process.env.PORT) || 8080,
    host: process.env.PROXY_HOST || '0.0.0.0',
    name: 'EdgeFlow-Proxy',
  },
  redis: {
    url: process.env.REDIS_URL || null,
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB) || 0,
    tls: process.env.REDIS_TLS === 'true',
  },
  postgres: {
    connectionString: process.env.DATABASE_URL || null,
    host: process.env.PG_HOST || '127.0.0.1',
    port: Number(process.env.PG_PORT) || 5432,
    user: process.env.PG_USER || 'edgeflow',
    password: process.env.PG_PASSWORD || 'edgeflow',
    database: process.env.PG_DATABASE || 'edgeflow',
    ssl:
      process.env.PG_SSL === 'true' ||
      (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')),
  },
  loadBalancer: {
    algorithm: process.env.LB_ALGORITHM || 'round-robin',
  },
  rateLimit: {
    algorithm: process.env.RATE_LIMIT_ALGORITHM || 'token-bucket',
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  },
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    l1MaxEntries: Number(process.env.L1_MAX_ENTRIES) || 500,
    l1TtlMs: Number(process.env.L1_TTL_MS) || 60_000,
    l2TtlMs: Number(process.env.L2_TTL_MS) || 120_000,
  },
  retry: {
    maxRetries: Number(process.env.MAX_RETRIES) || 3,
    backoffMs: Number(process.env.RETRY_BACKOFF_MS) || 100,
    timeoutMs: Number(process.env.REQUEST_TIMEOUT_MS) || 8000,
  },
  health: {
    intervalMs: Number(process.env.HEALTH_CHECK_INTERVAL_MS) || 5000,
  },
  compression: {
    enabled: process.env.COMPRESSION_ENABLED !== 'false',
    minBytes: Number(process.env.COMPRESSION_MIN_BYTES) || 1024,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  paths: {
    root: path.join(__dirname, '../..'),
  },
};

module.exports = config;
