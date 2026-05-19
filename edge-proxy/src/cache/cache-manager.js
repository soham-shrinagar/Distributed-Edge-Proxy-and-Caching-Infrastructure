'use strict';

const crypto = require('crypto');
const config = require('../config');
const { DEFAULT_CACHE_TTL_MS, STALE_WHILE_REVALIDATE_MS } = require('../../../shared/constants');
const { L1Cache } = require('./l1-cache');
const { L2Cache } = require('./l2-cache');

const l1 = new L1Cache();
const l2 = new L2Cache();

function buildCacheKey(method, url, query = '') {
  const raw = `${method}:${url}${query ? `?${query}` : ''}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function createEntry(body, headers, statusCode, sourceServer) {
  const now = Date.now();
  return {
    value: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { ...headers },
    statusCode,
    expiresAt: now + DEFAULT_CACHE_TTL_MS,
    staleUntil: now + DEFAULT_CACHE_TTL_MS + STALE_WHILE_REVALIDATE_MS,
    hitCount: 0,
    sourceServer,
  };
}

async function get(method, url, queryString) {
  if (!config.cache.enabled || method !== 'GET') {
    return { hit: false, entry: null, stale: false };
  }

  const key = buildCacheKey(method, url, queryString);

  let entry = l1.get(key);
  if (!entry) {
    entry = await l2.get(key);
    if (entry) l1.set(key, entry);
  }

  if (!entry) return { hit: false, entry: null, stale: false, key };

  const stale = Date.now() > entry.expiresAt;
  if (!stale || Date.now() < entry.staleUntil) {
    return { hit: true, entry, stale, key };
  }

  return { hit: false, entry: null, stale: false, key };
}

async function set(method, url, queryString, body, headers, statusCode, sourceServer) {
  if (!config.cache.enabled || method !== 'GET' || statusCode !== 200) return;
  const key = buildCacheKey(method, url, queryString);
  const entry = createEntry(body, headers, statusCode, sourceServer);
  l1.set(key, entry);
  await l2.set(key, entry);
}

function getCacheStats() {
  const l1Stats = l1.getStats();
  const l2Stats = l2.getStats();
  const hits = l1Stats.hits + l2Stats.hits;
  const misses = l1Stats.misses + l2Stats.misses;
  const total = hits + misses;
  return {
    l1: l1Stats,
    l2: l2Stats,
    combined: { hits, misses, hitRatio: total > 0 ? hits / total : 0 },
  };
}

module.exports = { get, set, getCacheStats };
