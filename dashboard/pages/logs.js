'use strict';

import { useEffect, useState } from 'react';
import { fetchAdmin } from '../services/ws';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await fetchAdmin('logs/requests?limit=80');
        if (active) setLogs(data);
      } catch {
        /* proxy may be down */
      }
    }
    load();
    const t = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  return (
    <section className="card overflow-hidden">
      <table className="w-full text-xs font-mono">
        <thead className="bg-neutral-50">
          <tr className="text-edge-muted">
            <th className="text-left p-3">Time</th>
            <th className="text-left p-3">Method</th>
            <th className="text-left p-3">Endpoint</th>
            <th className="text-right p-3">Status</th>
            <th className="text-right p-3">Latency</th>
            <th className="text-center p-3">Cache</th>
            <th className="text-left p-3">Backend</th>
            <th className="text-left p-3">IP</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 && (
            <tr>
              <td colSpan={8} className="p-8 text-center text-edge-muted">
                No logs yet — requires PostgreSQL. Send traffic through the proxy.
              </td>
            </tr>
          )}
          {logs.map((log) => (
            <tr key={log.id} className="border-t border-edge-border/40 hover:bg-neutral-50">
              <td className="p-3">{new Date(log.timestamp).toLocaleTimeString()}</td>
              <td className="p-3">{log.method}</td>
              <td className="p-3">{log.endpoint}</td>
              <td className="p-3 text-right">
                <span
                  className={
                    log.status_code >= 500
                      ? 'text-edge-muted'
                      : log.status_code >= 400
                        ? 'text-edge-muted'
                        : 'text-edge-foreground'
                  }
                >
                  {log.status_code}
                </span>
              </td>
              <td className="p-3 text-right">{log.latency}ms</td>
              <td className="p-3 text-center">{log.cache_hit ? 'HIT' : 'MISS'}</td>
              <td className="p-3">{log.backend_server || '-'}</td>
              <td className="p-3 text-edge-muted">{log.ip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
