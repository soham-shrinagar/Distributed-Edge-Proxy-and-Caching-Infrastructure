'use strict';

const http = require('http');
const { URL } = require('url');
const config = require('../config');

function forwardToBackend(backend, path, method = 'GET', extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(path, backend.url);
    const req = http.request(
      {
        hostname: target.hostname,
        port: target.port || 80,
        path: target.pathname + target.search,
        method,
        headers: { 'X-Forwarded-By': config.proxy.name, ...extraHeaders },
        timeout: config.retry.timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          if (res.statusCode >= 500 || res.statusCode === 504) {
            reject(new Error(`Backend returned ${res.statusCode}`));
            return;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf8'),
            backend,
          });
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

module.exports = { forwardToBackend };
