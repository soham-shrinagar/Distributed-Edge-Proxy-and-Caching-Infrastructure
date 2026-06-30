'use strict';

export const PAGE_META = {
  '/': {
    title: 'Overview',
    description: 'Live throughput, latency, cache hits, and backend health.',
  },
  '/backends': {
    title: 'Backends',
    description: 'How requests are routed across origin servers.',
  },
  '/cache': {
    title: 'Cache',
    description: 'L1 in-memory and L2 Redis cache performance.',
  },
  '/traffic': {
    title: 'Traffic',
    description: 'Request volume, backend share, and compression.',
  },
  '/simulator': {
    title: 'Simulator',
    description: 'Send test traffic through the proxy.',
  },
  '/errors': {
    title: 'Errors',
    description: 'Error rate, retries, and failover events.',
  },
  '/rate-limit': {
    title: 'Rate Limit',
    description: 'Per-IP request limits before traffic hits backends.',
  },
  '/logs': {
    title: 'Logs',
    description: 'Persistent request history from the database.',
  },
  '/health': {
    title: 'Health',
    description: 'Backend probes, Redis, and proxy status.',
  },
};

export const NAV_GROUPS = [
  {
    label: 'Tools',
    featured: true,
    items: [
      { href: '/simulator', label: 'Simulator', icon: 'simulator' },
      { href: '/logs', label: 'Logs', icon: 'logs' },
    ],
  },
  {
    label: 'Monitor',
    items: [
      { href: '/', label: 'Overview', icon: 'overview' },
      { href: '/traffic', label: 'Traffic', icon: 'traffic' },
      { href: '/health', label: 'Health', icon: 'health' },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { href: '/backends', label: 'Backends', icon: 'backends' },
      { href: '/cache', label: 'Cache', icon: 'cache' },
      { href: '/rate-limit', label: 'Rate Limit', icon: 'rate-limit' },
      { href: '/errors', label: 'Errors', icon: 'errors' },
    ],
  },
];

export const CONNECTION_STATUS = {
  connected: { label: 'Live', detail: 'Metrics streaming' },
  disconnected: { label: 'Offline', detail: 'Start the proxy' },
};

export const LB_ALGORITHMS = {
  'round-robin': {
    label: 'Round Robin',
    summary: 'Distributes requests evenly across servers.',
  },
  'weighted-round-robin': {
    label: 'Weighted Round Robin',
    summary: 'More traffic to higher-weight servers (~50% / 33% / 17%).',
  },
  'least-connections': {
    label: 'Least Connections',
    summary: 'Sends to the server with fewest active requests.',
  },
  'ip-hash': {
    label: 'IP Hash',
    summary: 'Same client IP always hits the same backend.',
  },
};

export const RATE_LIMIT_ALGORITHMS = {
  'token-bucket': {
    label: 'Token bucket',
    summary: 'Allows bursts, then throttles as tokens run out.',
  },
  'fixed-window': {
    label: 'Fixed window',
    summary: 'Counts per minute, resets at each window.',
  },
  'sliding-window': {
    label: 'Sliding window',
    summary: 'Counts in the rolling last 60 seconds.',
  },
};
