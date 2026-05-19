'use strict';

const { LRUCache } = require('lru-cache');
const config = require('../config');

class L1Cache {
  constructor() {
    this.stats = { hits: 0, misses: 0, evictions: 0, sets: 0 };
    this.cache = new LRUCache({
      max: config.cache.l1MaxEntries,
      ttl: config.cache.l1TtlMs,
      updateAgeOnGet: true,
      dispose: () => {
        this.stats.evictions += 1;
      },
    });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses += 1;
      return null;
    }
    entry.hitCount = (entry.hitCount || 0) + 1;
    this.stats.hits += 1;
    return entry;
  }

  set(key, entry) {
    this.stats.sets += 1;
    this.cache.set(key, entry);
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: config.cache.l1MaxEntries,
      hitRatio: total > 0 ? this.stats.hits / total : 0,
    };
  }
}

module.exports = { L1Cache };
