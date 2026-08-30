import { Badge } from "@/components/ui";
import type { LifePillar } from "@/lib/validation/domain";
import { cn } from "@/lib/utils";
import { PILLAR_LABEL } from "./PillarSelect";

const PILLAR_DOT: Record<LifePillar, string> = {
  spiritual: "bg-pillar-spiritual",
  personal: "bg-pillar-personal",
  societal: "bg-pillar-societal",
};

export function PillarBadges({
  pillars,
  className,
}: {
  pillars: LifePillar[];
  className?: string;
}) {
  if (pillars.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {pillars.map((pillar) => (
        <Badge key={pillar} variant="outline" className="gap-1.5">
          <span className={cn("size-1.5 rounded-full", PILLAR_DOT[pillar])} aria-hidden="true" />
          {PILLAR_LABEL[pillar]}
        </Badge>
      ))}
    </div>
  );
}
