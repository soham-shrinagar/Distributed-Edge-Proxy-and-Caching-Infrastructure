'use strict';

const config = require('../config');
const { getRedis, isRedisAvailable } = require('../services/redis');
const { fixedWindow, slidingWindow, tokenBucket } = require('./algorithms');

const { recordRateLimitCheck } = require('../metrics/events');

const PREFIX = 'edgeflow:rl:';
let limitedCount = 0;

async function checkRateLimit(clientIp) {
  if (!isRedisAvailable()) {
    recordRateLimitCheck(true, clientIp);
    return {
      allowed: true,
      remaining: config.rateLimit.max,
      resetMs: config.rateLimit.windowMs,
      redisConnected: false,
    };
  }

  const key = `${PREFIX}${clientIp}`;
  const { max, windowMs, algorithm } = config.rateLimit;
  const redis = await getRedis();

  let result;
  if (algorithm === 'fixed-window') result = await fixedWindow(redis, key, max, windowMs);
  else if (algorithm === 'sliding-window') result = await slidingWindow(redis, key, max, windowMs);
  else result = await tokenBucket(redis, key, max, windowMs);

  recordRateLimitCheck(result.allowed, clientIp);
  if (!result.allowed) limitedCount += 1;
  return { ...result, redisConnected: true, algorithm };
}

function getRateLimitStats() {
  return {
    algorithm: config.rateLimit.algorithm,
    max: config.rateLimit.max,
    windowMs: config.rateLimit.windowMs,
    limitedTotal: limitedCount,
    redisConnected: isRedisAvailable(),
  };
}

function setAlgorithm(algorithm) {
  config.rateLimit.algorithm = algorithm;
}

module.exports = { checkRateLimit, getRateLimitStats, setAlgorithm };
