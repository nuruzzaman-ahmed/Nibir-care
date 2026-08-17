import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full text-xs font-medium px-2.5 py-0.5 transition-colors",
  {
    variants: {
      variant: {
        default: "bg-teal-50 text-teal-700 border border-teal-200",
        secondary: "bg-gray-100 text-gray-700",
        destructive: "bg-red-50 text-red-700 border border-red-200",
        success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border border-amber-200",
        info: "bg-blue-50 text-blue-700 border border-blue-200",
        verified: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        pending: "bg-amber-50 text-amber-700 border border-amber-200",
        current: "bg-teal-500 text-white",
        outline: "border border-current bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
