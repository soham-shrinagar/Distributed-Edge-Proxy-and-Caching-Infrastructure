'use strict';

export default function EdgeFlowLogo({ compact = false, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={compact ? 30 : 34}
        height={compact ? 30 : 34}
        viewBox="0 0 34 34"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="shrink-0"
      >
        <rect width="34" height="34" rx="9" fill="#09090b" />
        <circle cx="17" cy="17" r="3" fill="#ffffff" />
        <path
          d="M17 6v5M17 23v5M6 17h5M23 17h5"
          stroke="#ffffff"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M10.5 10.5l3.5 3.5M20 20l3.5 3.5M23.5 10.5 20 14M14 20l-3.5 3.5"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>
      {!compact && (
        <div className="min-w-0">
          <p className="text-[15px] font-semibold tracking-tight text-edge-foreground leading-none">
            EdgeFlow
          </p>
          <p className="text-[11px] text-edge-muted mt-1 leading-none">Distributed edge proxy</p>
        </div>
      )}
    </div>
  );
}
