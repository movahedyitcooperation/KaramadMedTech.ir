import { cn } from "@/lib/utils/cn";
import { fa } from "@/lib/i18n/fa";

interface LogoProps {
  variant?: "full" | "icon";
  className?: string;
}

function LogoIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
      <rect width="40" height="40" rx="12" fill="#0E6BA8" />
      <path d="M20 10v20M10 20h20" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
      <circle cx="20" cy="20" r="16.5" fill="none" stroke="#14A38B" strokeWidth="2" opacity="0.5" />
    </svg>
  );
}

/**
 * Single-file brand mark — swap the wordmark/icon here when a real logo
 * exists, per CLAUDE.md section 8.
 */
export function Logo({ variant = "full", className }: LogoProps) {
  if (variant === "icon") {
    return (
      <div className={cn("inline-flex", className)} role="img" aria-label={fa.brand.name}>
        <LogoIcon />
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <LogoIcon />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-base font-bold text-ink-900 sm:text-lg" translate="no">
          {fa.brand.name}
        </span>
        <span className="hidden text-xs text-ink-500 sm:block">{fa.brand.tagline}</span>
      </div>
    </div>
  );
}
