import { ModuleCard } from "@/components/mastery";
import { DASHBOARD_MODULES } from "../dashboard-modules";
import { MasteryCenter } from "./MasteryCenter";

/** xl: PLAN/GOALS/FOCUS in the left column, ACT/GROW/ANALYTICS in the right,
 * the central anchor spanning the middle. Below xl the anchor becomes a
 * full-width banner and the six modules flow 2-up (sm) or single-column. */
const PLACEMENT: Record<string, string> = {
  plan: "xl:col-start-1 xl:row-start-1",
  goals: "xl:col-start-1 xl:row-start-2",
  focus: "xl:col-start-1 xl:row-start-3",
  act: "xl:col-start-3 xl:row-start-1",
  grow: "xl:col-start-3 xl:row-start-2",
  analytics: "xl:col-start-3 xl:row-start-3",
};

export function ModuleGrid({ displayName }: { displayName: string }) {
  return (
    <section aria-labelledby="modules-heading">
      <h2 id="modules-heading" className="text-eyebrow mb-3">
        Modules
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_minmax(15rem,19rem)_1fr] xl:grid-rows-3">
        <div className="order-first sm:col-span-2 xl:order-none xl:col-start-2 xl:row-span-3">
          <MasteryCenter displayName={displayName} />
        </div>

        {DASHBOARD_MODULES.map((module) => (
          <ModuleCard
            key={module.id}
            title={module.name}
            description={module.purpose}
            href={module.href}
            icon={module.icon}
            accent={module.tier === "secondary" ? "gold" : "neutral"}
            className={PLACEMENT[module.id]}
          />
        ))}
      </div>
    </section>
  );
}
