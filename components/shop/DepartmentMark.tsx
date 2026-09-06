import Image from "next/image";
import type { ReactNode } from "react";
import type { Department } from "@/lib/utils/department";
import { cn } from "@/lib/utils/cn";

interface DepartmentMarkProps {
  department: Department | null;
  label: string;
  /** Edge length of the tinted chip/disc in px. */
  size?: number;
  /** "inline" — chip beside the label (category H1, mobile nav row).
   *  "stack" — disc above the label (the home category rail). */
  layout?: "inline" | "stack";
  /** Rendered under the label in "stack" layout — the «۵ کالا» count line. */
  meta?: ReactNode;
  className?: string;
}

/**
 * The ONLY sanctioned way to render a department color (CLAUDE.md §3: a
 * department hue must never appear without its icon and label — color is
 * always the third cue, never the only one). Never import a department's
 * `tint`/`deep` value directly into a component that skips this wrapper —
 * that's how the "no color on the shopping surface itself" rule gets
 * violated by accident. `department === null` (an unrecognized slug) falls
 * back to a neutral surface/ink treatment rather than guessing a color.
 *
 * Both layouts exist so the home rail — the one place all six departments
 * appear together, as a legend — doesn't have to reach past this component
 * for a bigger disc.
 */
export function DepartmentMark({
  department,
  label,
  size = 34,
  layout = "inline",
  meta,
  className,
}: DepartmentMarkProps) {
  const stacked = layout === "stack";
  const iconSize = Math.round(size * (stacked ? 0.79 : 0.8));

  return (
    <span
      className={cn(
        stacked ? "flex flex-col items-center gap-3.5 text-center" : "inline-flex items-center gap-2",
        className
      )}
    >
      <span
        className={cn("grid shrink-0 place-items-center border", stacked ? "rounded-full" : "rounded-4")}
        style={{
          width: size,
          height: size,
          background: department?.tint ?? "var(--color-surface)",
          borderColor: department
            ? `color-mix(in oklab, ${department.deep} 40%, transparent)`
            : "var(--color-line)",
        }}
      >
        {department && (
          <Image
            src={department.iconSrc}
            alt=""
            width={iconSize}
            height={iconSize}
            aria-hidden="true"
          />
        )}
      </span>
      {stacked ? (
        <span className="flex flex-col items-center gap-1.5">
          <span className="text-14 leading-relaxed font-semibold text-ink">{label}</span>
          {meta && <span className="text-12 text-ink/72">{meta}</span>}
        </span>
      ) : (
        <span className="font-semibold" style={{ color: department?.deep ?? "var(--color-ink)" }}>
          {label}
        </span>
      )}
    </span>
  );
}
