'use strict';

/** Human-readable copy: purpose, outcomes, and guided workflows. No logic — presentation only. */

export const PAGE_META = {
  '/': {
    title: 'Overview',
    problem:
      'High-traffic apps need a front door that spreads load, caches repeated answers, and keeps running when a server fails. EdgeFlow is that layer.',
    description:
      'A live summary of how the edge proxy is performing right now — speed, cache efficiency, and server health.',
    workflow: [
      { action: 'Start with Simulator', result: 'Send real HTTP requests through the proxy' },
      { action: 'Open Backends or Cache', result: 'Watch routing and caching respond in real time' },
      { action: 'Return here', result: 'See the big picture update every second' },
    ],
    tip: 'New here? Pick Simulator → Load balancer demo, then switch between pages — every chart reacts live.',
  },
  '/backends': {
    title: 'Backends',
    problem:
      'One server cannot handle all users. The proxy picks which of three origin servers should answer each request.',
    description:
      'See every request travel from the client → edge proxy → a backend (or cache). Switch algorithms to change how traffic is split.',
    workflow: [
      { action: 'Simulator → Load balancer demo', result: 'Steady traffic hits all three servers' },
      { action: 'Switch an algorithm below', result: 'Traffic split changes immediately' },
      { action: 'Watch the path diagram', result: 'Highlighted node = where the last request went' },
    ],
    tip: 'Turn cache bust OFF in Simulator so requests reach backends — otherwise most traffic stops at cache.',
  },
  '/cache': {
    title: 'Cache',
    problem:
      'Calling the same backend for identical data wastes time and money. Caching stores answers so repeat requests are instant.',
    description:
      'Two layers: L1 (in-memory, fastest) and L2 (Redis, shared). A higher hit ratio means fewer slow backend calls.',
    workflow: [
      { action: 'Simulator → Cache warming', result: 'Same URLs sent repeatedly' },
      { action: 'Watch hit ratio climb', result: 'More requests answered without touching a backend' },
      { action: 'Compare L1 vs L2 hits', result: 'See which layer caught each request' },
    ],
    tip: '87% hit ratio means 87% of requests were served from cache — only 13% reached origin servers.',
  },
  '/traffic': {
    title: 'Traffic',
    problem:
      'Operators need to know who is busy, who is idle, and whether compression is saving bandwidth.',
    description:
      'Volume, per-server share, and compression savings — how load is distributed across the edge layer.',
    workflow: [
      { action: 'Generate traffic in Simulator', result: 'Pie chart and timeline fill in' },
      { action: 'Check per-backend table', result: 'See which server carries the most load' },
      { action: 'Note compression savings', result: 'Smaller payloads = faster responses for users' },
    ],
    tip: 'The pie chart counts origin traffic only — cache hits are excluded because they never reach a backend.',
  },
  '/simulator': {
    title: 'Simulator',
    problem:
      'A dashboard without traffic shows zeros. Simulator sends real requests so you can see the system work.',
    description:
      'Your control panel for generating HTTP traffic. Every other page updates live as requests flow through the proxy.',
    workflow: [
      { action: 'Pick a scenario preset', result: 'Traffic is configured for a specific demo' },
      { action: 'Open the linked page', result: 'Watch metrics, charts, and logs react' },
      { action: 'Try manual controls', result: 'Fine-tune speed, endpoints, and error injection' },
    ],
    tip: 'Scenarios are the fastest way to explore — each one is designed to make a specific feature visible.',
  },
  '/errors': {
    title: 'Errors',
    problem:
      'Servers fail. Networks glitch. A production proxy must retry and reroute without dropping user requests.',
    description:
      'When something goes wrong, EdgeFlow retries automatically and moves traffic to a healthy server — you see that recovery here.',
    workflow: [
      { action: 'Simulator → Error & failover', result: '~35% of requests fail on purpose' },
      { action: 'Watch failovers increment', result: 'Proxy reroutes to another backend' },
      { action: 'Check routing log on Backends', result: 'See each failure and recovery step' },
    ],
    tip: 'A failover means: backend failed → proxy retried → user still got a response. No manual intervention.',
  },
  '/rate-limit': {
    title: 'Rate Limit',
    problem:
      'One abusive client can overwhelm your API. Rate limiting caps how many requests each IP can make per minute.',
    description:
      'Before a request reaches any backend, the proxy checks a per-IP quota in Redis. Over the limit → HTTP 429 (blocked).',
    workflow: [
      { action: 'Simulator → Rate limit flood', result: 'Burst of requests exceeds the cap' },
      { action: 'Watch blocked counter rise', result: 'Excess requests rejected at the gate' },
      { action: 'Switch algorithm', result: 'Compare how different counting methods behave' },
    ],
    tip: 'Blocked requests never reach backends — they are stopped at the edge to protect your origin servers.',
  },
  '/logs': {
    title: 'Logs',
    problem:
      'Real-time charts show the present. Logs keep a permanent record of every request for auditing and debugging.',
    description:
      'Every proxied request saved to PostgreSQL — method, status, latency, cache result, backend, and client IP.',
    workflow: [
      { action: 'Send traffic via Simulator', result: 'Requests flow through the proxy' },
      { action: 'Rows appear here within seconds', result: 'Full audit trail builds automatically' },
      { action: 'Cross-check with Backends', result: 'Confirm routing matches the log' },
    ],
    tip: 'Requires DATABASE_URL on the proxy. Without it, live metrics still work — only persistent logs are unavailable.',
  },
  '/health': {
    title: 'Health',
    problem:
      'A server can be running but broken. Health checks probe backends every few seconds and remove bad ones from rotation.',
    description:
      'Automatic monitoring — unhealthy servers are excluded from load balancing until they recover.',
    workflow: [
      { action: 'Watch healthy vs unhealthy counts', result: 'Know how many servers can take traffic' },
      { action: 'Simulator → Error & failover', result: 'Trigger failures and see health change' },
      { action: 'Read health events below', result: 'See exactly when a server went down or recovered' },
    ],
    tip: 'When a backend goes offline, traffic is rerouted automatically — users should not notice an outage.',
  },
};

