'use strict';

const config = require('../config');

/**
 * Build pg Pool options from DATABASE_URL (Neon, etc.) or discrete PG_* env vars.
 */
function getPgPoolConfig() {
  if (config.postgres.connectionString) {
    return {
      connectionString: config.postgres.connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30_000,
    };
  }

  return {
    host: config.postgres.host,
    port: config.postgres.port,
    user: config.postgres.user,
    password: config.postgres.password,
    database: config.postgres.database,
    ssl: config.postgres.ssl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30_000,
  };
}

module.exports = { getPgPoolConfig };
