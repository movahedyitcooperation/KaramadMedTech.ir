import { cn } from "@/lib/utils/cn";
import { fa } from "@/lib/i18n/fa";

interface LogoProps {
  variant?: "full" | "icon";
  /** "ink" (default) for a light ground — the admin panel and any
   * light-surface use. "bone" for the emerald header/footer ground. */
  tone?: "ink" | "bone";
  className?: string;
}

function LogoMark({ tone }: { tone: "ink" | "bone" }) {
  const barColor = tone === "bone" ? "var(--color-bone)" : "var(--color-emerald)";
  const borderColor = tone === "bone" ? "rgb(234 233 225 / 0.55)" : "var(--color-line)";
  return (
    <span
      aria-hidden="true"
      className="relative grid h-9.5 w-9.5 shrink-0 place-items-center rounded-4 border"
      style={{ borderColor }}
    >
      <span className="relative block h-4 w-4">
        <span
          className="absolute inset-x-0 top-[6.5px] h-[3px] rounded-full"
          style={{ background: barColor }}
        />
        <span
          className="absolute inset-y-0 start-[6.5px] w-[3px] rounded-full"
          style={{ background: barColor }}
        />
      </span>
    </span>
  );
}

/**
 * Single-file brand mark — the square-outline-plus-cross lockup from the
 * ported design («کارآمد» at 800 weight + «تجهیزات پزشکی» subordinate).
 * Swap the mark here if a real logo file ever exists, per CLAUDE.md §8.
 */
export function Logo({ variant = "full", tone = "ink", className }: LogoProps) {
  if (variant === "icon") {
    return (
      <div className={cn("inline-flex", className)} role="img" aria-label={fa.brand.name}>
        <LogoMark tone={tone} />
      </div>
    );
  }

  const isBone = tone === "bone";
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark tone={tone} />
      <div className="flex flex-col items-start leading-[1.15]">
        <span
          className={cn("text-[23px] font-extrabold tracking-[-0.01em]", isBone ? "text-bone" : "text-ink")}
        >
          {fa.brand.name}
        </span>
        <span className={cn("text-12", isBone ? "text-bone/62" : "text-ink/60")}>
          {fa.brand.tagline}
        </span>
      </div>
    </div>
  );
}
