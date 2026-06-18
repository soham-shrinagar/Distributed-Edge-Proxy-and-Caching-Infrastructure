'use strict';

const pino = require('pino');
const config = require('../config');

const isDev = config.env === 'development';

const logger = pino({
  level: isDev ? config.logging.level : 'silent',
  transport: isDev
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
    : undefined,
  base: { service: 'edge-proxy' },
});

function child(bindings) {
  return logger.child(bindings);
}

module.exports = { logger, child };
