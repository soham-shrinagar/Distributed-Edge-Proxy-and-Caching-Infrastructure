'use strict';

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../edge-proxy/.env') });

const { getPgPoolConfig } = require('../edge-proxy/src/services/pg-config');

async function main() {
  const pool = new Pool(getPgPoolConfig());
  const schemaPath = path.join(__dirname, '../shared/db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    await pool.query('SELECT 1');
    await pool.query(schema);
    console.log('✓ PostgreSQL schema applied successfully');
    if (process.env.DATABASE_URL) {
      console.log('  Connected via DATABASE_URL (Neon/cloud)');
    }
  } catch (err) {
    console.error('✗ Database init failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
