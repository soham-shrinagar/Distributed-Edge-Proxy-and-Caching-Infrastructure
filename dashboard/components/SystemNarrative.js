'use strict';

import { OutcomeBanner } from './PageIntro';

export function OverviewNarrative({ metrics }) {
  const m = metrics || {};
  const lines = [];

  const healthy = m.healthyBackends ?? 0;
  const total = m.backends?.length ?? 3;
  const unhealthy = m.unhealthyBackends ?? 0;
  const hitRatio = (m.cacheHitRatio ?? 0) * 100;
  const failovers = m.retry?.failoverCount ?? 0;
  const rps = m.requestsPerSecond ?? 0;

  if (rps === 0 && (m.totalRequests ?? 0) === 0) {
    return (
      <OutcomeBanner title="No traffic yet">
        Open <strong>Simulator</strong> and pick a scenario — metrics on this page will update as requests
        flow through the proxy.
      </OutcomeBanner>
    );
  }

  if (unhealthy > 0) {
    lines.push(
      `${unhealthy} backend${unhealthy > 1 ? 's' : ''} offline — traffic automatically rerouted to the ${healthy} healthy server${healthy !== 1 ? 's' : ''}. No manual action needed.`
    );
  } else if (healthy === total && total > 0) {
    lines.push(`All ${total} backends healthy — load is being distributed across the full pool.`);
  }

  if (hitRatio >= 50) {
    lines.push(
      `${hitRatio.toFixed(0)}% of requests served from cache — backends handle less load and users get faster responses.`
    );
  } else if (hitRatio > 0) {
    lines.push(
      `Cache hit ratio is ${hitRatio.toFixed(0)}% — run Simulator → Cache warming to see this climb on repeated URLs.`
    );
  }

  if (failovers > 0) {
    lines.push(
      `${failovers} failover${failovers > 1 ? 's' : ''} handled — failed requests were retried on another backend automatically.`
    );
  }

  if (rps > 0) {
    lines.push(`Processing ${rps.toFixed(1)} requests per second through the edge layer right now.`);
  }

  if (!lines.length) return null;

  return (
    <OutcomeBanner title="What the system is doing">
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {line}
        </span>
      ))}
    </OutcomeBanner>
  );
}

export function HealthNarrative({ metrics }) {
  const m = metrics || {};
  const unhealthy = m.unhealthyBackends ?? 0;
  const healthy = m.healthyBackends ?? 0;
  const redisOk = m.redis?.connected;

  if (unhealthy > 0) {
    return (
      <OutcomeBanner title="Automatic protection active">
        {unhealthy} server{unhealthy > 1 ? 's are' : ' is'} unhealthy and excluded from load balancing. Traffic
        continues on {healthy} healthy backend{healthy !== 1 ? 's' : ''} — users should not see downtime.
      </OutcomeBanner>
    );
  }

  if (!redisOk) {
    return (
      <OutcomeBanner title="Redis offline">
        L2 cache and rate limiting are unavailable. L1 memory cache still works; rate limits are disabled until
        Redis reconnects.
      </OutcomeBanner>
    );
  }

  if (healthy > 0) {
    return (
      <OutcomeBanner title="All systems operational">
        {healthy} backend{healthy !== 1 ? 's' : ''} passing health checks every 5 seconds. Redis connected for
        shared cache and rate limits.
      </OutcomeBanner>
    );
  }

  return null;
}

export function ErrorsNarrative({ metrics }) {
  const m = metrics || {};
  const retry = m.retry || {};
  const errorRate = (m.errorRate ?? 0) * 100;
  const failovers = retry.failoverCount ?? 0;
  const recent = retry.recentFailovers || [];

  if (failovers === 0 && errorRate < 0.01) {
    return (
      <OutcomeBanner title="No failures detected">
        When a backend fails, the proxy retries and reroutes automatically. Run Simulator → Error &amp; failover
        to see this recovery in action.
      </OutcomeBanner>
    );
  }

  if (recent.length > 0) {
    const last = recent[0];
    return (
      <OutcomeBanner title="Failover recovered automatically">
        Latest: {last.failedServer} failed → traffic moved to {last.reroutedServer} after{' '}
        {last.retryCount} retr{last.retryCount === 1 ? 'y' : 'ies'}. The user request was not dropped.
      </OutcomeBanner>
    );
  }

  if (errorRate > 0) {
    return (
      <OutcomeBanner title="Errors being handled">
        {errorRate.toFixed(1)}% error rate in the current window. The proxy is retrying failed requests and
        rerouting when backends are unavailable.
      </OutcomeBanner>
    );
  }

  return null;
}

export function CacheNarrative({ metrics }) {
  const cache = metrics?.cache || {};
  const hitRatio = (cache.combined?.hitRatio ?? 0) * 100;
  const l1 = cache.l1 || {};
  const l2 = cache.l2 || {};

  if (hitRatio === 0 && (l1.hits ?? 0) === 0 && (l2.hits ?? 0) === 0) {
    return (
      <OutcomeBanner title="Cache is empty">
        Send repeated requests via Simulator → Cache warming. The hit ratio will climb as identical URLs are
        answered from memory instead of backends.
      </OutcomeBanner>
    );
  }

  if (hitRatio >= 70) {
    return (
      <OutcomeBanner title="Cache is working well">
        {hitRatio.toFixed(0)}% of requests answered from cache — only {(100 - hitRatio).toFixed(0)}% reach origin
        servers. That means lower latency and less backend load.
      </OutcomeBanner>
    );
  }

  if (hitRatio > 0) {
    return (
      <OutcomeBanner title="Cache warming up">
        {hitRatio.toFixed(0)}% hit ratio so far. Keep sending the same URLs (cache bust OFF) to watch more
        requests skip the backends entirely.
      </OutcomeBanner>
    );
  }

  return null;
}
