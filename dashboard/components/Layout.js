'use strict';

import Link from 'next/link';
import { useRouter } from 'next/router';

const NAV = [
  { href: '/', label: 'Overview' },
  { href: '/backends', label: 'Backends' },
  { href: '/cache', label: 'Cache' },
  { href: '/traffic', label: 'Traffic' },
  { href: '/simulator', label: 'Simulator' },
  { href: '/errors', label: 'Errors' },
  { href: '/rate-limit', label: 'Rate Limit' },
  { href: '/logs', label: 'Logs' },
  { href: '/health', label: 'Health' },
];

export default function Layout({ children, connected }) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex bg-white">
      <aside className="w-56 border-r border-edge-border flex flex-col shrink-0 bg-white">
        <div className="px-5 py-6 border-b border-edge-border">
          <h1 className="text-base font-semibold tracking-tight text-edge-foreground">EdgeFlow</h1>
          <p className="text-xs text-edge-muted mt-1">Infrastructure</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => {
            const active = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? 'bg-black text-white font-medium'
                    : 'text-edge-muted hover:text-edge-foreground hover:bg-neutral-50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-edge-border">
          <div className="flex items-center gap-2 text-xs text-edge-muted">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                connected ? 'bg-black' : 'bg-neutral-300'
              }`}
            />
            {connected ? 'Live metrics' : 'Disconnected'}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-white">
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-edge-border px-8 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-edge-foreground">
              {NAV.find((n) => n.href === router.pathname)?.label || 'Dashboard'}
            </h2>
            <span className="text-xs font-mono text-edge-muted">localhost:8080</span>
          </div>
        </header>
        <div className="p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
