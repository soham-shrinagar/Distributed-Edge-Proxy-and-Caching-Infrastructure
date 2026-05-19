'use strict';

const WINDOW_MS = 10_000;
const MAX_ROUTING = 25;
const MAX_RL_EVENTS = 20;

const routingLog = [];
const rateLimitAllowed = [];
const rateLimitBlocked = [];

function prune(arr, now = Date.now()) {
  const cutoff = now - WINDOW_MS;
  while (arr.length && arr[0].ts < cutoff) arr.shift();
}

function recordRouting(entry) {
  routingLog.unshift({
    ts: Date.now(),
    ...entry,
  });
  if (routingLog.length > MAX_ROUTING) routingLog.pop();
}

function recordRateLimitCheck(allowed, clientIp) {
  const row = { ts: Date.now(), allowed, clientIp: clientIp?.slice(0, 12) || 'unknown' };
  if (allowed) rateLimitAllowed.push(row);
  else rateLimitBlocked.push(row);
  prune(rateLimitAllowed);
  prune(rateLimitBlocked);
}

function getRoutingLog() {
  return routingLog.map((e) => ({
    ...e,
    time: new Date(e.ts).toLocaleTimeString(),
  }));
}

function getRateLimitWindow() {
  const now = Date.now();
  prune(rateLimitAllowed, now);
  prune(rateLimitBlocked, now);
  const allowed = rateLimitAllowed.length;
  const blocked = rateLimitBlocked.length;
  const total = allowed + blocked || 1;
  return {
    allowed,
    blocked,
    allowedPct: Math.round((allowed / total) * 100),
    blockedPct: Math.round((blocked / total) * 100),
    recent: [
      ...rateLimitBlocked.map((e) => ({ ...e, type: 'blocked' })),
      ...rateLimitAllowed.slice(-5).map((e) => ({ ...e, type: 'allowed' })),
    ]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, MAX_RL_EVENTS)
      .map((e) => ({ ...e, time: new Date(e.ts).toLocaleTimeString() })),
  };
}

function clearRoutingLog() {
  routingLog.length = 0;
}

module.exports = {
  recordRouting,
  recordRateLimitCheck,
  getRoutingLog,
  getRateLimitWindow,
  clearRoutingLog,
};
