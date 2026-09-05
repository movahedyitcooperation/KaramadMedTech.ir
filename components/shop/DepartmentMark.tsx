import Image from "next/image";
import type { Department } from "@/lib/utils/department";

interface DepartmentMarkProps {
  department: Department | null;
  label: string;
  size?: number;
}

/**
 * The ONLY sanctioned way to render a department color (CLAUDE.md §3: a
 * department hue must never appear without its icon and label — color is
 * always the third cue, never the only one). Never import a department's
 * `tint`/`deep` value directly into a component that skips this wrapper —
 * that's how the "no color on the shopping surface itself" rule gets
 * violated by accident. `department === null` (an unrecognized slug) falls
 * back to a neutral surface/ink treatment rather than guessing a color.
 */
export function DepartmentMark({ department, label, size = 34 }: DepartmentMarkProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="grid shrink-0 place-items-center rounded-4 border"
        style={{
          width: size,
          height: size,
          background: department?.tint ?? "var(--color-surface)",
          borderColor: department ? `color-mix(in oklab, ${department.deep} 40%, transparent)` : "var(--color-line)",
        }}
      >
        {department && (
          <Image
            src={department.iconSrc}
            alt=""
            width={Math.round(size * 0.8)}
            height={Math.round(size * 0.8)}
            aria-hidden="true"
          />
        )}
      </span>
      <span
        className="font-semibold"
        style={{ color: department?.deep ?? "var(--color-ink)" }}
      >
        {label}
      </span>
    </span>
  );
}
