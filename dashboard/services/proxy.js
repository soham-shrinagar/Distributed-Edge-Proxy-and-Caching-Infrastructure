'use strict';

/** Same-origin path; Next.js rewrites to edge proxy :8080 */
const PROXY_BASE = '/api/edge';

export async function sendProxyRequest(path, options = {}) {
  const url = path.startsWith('/') ? `${PROXY_BASE}${path}` : `${PROXY_BASE}/${path}`;
  const bust = options.cacheBust ? `?t=${Date.now()}-${Math.random().toString(36).slice(2)}` : '';
  const fullUrl = url.includes('?') ? url : `${url}${bust}`;

  const start = performance.now();
  const headers = {};
  if (options.chaos) headers['X-Edge-Chaos'] = '1';

  const res = await fetch(fullUrl, { method: 'GET', cache: 'no-store', headers });
  const latency = Math.round(performance.now() - start);

  return {
    ok: res.ok,
    status: res.status,
    latency,
    cache: res.headers.get('x-cache-status') || '-',
    backend: res.headers.get('x-backend-server') || res.headers.get('x-backend') || '-',
    path: path.split('?')[0],
    chaos: Boolean(options.chaos),
  };
}

export const ENDPOINTS = [
  { id: 'products', path: '/products', label: 'Products' },
  { id: 'users', path: '/users', label: 'Users' },
  { id: 'analytics', path: '/analytics', label: 'Analytics' },
];
