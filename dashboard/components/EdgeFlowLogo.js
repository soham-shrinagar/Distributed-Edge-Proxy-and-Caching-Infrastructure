'use strict';

export default function EdgeFlowLogo({ compact = false, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={compact ? 28 : 32}
        height={compact ? 28 : 32}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="shrink-0"
      >
        <rect width="32" height="32" rx="8" fill="#09090b" />
        <path
          d="M8 16h6M18 10v12M18 16h6"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="16" cy="16" r="2.5" fill="#ffffff" />
      </svg>
      {!compact && (
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-edge-foreground leading-none">
            EdgeFlow
          </p>
          <p className="text-[11px] text-edge-muted mt-0.5 leading-none">Edge proxy</p>
        </div>
      )}
    </div>
  );
}
