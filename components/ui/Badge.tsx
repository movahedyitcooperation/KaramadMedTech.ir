import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-2 px-2.5 py-1 text-xs font-medium", {
  variants: {
    variant: {
      neutral: "bg-ink/72 text-surface",
      warn: "bg-warn-bg text-warn-strong border border-warn-border",
      danger: "bg-danger text-surface",
      info: "bg-info-bg text-info border border-info-border",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
