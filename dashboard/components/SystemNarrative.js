'use strict';

import { OutcomeBanner } from './PageIntro';

export function OverviewNarrative({ metrics }) {
  const m = metrics || {};
  if ((m.totalRequests ?? 0) === 0 && (m.requestsPerSecond ?? 0) === 0) {
    return <OutcomeBanner>No traffic yet — try Simulator to generate some.</OutcomeBanner>;
  }
  if ((m.unhealthyBackends ?? 0) > 0) {
    return (
      <OutcomeBanner>
        {m.unhealthyBackends} backend down — traffic rerouted to healthy servers.
      </OutcomeBanner>
    );
  }
  return null;
}

export function HealthNarrative({ metrics }) {
  const m = metrics || {};
  if ((m.unhealthyBackends ?? 0) > 0) {
    return (
      <OutcomeBanner>
        {m.unhealthyBackends} unhealthy — excluded from load balancing.
      </OutcomeBanner>
    );
  }
  if (!m.redis?.connected) {
    return <OutcomeBanner>Redis offline — L2 cache and rate limits disabled.</OutcomeBanner>;
  }
  return null;
}

export function ErrorsNarrative({ metrics }) {
  const retry = metrics?.retry || {};
  const recent = retry.recentFailovers || [];
  if (recent.length > 0) {
    const last = recent[0];
    return (
      <OutcomeBanner>
        {last.failedServer} → {last.reroutedServer} (failover recovered)
      </OutcomeBanner>
    );
  }
  return null;
}

export function CacheNarrative({ metrics }) {
  const cache = metrics?.cache || {};
  const hitRatio = (cache.combined?.hitRatio ?? 0) * 100;
  const l1 = cache.l1 || {};
  if (hitRatio === 0 && (l1.hits ?? 0) === 0) {
    return <OutcomeBanner>No cache hits yet — try Simulator → Cache warming.</OutcomeBanner>;
  }
  return null;
}
