interface WatermarkProps {
  /** A CSS color value (e.g. a department "-deep" token) to tint the mark —
   * defaults to the brand emerald. Used on category empty-states to tint
   * the mark to the department the visitor was browsing. */
  tone?: string;
  className?: string;
}

/** The embossed letterhead cross — the one decorative flourish used on
 * empty/terminal panels (empty cart, "search isn't live yet", account
 * orders-empty-state). Always `currentColor`-tinted via the `tone` prop so
 * it can pick up a department color without a second component. */
export function Watermark({ tone, className }: WatermarkProps) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        position: "absolute",
        insetBlockStart: -30,
        insetInlineStart: -30,
        width: 136,
        height: 136,
        opacity: 0.1,
        color: tone ?? "var(--color-emerald)",
        pointerEvents: "none",
      }}
    >
      <span style={{ position: "absolute", top: 0, left: 56, width: 24, height: 136, background: "currentColor", borderRadius: 3 }} />
      <span style={{ position: "absolute", top: 56, left: 0, width: 136, height: 24, background: "currentColor", borderRadius: 3 }} />
    </span>
  );
}
