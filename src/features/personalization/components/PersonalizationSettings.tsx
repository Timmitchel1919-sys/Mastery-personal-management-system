"use client";

import Link from "next/link";
import { Button, Card, CardContent, Switch } from "@/components/ui";
import { SUFFICIENCY_LABEL } from "../personal-signals";
import type { PersonalizationSettings as Settings } from "../personalization-store";
import { usePersonalization } from "../use-personalization";

type ToggleDef = { key: keyof Settings; label: string; description: string };

const TOGGLES: ToggleDef[] = [
  {
    key: "personalizedRecommendations",
    label: "Personalized recommendations",
    description: "Let Mastery surface patterns and suggestions based on your recorded activity.",
  },
  {
    key: "adaptiveDashboard",
    label: "Adaptive dashboard",
    description: "Allow the dashboard to order sections by what has been demonstrably useful. It never hides important information.",
  },
  {
    key: "behaviorRecommendations",
    label: "Behavior-based recommendations",
    description: "Allow recommendations to cite an observed pattern (e.g. a KPI trend) as their reason.",
  },
];

const PREDICTION_TOGGLES: ToggleDef[] = [
  {
    key: "predictiveInsights",
    label: "Predictive insights",
    description: "Show forward-looking signals — deadline risk, overloaded days, stalling goals — derived from your data. Predictions are shown as possibilities, never certainties.",
  },
  {
    key: "deadlineWarnings",
    label: "Deadline warnings",
    description: "Flag goals whose recorded progress appears behind pace for their target date.",
  },
  {
    key: "capacityWarnings",
    label: "Capacity warnings",
    description: "Flag days whose planned time blocks exceed a typical focus capacity. Mastery never moves a block for you.",
  },
  {
    key: "goalTrajectory",
    label: "Goal trajectory",
    description: "Compare a goal's pace against its date range to estimate on-track / at-risk.",
  },
];

function ToggleRow({
  toggle,
  checked,
  onChange,
}: {
  toggle: ToggleDef;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 first:pt-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{toggle.label}</p>
        <p className="text-subtle mt-0.5 text-xs">{toggle.description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={toggle.label} />
    </div>
  );
}

/**
 * The user's controls over personalization: three switches, a transparent
 * inspector of what Mastery has derived and from where, and a reset. Turning
 * everything off leaves the app fully functional — only the adaptive extras stop.
 */
export function PersonalizationSettingsCard() {
  const { settings, setSetting, allPatterns, acceptance, resetPersonalization, isRejected } =
    usePersonalization();

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Personalization</h2>
          <p className="text-subtle mt-1 text-sm">
            Mastery adapts to your recorded activity. It never infers anything personal, and it
            never changes your goals, tasks, or schedule on its own.
          </p>
        </div>

        <div className="divide-border divide-y">
          {TOGGLES.map((toggle) => (
            <ToggleRow
              key={toggle.key}
              toggle={toggle}
              checked={settings[toggle.key]}
              onChange={(value) => setSetting(toggle.key, value)}
            />
          ))}
        </div>

        <div className="space-y-1">
          <h3 className="text-eyebrow">Predictions</h3>
          <div className="divide-border divide-y">
            {PREDICTION_TOGGLES.map((toggle) => (
              <ToggleRow
                key={toggle.key}
                toggle={toggle}
                checked={settings[toggle.key]}
                onChange={(value) => setSetting(toggle.key, value)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-eyebrow">What Mastery knows</h3>
          {!settings.personalizedRecommendations ? (
            <p className="text-muted text-sm">
              Personalized recommendations are currently disabled.
            </p>
          ) : allPatterns.length === 0 && acceptance.total === 0 ? (
            <p className="text-muted text-sm">
              No meaningful behavioral patterns detected yet. Mastery needs more recorded activity
              before it can identify a reliable personal pattern.
            </p>
          ) : (
            <ul className="divide-border divide-y text-sm">
              {acceptance.total > 0 ? (
                <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0">
                  <span className="text-foreground font-medium">Recommendation acceptance</span>
                  <span className="text-muted">
                    {acceptance.rate === null ? "—" : `${Math.round(acceptance.rate * 100)}%`}
                    <span className="text-subtle"> · {acceptance.total} reviewed</span>
                  </span>
                </li>
              ) : null}
              {allPatterns.map((pattern) => (
                <li
                  key={pattern.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0"
                >
                  <span className="text-foreground min-w-0 font-medium">
                    {pattern.observed}
                    {isRejected(pattern.id) ? (
                      <span className="text-subtle"> · not used</span>
                    ) : null}
                  </span>
                  <span className="text-subtle shrink-0">
                    Source: {pattern.source} · {SUFFICIENCY_LABEL[pattern.sufficiency]}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-subtle text-xs">
            Notification categories and quiet periods are in{" "}
            <Link className="underline underline-offset-2" href="/notifications">
              notification settings
            </Link>
            .
          </p>
        </div>

        <div className="border-border border-t pt-4">
          <Button variant="outline" size="sm" onClick={resetPersonalization}>
            Reset personalized insights
          </Button>
          <p className="text-subtle mt-2 text-xs">
            Re-enables every switch and clears rejected patterns. It does not delete any tasks,
            goals, KPIs, or other data — only the derived personalization state.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
