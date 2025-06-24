import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        warning:
          "border-transparent bg-yellow-500 text-primary-foreground hover:bg-yellow-400",
        pending:
          "border-transparent text-amber-500 bg-gray-100 hover:bg-gray-200",
        approved:
          "border-transparent text-emerald-600 bg-gray-100 hover:bg-gray-200",
        supplied: "border-transparent text-sky-600 bg-gray-100 hover:bg-gray-200",
        received: "border-transparent text-sky-600 bg-gray-100 hover:bg-gray-200",
        rejected: "border-transparent text-red-600 bg-rose-100 hover:bg-rose-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  status?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "warning"
    | "pending"
    | "approved"
    | "supplied"
    | "rejected";
}

function Badge({ className, variant, status, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant: status ?? variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
