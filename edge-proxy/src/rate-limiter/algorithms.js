'use strict';

/**
 * Redis-backed rate limiting algorithms.
 */

async function fixedWindow(redis, key, max, windowMs) {
  const windowKey = `${key}:fw:${Math.floor(Date.now() / windowMs)}`;
  const count = await redis.incr(windowKey);
  if (count === 1) {
    await redis.pexpire(windowKey, windowMs);
  }
  const ttl = await redis.pttl(windowKey);
  return {
    allowed: count <= max,
    remaining: Math.max(0, max - count),
    resetMs: ttl > 0 ? ttl : windowMs,
    current: count,
  };
}

async function slidingWindow(redis, key, max, windowMs) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const zkey = `${key}:sw`;

  const multi = redis.multi();
  multi.zremrangebyscore(zkey, 0, windowStart);
  multi.zadd(zkey, now, `${now}-${Math.random()}`);
  multi.zcard(zkey);
  multi.pexpire(zkey, windowMs);
  const results = await multi.exec();
  const count = results[2][1];

  return {
    allowed: count <= max,
    remaining: Math.max(0, max - count),
    resetMs: windowMs,
    current: count,
  };
}

async function tokenBucket(redis, key, max, windowMs) {
  const bucketKey = `${key}:tb`;
  const refillRate = max / (windowMs / 1000);
  const now = Date.now();

  const data = await redis.hmget(bucketKey, 'tokens', 'lastRefill');
  let tokens = data[0] !== null ? parseFloat(data[0]) : max;
  let lastRefill = data[1] !== null ? parseInt(data[1], 10) : now;

  const elapsed = (now - lastRefill) / 1000;
  tokens = Math.min(max, tokens + elapsed * refillRate);

  if (tokens < 1) {
    await redis.hmset(bucketKey, 'tokens', tokens, 'lastRefill', now);
    await redis.pexpire(bucketKey, Math.ceil(windowMs / 1000) * 2);
    const waitMs = Math.ceil((1 - tokens) / refillRate * 1000);
    return {
      allowed: false,
      remaining: 0,
      resetMs: waitMs,
      current: max - tokens,
    };
  }

  tokens -= 1;
  await redis.hmset(bucketKey, 'tokens', tokens, 'lastRefill', now);
  await redis.pexpire(bucketKey, Math.ceil(windowMs / 1000) * 2);

  return {
    allowed: true,
    remaining: Math.floor(tokens),
    resetMs: windowMs,
    current: max - tokens,
  };
}

module.exports = { fixedWindow, slidingWindow, tokenBucket };
