import { cva, type VariantProps } from "class-variance-authority";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-[background-color,border-color,box-shadow,transform] duration-(--duration-base) ease-out-soft cursor-pointer active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-brand-600 text-white shadow-xs hover:bg-brand-700",
        success: "bg-green-500 text-white shadow-xs hover:bg-green-600",
        accent: "bg-accent-500 text-white shadow-xs hover:bg-accent-600",
        outline:
          "border border-line-strong bg-surface text-ink-900 hover:border-brand-200 hover:bg-brand-50",
        ghost: "bg-transparent text-ink-900 hover:bg-brand-50",
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
