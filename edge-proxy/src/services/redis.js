'use strict';

const Redis = require('ioredis');
const config = require('../config');
const { logger } = require('../logging/logger');

let client = null;

function getRedis() {
  if (!client) {
    const opts = {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    };
    if (config.redis.url) {
      client = new Redis(config.redis.url, opts);
    } else {
      client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        ...(config.redis.tls ? { tls: {} } : {}),
        ...opts,
      });
    }
    client.on('connect', () => logger.info('Redis connected'));
    client.on('error', (err) => logger.warn({ err: err.message }, 'Redis error'));
  }
  return client;
}

async function connectRedis() {
  const redis = getRedis();
  if (redis.status !== 'ready') await redis.connect();
  return redis;
}

function isRedisAvailable() {
  return client?.status === 'ready';
}

async function getRedisStats() {
  if (!isRedisAvailable()) return { connected: false, keys: 0, memory: '0' };
  const info = await client.info('memory');
  const keys = await client.dbsize();
  const usedMatch = info.match(/used_memory_human:(\S+)/);
  return { connected: true, keys, memory: usedMatch?.[1] || 'unknown' };
}

module.exports = { getRedis, connectRedis, isRedisAvailable, getRedisStats };
