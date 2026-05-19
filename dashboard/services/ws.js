'use strict';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8080/ws/metrics';
const API_BASE = '/api/proxy';

export function connectMetricsWebSocket(onMessage, onError) {
  if (typeof window === 'undefined') return () => {};

  let ws;
  let closed = false;
  let reconnectTimer;

  function connect() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'metrics' && msg.data) {
          onMessage(msg.data);
        }
      } catch {
        /* ignore */
      }
    };

    ws.onerror = () => onError?.(new Error('WebSocket error'));

    ws.onclose = () => {
      if (!closed) {
        reconnectTimer = setTimeout(connect, 3000);
      }
    };
  }

  connect();

  return () => {
    closed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) ws.close();
  };
}

export async function fetchAdmin(path, options = {}) {
  const res = await fetch(`${API_BASE}/${path}`, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
