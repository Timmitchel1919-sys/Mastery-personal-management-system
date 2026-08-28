import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "border-border bg-background placeholder:text-subtle flex w-full rounded-md border px-3 py-2 text-sm",
        "outline-none focus-visible:border-ring focus-visible:ring-ring focus-visible:ring-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger aria-invalid:focus-visible:ring-danger",
        "resize-y",
        className,
      )}
      {...props}
    />
  );
});
