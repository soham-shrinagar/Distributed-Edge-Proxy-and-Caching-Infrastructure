'use strict';

const pino = require('pino');
const config = require('../config');

const logger = pino({
  level: config.logging.level,
  transport:
    config.env === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined,
  base: { service: 'edge-proxy' },
});

function child(bindings) {
  return logger.child(bindings);
}

module.exports = { logger, child };
