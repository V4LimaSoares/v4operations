import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-surface-2 text-foreground",
        primary: "bg-primary-soft text-primary",
        positive: "bg-positive-soft text-positive",
        negative: "bg-negative-soft text-negative",
        warning: "bg-warning-soft text-warning",
        info: "bg-info-soft text-info",
        outline: "border border-border text-muted",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
