import { cva, type VariantProps } from "class-variance-authority";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/** Exported so a <Link> can wear the button's look WITHOUT a <button>
 * nested inside it — that is invalid HTML and gives one action two tab
 * stops. Use `buttonVariants({ variant, size })` on the Link itself. */
export const buttonVariants = cva(
  // rounded-pill lives in the BASE, not a variant — every button in this
  // design is a pill; a one-off square control overrides with
  // className="rounded-3" (twMerge resolves the rounded-* group correctly).
  // active:* is the shared "press floor" — every button gets the same
  // tactile feedback regardless of variant.
  "inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-[color,background-color,border-color,transform,box-shadow] duration-(--duration-state) ease-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 whitespace-nowrap active:translate-y-px active:scale-[0.985] active:duration-(--duration-tick)",
  {
    variants: {
      variant: {
        // Ink is the primary CTA everywhere — emerald is reserved for
        // ground/state, never a button fill (CLAUDE.md §3).
        ink: "bg-ink text-surface hover:bg-emerald",
        emerald: "bg-emerald-live-deep text-surface hover:bg-emerald",
        outline: "border border-line bg-surface text-ink hover:bg-page",
        ghost: "bg-transparent text-ink hover:bg-page",
        danger: "bg-danger text-surface hover:brightness-90",
      },
      size: {
        sm: "h-10 px-4 text-sm",
        md: "h-11 px-5 text-base",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "ink", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <CircleNotch className="animate-spin" size={18} aria-hidden="true" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
