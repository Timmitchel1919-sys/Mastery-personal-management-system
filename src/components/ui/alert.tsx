import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const alertVariants = cva(
  "relative flex w-full gap-3 rounded-lg border p-4 text-sm [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:translate-y-0.5",
  {
    variants: {
      variant: {
        info: "border-info/30 bg-info-subtle/50 text-foreground [&>svg]:text-info",
        success: "border-success/30 bg-success-subtle/50 text-foreground [&>svg]:text-success",
        warning: "border-warning/30 bg-warning-subtle/50 text-foreground [&>svg]:text-warning",
        danger: "border-danger/30 bg-danger-subtle/50 text-foreground [&>svg]:text-danger",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export function AlertTitle({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("font-medium", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-muted mt-0.5", className)} {...props} />;
}