export const NAV_GROUPS = [
  {
    label: 'Monitor',
    hint: 'How is the system performing?',
    items: [
      { href: '/', label: 'Overview', hint: 'Big-picture health and speed' },
      { href: '/traffic', label: 'Traffic', hint: 'Volume and server share' },
      { href: '/health', label: 'Health', hint: 'Which servers are up' },
    ],
  },
  {
    label: 'Infrastructure',
    hint: 'How does the proxy decide?',
    items: [
      { href: '/backends', label: 'Backends', hint: 'Load balancing & routing' },
      { href: '/cache', label: 'Cache', hint: 'Fast repeat responses' },
      { href: '/rate-limit', label: 'Rate Limit', hint: 'Per-IP request caps' },
      { href: '/errors', label: 'Errors', hint: 'Retries & failover' },
    ],
  },
  {
    label: 'Tools',
    hint: 'Drive the system',
    items: [
      { href: '/simulator', label: 'Simulator', hint: 'Generate test traffic' },
      { href: '/logs', label: 'Logs', hint: 'Permanent request history' },
    ],
  },
];

export const CONNECTION_STATUS = {
  connected: {
    label: 'Live metrics active',
    detail: 'Dashboard updates as requests flow through the proxy.',
  },
  disconnected: {
    label: 'Metrics paused',
    detail: 'Start the edge proxy — numbers will refresh automatically when connected.',
  },
};

export const LB_ALGORITHMS = {
  'round-robin': {
    label: 'Round Robin',
    summary: 'Distributes requests evenly across all available servers.',
    outcome: 'Over time, each backend receives roughly equal traffic (~33% each).',
    whenToUse: 'Best default when all servers have similar capacity.',
  },
  'weighted-round-robin': {
    label: 'Weighted Round Robin',
    summary: 'Gives more traffic to servers with higher weights.',
    outcome: 'Backend A (~50%), B (~33%), C (~17%) based on configured weights.',
    whenToUse: 'When some servers are more powerful than others.',
  },
  'least-connections': {
    label: 'Least Connections',
    summary: 'Sends each request to the server with the fewest in-flight requests.',
    outcome: 'Busy servers receive less new traffic — load balances toward idle servers.',
    whenToUse: 'When request duration varies and connections matter more than count.',
  },
  'ip-hash': {
    label: 'IP Hash',
    summary: 'Same client IP always reaches the same backend.',
    outcome: 'One user sticks to one server (~100% to a single backend per IP).',
    whenToUse: 'When session stickiness is required without cookies.',
  },
};

export const RATE_LIMIT_ALGORITHMS = {
  'token-bucket': {
    label: 'Token bucket',
    summary: 'Tokens refill steadily; each request spends one token.',
    outcome: 'Allows short bursts, then smooths traffic when tokens run out.',
  },
  'fixed-window': {
    label: 'Fixed window',
    summary: 'Counts requests per fixed minute, then resets.',
    outcome: 'Simple cap — can allow double traffic at window boundaries.',
  },
  'sliding-window': {
    label: 'Sliding window',
    summary: 'Counts requests in the rolling last 60 seconds.',
    outcome: 'Stricter, smoother limiting — no sudden reset spikes.',
  },
};

export const SIMULATOR_SCENARIOS = {
  'lb-demo': {
    watchOn: 'Backends',
    outcome: 'Traffic split bar and routing diagram update live.',
  },
  'rate-flood': {
    watchOn: 'Rate Limit',
    outcome: 'Blocked counter rises — excess requests get HTTP 429.',
  },
  errors: {
    watchOn: 'Errors',
    outcome: 'Failover count increases — proxy reroutes around failures.',
  },
  'cache-warm': {
    watchOn: 'Cache',
    outcome: 'Hit ratio climbs as repeated URLs are served from cache.',
  },
  mixed: {
    watchOn: 'Overview',
    outcome: 'General traffic across all metrics and charts.',
  },
};

export const PRESET_HINTS = {
  Light: 'One request every 500ms — gentle load for observation.',
  Normal: 'Five requests per second — typical demo pace.',
  Heavy: '~12 requests per second — stress the proxy.',
  Flood: 'As fast as possible — use for rate-limit testing.',
};
