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
    <Card className={cn("w-full max-w-sm", variant === "glass" && "mastery-glass-card")}>
      {logo ? <div className="flex justify-center pt-5">{logo}</div> : null}
      <CardHeader className={cn(logo && "text-center")}>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
      {footer ? (
        <div className="border-border text-muted border-t px-5 py-4 text-center text-sm">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}
