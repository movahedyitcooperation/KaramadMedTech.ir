import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
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
  /** "tint" — the department's own hue behind the icon (default).
   *  "plain" — no department hue anywhere: a neutral surface disc carrying
   *  only the icon, with the label left in the caller's own color and weight.
   *  For the emerald-deep nav strip, where a pastel tint cannot read and the
   *  owner's dark-green artwork needs a light disc under it to stay legible. */
  tone?: "tint" | "plain";
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
 * for a bigger disc. `tone="plain"` exists for the opposite reason: the nav
 * strip wants the icon and nothing else, so it stays inside this component
 * rather than hand-rolling a second disc-plus-icon of its own.
 */
export function DepartmentMark({
  department,
  label,
  size = 34,
  layout = "inline",
  tone = "tint",
  meta,
  className,
}: DepartmentMarkProps) {
  const stacked = layout === "stack";
  const plain = tone === "plain";
  // The artwork is drawn with ~25% transparent margin on every side, so at
  // full size its ink lands at half the disc's diameter — the proportion the
  // owner's reference icons show. The tinted variants inset it further to
  // leave room for the chip's border.
  const iconSize = Math.round(size * (plain ? 1 : stacked ? 0.79 : 0.8));

  // A plain disc has no hue to fill it with, so an unrecognized department
  // gets the hairline outline the nav strip used before icons landed there
  // rather than a blank light circle shouting on the dark ground.
  const plainOutline = plain && !department;
  const discStyle: CSSProperties = plain
    ? plainOutline
      ? { background: "transparent", borderColor: "color-mix(in oklab, currentColor 55%, transparent)" }
      : { background: "var(--color-surface)" }
    : {
        background: department?.tint ?? "var(--color-surface)",
        borderColor: department
          ? `color-mix(in oklab, ${department.deep} 40%, transparent)`
          : "var(--color-line)",
      };

  return (
    <span
      className={cn(
        stacked ? "flex flex-col items-center gap-3.5 text-center" : "inline-flex items-center gap-2",
        className
      )}
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center",
          stacked || plain ? "rounded-full" : "rounded-4",
          (!plain || plainOutline) && "border"
        )}
        style={{ width: size, height: size, ...discStyle }}
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
        <span
          className={cn(!plain && "font-semibold")}
          style={plain ? undefined : { color: department?.deep ?? "var(--color-ink)" }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
