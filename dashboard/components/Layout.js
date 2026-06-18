'use strict';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { NAV_GROUPS, PAGE_META } from '../lib/pageMeta';

export default function Layout({ children, connected }) {
  const router = useRouter();
  const meta = PAGE_META[router.pathname] || { title: 'Dashboard', description: '' };

  return (
    <div className="min-h-screen flex bg-edge-canvas">
      <aside className="w-60 border-r border-edge-border flex flex-col shrink-0 bg-white">
        <div className="px-5 py-6 border-b border-edge-border">
          <div className="flex items-center gap-2.5">
            <span className="logo-mark">EF</span>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-edge-foreground">EdgeFlow</h1>
              <p className="text-[11px] text-edge-muted">Edge proxy control plane</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="nav-group-label">{group.label}</p>
              <div className="space-y-0.5 mt-1.5">
                {group.items.map((item) => {
                  const active = router.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`nav-link ${active ? 'nav-link-active' : ''}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-edge-border">
          <div className={`status-pill ${connected ? 'status-live' : 'status-off'}`}>
            <span className="status-dot" />
            {connected ? 'Live stream' : 'Disconnected'}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-edge-canvas/90 backdrop-blur border-b border-edge-border px-8 py-4">
          <div className="flex items-center justify-between max-w-6xl">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-edge-muted">
                {meta.title}
              </p>
              {meta.description && (
                <p className="text-xs text-edge-muted mt-0.5 max-w-xl hidden sm:block line-clamp-1">
                  {meta.description}
                </p>
              )}
            </div>
            <span className="text-[11px] font-mono text-edge-muted bg-white border border-edge-border px-2.5 py-1 rounded-md">
              edge proxy
            </span>
          </div>
        </header>
        <div className="p-8 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
