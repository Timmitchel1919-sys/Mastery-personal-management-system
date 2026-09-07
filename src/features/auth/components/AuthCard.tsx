import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Optional brand mark shown centered above the title. */
  logo?: ReactNode;
  /** "glass" gives the card a frosted, translucent look for a decorated backdrop. */
  variant?: "default" | "glass";
}

export function AuthCard({
  title,
  description,
  children,
  footer,
  logo,
  variant = "default",
}: AuthCardProps) {
  return (
    <Card
      className={cn(
        "w-full max-w-sm",
        variant === "glass" && "mastery-glass-card rounded-3xl border-0",
      )}
    >
      {logo ? <div className="flex justify-center pt-8">{logo}</div> : null}
      <CardHeader className={cn("px-7 pt-6", logo && "text-center")}>
        <CardTitle className="text-xl">{title}</CardTitle>
        {description ? <CardDescription className="text-sm">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-7 pb-2">{children}</CardContent>
      {footer ? (
        <div className="border-border/60 text-muted border-t px-7 py-5 text-center text-sm">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}
