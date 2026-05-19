'use strict';

const { Pool } = require('pg');
const { logger } = require('../logging/logger');
const { getPgPoolConfig } = require('./pg-config');

let pool = null;
let available = false;

function getPool() {
  if (!pool) pool = new Pool(getPgPoolConfig());
  return pool;
}

async function connectDatabase() {
  const p = getPool();
  await p.query('SELECT 1');
  available = true;
  logger.info('PostgreSQL connected');
}

async function insertRequestLog(row) {
  if (!available) return;
  try {
  await getPool().query(
    `INSERT INTO request_logs (ip, endpoint, method, status_code, latency, cache_hit, backend_server)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [row.ip, row.endpoint, row.method, row.statusCode, row.latency, row.cacheHit, row.backendServer]
  );
  } catch (err) {
    logger.debug({ err: err.message }, 'request log insert failed');
  }
}

async function insertTrafficMetric(row) {
  if (!available) return;
  try {
  await getPool().query(
    `INSERT INTO traffic_metrics (requests_per_second, cache_hit_ratio, avg_latency, error_rate)
     VALUES ($1, $2, $3, $4)`,
    [row.requestsPerSecond, row.cacheHitRatio, row.avgLatency, row.errorRate]
  );
  } catch (err) {
    logger.debug({ err: err.message }, 'traffic metric insert failed');
  }
}

async function getRecentRequestLogs(limit = 100) {
  if (!available) return [];
  const res = await getPool().query(
    `SELECT * FROM request_logs ORDER BY timestamp DESC LIMIT $1`,
    [limit]
  );
  return res.rows;
}

module.exports = {
  connectDatabase,
  insertRequestLog,
  insertTrafficMetric,
  getRecentRequestLogs,
};
