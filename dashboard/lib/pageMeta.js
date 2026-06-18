'use strict';

export const PAGE_META = {
  '/': {
    title: 'Overview',
    description:
      'Live snapshot of your edge proxy — throughput, latency, cache efficiency, and backend health.',
    tip: 'Start with Simulator → Load balancer demo to generate traffic, then watch these metrics update.',
  },
  '/backends': {
    title: 'Backends',
    description:
      'See how the proxy routes each request across three origin servers using your chosen algorithm.',
    tip: 'Turn cache bust OFF in Simulator so requests hit real backends and the traffic split bar fills.',
  },
  '/cache': {
    title: 'Cache',
    description:
      'Two-tier caching: L1 in-memory (fast) and L2 Redis (shared). Higher hit ratio = fewer origin calls.',
    tip: 'Run Simulator → Cache warming to watch HIT ratio climb on repeated URLs.',
  },
  '/traffic': {
    title: 'Traffic',
    description:
      'Request volume, backend utilization, and compression savings across the edge layer.',
    tip: 'Pie chart reflects last 10 seconds of origin traffic only.',
  },
  '/simulator': {
    title: 'Simulator',
    description:
      'Send real HTTP traffic through the proxy. Every other page reacts live via WebSocket.',
    tip: 'Pick a scenario preset for a guided demo, or use manual controls below.',
  },
  '/errors': {
    title: 'Errors',
    description:
      'Error rate, automatic retries, and failover events when a backend fails or times out.',
    tip: 'Run Simulator → Error & failover to inject chaos and see recovery here.',
  },
  '/rate-limit': {
    title: 'Rate Limit',
    description:
      'Redis-backed per-IP throttling. Requests over the cap receive HTTP 429 before reaching backends.',
    tip: 'Run Simulator → Rate limit flood to fill the blocked counter.',
  },
  '/logs': {
    title: 'Logs',
    description:
      'Persistent request log stored in PostgreSQL — every proxied call with status, cache, and backend.',
    tip: 'Requires DATABASE_URL on the proxy. Send traffic first, rows appear within seconds.',
  },
  '/health': {
    title: 'Health',
    description:
      'Backend health probes every 5s, plus Redis and proxy memory status.',
    tip: 'Unhealthy backends are automatically removed from the load balancer pool.',
  },
};

export const NAV_GROUPS = [
  {
    label: 'Monitor',
    items: [
      { href: '/', label: 'Overview' },
      { href: '/traffic', label: 'Traffic' },
      { href: '/health', label: 'Health' },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { href: '/backends', label: 'Backends' },
      { href: '/cache', label: 'Cache' },
      { href: '/rate-limit', label: 'Rate Limit' },
      { href: '/errors', label: 'Errors' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/simulator', label: 'Simulator' },
      { href: '/logs', label: 'Logs' },
    ],
  },
];
