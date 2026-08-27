import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "border border-line bg-bg text-ink-500",
        brand: "bg-brand-50 text-brand-700",
        success: "bg-green-500/10 text-green-600",
        danger: "bg-danger/10 text-danger",
        accent: "bg-accent-500/10 text-accent-600",
        discount: "bg-accent-500 text-white font-bold tabular",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
