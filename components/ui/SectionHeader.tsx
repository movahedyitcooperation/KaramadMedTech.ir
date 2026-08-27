import Link from "next/link";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils/cn";

interface SectionHeaderProps {
  /** Small tracked label above the heading. */
  kicker?: string;
  title: string;
  /** When set, renders a "مشاهده همه" link on the logical-end side. */
  viewAllHref?: string;
  /** Heading level for correct document outline. Defaults to h2. */
  as?: "h1" | "h2" | "h3";
  className?: string;
}

/**
 * The storefront's signature section marker: a short accent rule on the
 * logical-start side, an optional brand-tinted kicker, then the heading.
 * Replaces the ad-hoc `<span class="h-4 w-1 bg-accent-500">` tick that was
 * copy-pasted across sections.
 */
export function SectionHeader({
  kicker,
  title,
  viewAllHref,
  as: Heading = "h2",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-5 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {kicker && (
          <span className="flex items-center gap-2 text-xs font-medium tracking-wide text-brand-600">
            <span className="h-px w-8 bg-accent-500" aria-hidden="true" />
            {kicker}
          </span>
        )}
        <Heading
          className={cn(
            "text-balance font-bold text-ink-900",
            kicker ? "mt-1.5" : "",
            Heading === "h1" ? "text-2xl sm:text-[26px]" : "text-xl sm:text-[22px]"
          )}
        >
          {title}
        </Heading>
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="shrink-0 text-sm font-medium text-brand-600 transition-colors duration-(--duration-fast) hover:text-brand-700 hover:underline"
        >
          {fa.common.viewAll}
        </Link>
      )}
    </div>
  );
}
