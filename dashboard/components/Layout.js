'use strict';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import EdgeFlowLogo from './EdgeFlowLogo';
import NavIcon from './NavIcon';
import { NAV_GROUPS, PAGE_META, CONNECTION_STATUS } from '../lib/interpret';

function MenuIcon({ open }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Layout({ children, connected }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = PAGE_META[router.pathname] || { title: 'Dashboard', description: '' };
  const status = connected ? CONNECTION_STATUS.connected : CONNECTION_STATUS.disconnected;

  useEffect(() => {
    setMenuOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {menuOpen && (
        <button
          type="button"
          className="mobile-overlay"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand bg-white">
          <EdgeFlowLogo />
        </div>

        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          {NAV_GROUPS.map((group, groupIndex) => (
            <div key={group.label}>
              {groupIndex > 0 && <div className="nav-group-divider" aria-hidden />}
              <div className={group.featured ? 'nav-group-featured' : 'px-1'}>
                <p className="nav-group-label">{group.label}</p>
                <div className="space-y-0.5 mt-1.5">
                  {group.items.map((item) => {
                    const active = router.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-link ${active ? 'nav-link-active' : ''}`}
                        onClick={() => setMenuOpen(false)}
                        aria-current={active ? 'page' : undefined}
                      >
                        <NavIcon name={item.icon} active={active} />
                        <span className="nav-link-label">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-status">
          <div
            className={`status-pill w-full ${connected ? 'status-live' : 'status-off'}`}
            title={status.detail}
          >
            <span className="status-dot" />
            {status.label}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-edge-border">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                className="lg:hidden p-1.5 -ml-1.5 rounded-md text-edge-foreground hover:bg-neutral-50"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MenuIcon open={menuOpen} />
              </button>
              <div className="lg:hidden">
                <EdgeFlowLogo compact />
              </div>
              <div className="hidden lg:block min-w-0">
                <h2 className="text-sm font-medium text-edge-foreground truncate">{meta.title}</h2>
                {meta.description && (
                  <p className="text-xs text-edge-muted mt-0.5 truncate max-w-xl">{meta.description}</p>
                )}
              </div>
            </div>
            <div
              className={`status-pill shrink-0 ${connected ? 'status-live' : 'status-off'}`}
              title={status.detail}
            >
              <span className="status-dot" />
              <span className="hidden sm:inline">{status.label}</span>
            </div>
          </div>
          <div className="lg:hidden px-4 pb-3 sm:px-6 border-t border-edge-border/60 pt-3">
            <h2 className="text-sm font-medium text-edge-foreground">{meta.title}</h2>
            {meta.description && (
              <p className="text-xs text-edge-muted mt-0.5 leading-relaxed">{meta.description}</p>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 max-w-6xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
