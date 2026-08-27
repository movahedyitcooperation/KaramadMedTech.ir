import { cn } from "@/lib/utils/cn";

interface BrandMeshProps {
  /**
   * "hero" — full cyan→teal→green gradient with soft blobs, for white text on top.
   * "subtle" — faint transparent tint, for layering behind light surfaces.
   */
  strength?: "hero" | "subtle";
  className?: string;
}

/**
 * Reusable brand texture: a soft cyan gradient mesh with a faint medical
 * plus/cross motif. The reference site's neon hexagons become this. Purely
 * decorative — always aria-hidden, never animated.
 */
export function BrandMesh({ strength = "hero", className }: BrandMeshProps) {
  const isHero = strength === "hero";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden",
        className
      )}
    >
      {isHero ? (
        <>
          <div className="absolute inset-0 bg-linear-to-br from-brand-900 via-brand-600 to-green-600" />
          {/* soft light blobs */}
          <div className="absolute -end-24 -top-24 h-72 w-72 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -start-20 bottom-[-30%] h-80 w-80 rounded-full bg-green-500/25 blur-3xl" />
          <div className="absolute end-1/3 top-1/2 h-40 w-40 rounded-full bg-brand-500/30 blur-2xl" />
          <PlusMotif id="brand-plus-hero" className="text-white/[0.07]" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-linear-to-b from-brand-50 to-transparent" />
          <PlusMotif id="brand-plus-subtle" className="text-brand-600/[0.05]" />
        </>
      )}
    </div>
  );
}

function PlusMotif({ id, className }: { id: string; className?: string }) {
  return (
    <svg className={cn("absolute inset-0 h-full w-full", className)} aria-hidden="true">
      <defs>
        <pattern id={id} width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M23 16h2v6h6v2h-6v6h-2v-6h-6v-2h6z" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
