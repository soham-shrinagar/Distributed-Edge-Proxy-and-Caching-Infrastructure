'use strict';

const config = require('../config');
const { getRedis, isRedisAvailable } = require('../services/redis');

const PREFIX = 'edgeflow:cache:';

class L2Cache {
  constructor() {
    this.stats = { hits: 0, misses: 0, sets: 0 };
  }

  _key(key) {
    return `${PREFIX}${key}`;
  }

  async get(key) {
    if (!isRedisAvailable()) {
      this.stats.misses += 1;
      return null;
    }
    const redis = await getRedis();
    const raw = await redis.get(this._key(key));
    if (!raw) {
      this.stats.misses += 1;
      return null;
    }
    this.stats.hits += 1;
    return JSON.parse(raw);
  }

  async set(key, entry) {
    if (!isRedisAvailable()) return;
    const redis = await getRedis();
    const ttlSec = Math.ceil(config.cache.l2TtlMs / 1000);
    await redis.setex(this._key(key), ttlSec, JSON.stringify(entry));
    this.stats.sets += 1;
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      connected: isRedisAvailable(),
      hitRatio: total > 0 ? this.stats.hits / total : 0,
    };
  }
}

module.exports = { L2Cache };
