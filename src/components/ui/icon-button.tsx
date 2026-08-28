"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./button";

export interface IconButtonProps extends Omit<ButtonProps, "size" | "children"> {
  /** Required — icon-only buttons must have an accessible name. */
  "aria-label": string;
  icon: React.ReactNode;
  size?: "sm" | "md";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, className, variant = "ghost", size = "md", ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      variant={variant}
      size="icon"
      className={cn(size === "sm" && "size-8", className)}
      {...props}
    >
      {icon}
    </Button>
  );
});
