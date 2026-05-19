'use strict';

const zlib = require('zlib');
const { promisify } = require('util');
const config = require('../config');

const gzipAsync = promisify(zlib.gzip);
const brotliAsync = promisify(zlib.brotliCompress);

const stats = {
  gzipCount: 0,
  brotliCount: 0,
  skippedCount: 0,
  originalBytes: 0,
  compressedBytes: 0,
};

async function compressResponse(body, acceptEncoding = '') {
  if (!config.compression.enabled) {
    return { body, encoding: null, stats: null };
  }

  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');
  if (buffer.length < config.compression.minBytes) {
    stats.skippedCount += 1;
    return { body: buffer, encoding: null, stats: null };
  }

  stats.originalBytes += buffer.length;
  const enc = String(acceptEncoding).toLowerCase();

  if (enc.includes('br')) {
    const compressed = await brotliAsync(buffer, {
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 },
    });
    stats.brotliCount += 1;
    stats.compressedBytes += compressed.length;
    return {
      body: compressed,
      encoding: 'br',
      stats: buildRatio(buffer.length, compressed.length),
    };
  }

  if (enc.includes('gzip') || enc.includes('*')) {
    const compressed = await gzipAsync(buffer);
    stats.gzipCount += 1;
    stats.compressedBytes += compressed.length;
    return {
      body: compressed,
      encoding: 'gzip',
      stats: buildRatio(buffer.length, compressed.length),
    };
  }

  stats.skippedCount += 1;
  return { body: buffer, encoding: null, stats: null };
}

function buildRatio(original, compressed) {
  const savings = original - compressed;
  return {
    originalSize: original,
    compressedSize: compressed,
    ratio: compressed / original,
    savingsPercent: Math.round((savings / original) * 10000) / 100,
  };
}

function getCompressionStats() {
  const savings = stats.originalBytes - stats.compressedBytes;
  return {
    ...stats,
    savingsBytes: savings,
    overallRatio:
      stats.originalBytes > 0 ? stats.compressedBytes / stats.originalBytes : 1,
  };
}

module.exports = { compressResponse, getCompressionStats };
