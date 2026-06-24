'use strict';

const ICONS = {
  overview: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  ),
  traffic: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 12l3.5-4 3 2.5L11 6l3 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  health: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 13.5s-5-3.2-5-7a3 3 0 016 0 3 3 0 016 0c0 3.8-5 7-5 7z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  ),
  backends: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2" width="12" height="3" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
      <rect x="2" y="6.5" width="12" height="3" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
      <rect x="2" y="11" width="12" height="3" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  ),
  cache: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 5l6-3 6 3-6 3-6-3z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M2 8l6 3 6-3M2 11l6 3 6-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  'rate-limit': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 1.5l6 3v4c0 3.3-2.6 6.4-6 7.5-3.4-1.1-6-4.2-6-7.5v-4l6-3z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M6 8l1.5 1.5L10 6.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  errors: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 5.5v3.5M8 11.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 1.5l7 12.5H1L8 1.5z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  ),
  simulator: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 3.5l9 4.5-9 4.5V3.5z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  ),
  logs: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 3.5h10v9H3v-9z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M5.5 6.5h5M5.5 9h3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  ),
};

export default function NavIcon({ name, active }) {
  return (
    <span className={`nav-icon ${active ? 'nav-icon-active' : ''}`} aria-hidden>
      {ICONS[name] || ICONS.overview}
    </span>
  );
}
