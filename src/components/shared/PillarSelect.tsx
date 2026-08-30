"use client";

import { Checkbox } from "@/components/ui";
import { LIFE_PILLARS, type LifePillar } from "@/lib/validation/domain";
import { cn } from "@/lib/utils";

const PILLAR_LABEL: Record<LifePillar, string> = {
  spiritual: "Spiritual",
  personal: "Personal",
  societal: "Societal",
};

export interface PillarSelectProps {
  value: LifePillar[];
  onChange: (next: LifePillar[]) => void;
  id?: string;
  "aria-describedby"?: string;
  disabled?: boolean;
  className?: string;
}

/** Multi-select for the three life pillars. At least one is expected by the schema. */
export function PillarSelect({
  value,
  onChange,
  id,
  disabled,
  className,
  "aria-describedby": describedBy,
}: PillarSelectProps) {
  function toggle(pillar: LifePillar, checked: boolean) {
    const set = new Set(value);
    if (checked) set.add(pillar);
    else set.delete(pillar);
    // Preserve the canonical pillar order.
    onChange(LIFE_PILLARS.filter((entry) => set.has(entry)));
  }

  return (
    <div
      id={id}
      role="group"
      aria-describedby={describedBy}
      className={cn("flex flex-wrap gap-x-4 gap-y-2", className)}
    >
      {LIFE_PILLARS.map((pillar) => (
        <label key={pillar} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={value.includes(pillar)}
            disabled={disabled}
            onCheckedChange={(checked) => toggle(pillar, checked === true)}
          />
          {PILLAR_LABEL[pillar]}
        </label>
      ))}
    </div>
  );
}

export { PILLAR_LABEL };
