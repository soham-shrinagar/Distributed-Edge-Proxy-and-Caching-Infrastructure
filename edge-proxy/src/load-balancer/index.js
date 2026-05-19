'use strict';

const { BackendPool } = require('./pool');

const pool = new BackendPool();

function getPool() {
  return pool;
}

module.exports = { getPool };
