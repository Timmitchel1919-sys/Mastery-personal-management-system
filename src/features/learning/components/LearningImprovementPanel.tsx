import { Card, CardContent } from "@/components/ui";
import { buildLearningInsights, detectLearningPatterns, type LearningEvent } from "../learning-engine";

export function LearningImprovementPanel({ events = [] }: { events?: LearningEvent[] }) {
  const patterns = detectLearningPatterns(events);
  const insights = buildLearningInsights(patterns);

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-eyebrow">Learning & improvement</p>
            <h2 className="text-lg font-semibold text-foreground">Outcome feedback</h2>
          </div>
        </div>

        {patterns.length === 0 ? (
          <p className="text-sm text-muted">
            No outcome history yet. Log study sessions, mark lessons complete, and record actual
            outcomes to generate learning patterns and adaptive planning guidance.
          </p>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => (
              <div key={insight.insight} className="rounded-lg border border-border/80 bg-muted/30 p-3">
                <p className="text-sm font-medium text-foreground">{insight.insight}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
                  {insight.evidence.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] uppercase tracking-[0.08em] text-subtle">
                  {insight.confidence} confidence · {insight.timeframe}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
