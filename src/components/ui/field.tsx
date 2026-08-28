"use client";

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

type ControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
};

export interface FormFieldProps {
  label: ReactNode;
  /** Override the generated id (e.g. when the control sets its own). */
  htmlFor?: string;
  description?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  className?: string;
  /** A single form control. It automatically receives `id` and `aria-*` wiring. */
  children: ReactElement<ControlProps>;
}

/**
 * Accessible label + control + description + error wrapper. The control is cloned to
 * receive `id`, `aria-describedby`, and `aria-invalid` so screen readers announce the
 * hint and error text.
 */
export function FormField({
  label,
  htmlFor,
  description,
  error,
  optional,
  className,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = cn(descriptionId, errorId) || undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })
    : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      {control}
      {description ? (
        <p id={descriptionId} className="text-subtle text-xs">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-danger text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
