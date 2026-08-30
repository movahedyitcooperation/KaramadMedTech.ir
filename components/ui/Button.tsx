import { cva, type VariantProps } from "class-variance-authority";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-colors duration-200 ease-out-soft cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-brand-600 text-white hover:bg-brand-700",
        teal: "bg-teal-500 text-white hover:bg-teal-600",
        coral: "bg-coral-500 text-white hover:bg-coral-600",
        outline: "border border-line bg-surface text-ink-900 hover:bg-bg",
        ghost: "bg-transparent text-ink-900 hover:bg-bg",
        danger: "bg-danger text-white hover:bg-red-700",
      },
      size: {
        sm: "h-10 px-4 text-sm",
        md: "h-11 px-5 text-base",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
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
