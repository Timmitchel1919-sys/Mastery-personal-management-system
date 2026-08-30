import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface PlaceholderWidgetProps {
  title: string;
  icon?: ReactNode;
  /** Empty-state message shown until the owning layer ships. */
  message: string;
  href: string;
  linkLabel: string;
  plannedLayer?: number;
  className?: string;
}

/** A dashboard widget whose data source arrives in a later layer. */
export function PlaceholderWidget({
  title,
  icon,
  message,
  href,
  linkLabel,
  plannedLayer,
  className,
}: PlaceholderWidgetProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          {icon ? <span className="text-muted">{icon}</span> : null}
          {title}
        </CardTitle>
        {plannedLayer ? <span className="text-subtle text-xs">Layer {plannedLayer}</span> : null}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-3 pt-0">
        <p className="text-muted text-sm">{message}</p>
        <Link
          href={href}
          className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          {linkLabel}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}
