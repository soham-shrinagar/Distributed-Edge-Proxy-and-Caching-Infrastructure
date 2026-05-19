'use strict';

const BACKENDS = [
  { id: 'backend-a', name: 'Backend A', url: 'http://127.0.0.1:3001', weight: 3 },
  { id: 'backend-b', name: 'Backend B', url: 'http://127.0.0.1:3002', weight: 2 },
  { id: 'backend-c', name: 'Backend C', url: 'http://127.0.0.1:3003', weight: 1 },
];

const WS_PATH = '/ws/metrics';
const DEFAULT_CACHE_TTL_MS = 60_000;
const STALE_WHILE_REVALIDATE_MS = 30_000;

module.exports = {
  BACKENDS,
  WS_PATH,
  DEFAULT_CACHE_TTL_MS,
  STALE_WHILE_REVALIDATE_MS,
};
