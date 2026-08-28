import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Primary call to action, e.g. a "Create" button or link. */
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-2 p-8 text-center", className)}
    >
      {icon ? (
        <div aria-hidden="true" className="text-muted mb-1">
          {icon}
        </div>
      ) : null}
      <h2 className="text-base font-medium">{title}</h2>
      {description ? <p className="text-muted max-w-sm text-sm">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
