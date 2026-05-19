'use strict';

const { randomBytes } = require('crypto');

function generateTraceId() {
  return randomBytes(16).toString('hex');
}

function getClientIp(request) {
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return request.ip || request.socket?.remoteAddress || 'unknown';
}

module.exports = { generateTraceId, getClientIp };
