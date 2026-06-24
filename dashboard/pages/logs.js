'use strict';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageIntro, { EmptyState } from '../components/PageIntro';
import { fetchAdmin } from '../services/ws';
import { PAGE_META } from '../lib/interpret';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const meta = PAGE_META['/logs'];

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
    <div className="space-y-8">
      <PageIntro
        title={meta.title}
        problem={meta.problem}
        description={meta.description}
        workflow={meta.workflow}
        tip={meta.tip}
      />

      <section className="card overflow-hidden p-0">
        <div className="px-4 sm:px-6 py-4 border-b border-edge-border">
          <p className="section-heading">Request log</p>
          <p className="section-desc mt-1">
            Permanent audit trail — each row is one request that passed through the proxy. Refreshes every 5
            seconds.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono min-w-[640px]">
            <thead className="bg-neutral-50">
              <tr className="table-head">
                <th className="text-left p-3">Time</th>
                <th className="text-left p-3">Method</th>
                <th className="text-left p-3">Endpoint</th>
                <th className="text-right p-3" title="HTTP status code returned to the client">
                  Status
                </th>
                <th className="text-right p-3" title="End-to-end response time">
                  Latency
                </th>
                <th className="text-center p-3" title="Whether the response came from cache">
                  Cache
                </th>
                <th className="text-left p-3" title="Which backend served the request (if any)">
                  Backend
                </th>
                <th className="text-left p-3" title="Client IP address">
                  IP
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      title="No requests logged yet"
                      action={
                        <Link href="/simulator" className="btn-primary inline-block text-sm">
                          Open Simulator
                        </Link>
                      }
                    >
                      Send traffic through the proxy to build a log. Each request records status, latency,
                      cache result, and which backend answered. Requires PostgreSQL (DATABASE_URL) on the
                      proxy.
                    </EmptyState>
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="table-row">
                  <td className="p-3">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="p-3">{log.method}</td>
                  <td className="p-3">{log.endpoint}</td>
                  <td className="p-3 text-right">
                    <span
                      className={
                        log.status_code >= 400 ? 'text-edge-muted' : 'text-edge-foreground font-medium'
                      }
                      title={log.status_code >= 400 ? 'Request failed or was blocked' : 'Request succeeded'}
                    >
                      {log.status_code}
                    </span>
                  </td>
                  <td className="p-3 text-right">{log.latency}ms</td>
                  <td className="p-3 text-center">
                    <span
                      className={
                        log.cache_hit ? 'text-edge-foreground font-medium' : 'text-edge-muted'
                      }
                      title={
                        log.cache_hit
                          ? 'Answered from cache — backend not contacted'
                          : 'Fetched from backend and stored in cache'
                      }
                    >
                      {log.cache_hit ? 'HIT' : 'MISS'}
                    </span>
                  </td>
                  <td className="p-3">{log.backend_server || '—'}</td>
                  <td className="p-3 text-edge-muted">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
