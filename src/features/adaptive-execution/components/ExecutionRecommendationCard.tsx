"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import type { ExecutionRecommendation } from "../execution-recommendation";
import type { ExecutionDraft } from "../use-execution-recommendations";

interface ExecutionRecommendationCardProps {
  recommendation: ExecutionRecommendation;
  onApprove: (draft: ExecutionDraft) => Promise<void> | void;
  onDismiss: () => void;
}

const RISK_LABEL: Record<ExecutionRecommendation["riskLevel"], string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

export function ExecutionRecommendationCard({ recommendation, onApprove, onDismiss }: ExecutionRecommendationCardProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(recommendation.title);
  const [description, setDescription] = useState(recommendation.description);
  const [suggestedAction, setSuggestedAction] = useState(recommendation.suggestedAction);
  const [priority, setPriority] = useState<ExecutionDraft["priority"]>("high");

  const actionSummary = useMemo(() => {
    if (recommendation.relatedEntity?.type === "task") return "Task adjustment";
    if (recommendation.relatedEntity?.type === "goal") return "Goal update";
    return "Plan review";
  }, [recommendation.relatedEntity?.type]);

  const handleApprove = async () => {
    await onApprove({
      title,
      description,
      suggestedAction,
      priority,
    });
    setOpen(false);
  };

  return (
    <>
      <Card className="border-border/80 bg-background/60">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="text-accent size-4" aria-hidden="true" />
                <span className="text-foreground text-sm font-semibold tracking-tight">
                  {recommendation.title}
                </span>
              </div>
              <p className="text-muted text-xs">{recommendation.sourceInsight}</p>
            </div>
            <Badge variant={recommendation.riskLevel === "high" ? "warning" : "outline"}>
              {RISK_LABEL[recommendation.riskLevel]}
            </Badge>
          </div>

          <p className="text-muted text-sm leading-relaxed">{recommendation.description}</p>

          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3 text-sm">
            <p className="text-foreground font-medium">Why this matters</p>
            <p className="text-muted mt-1">{recommendation.reason}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{recommendation.type}</Badge>
            <Badge variant="outline">{actionSummary}</Badge>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" size="sm" onClick={() => setOpen(true)}>
              Review
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={onDismiss}>
              Dismiss
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{recommendation.title}</DialogTitle>
            <DialogDescription>
              This recommendation is a proposal until you approve it. Review the suggested action and edit it before execution.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="execution-title">Title</Label>
              <Input id="execution-title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="execution-description">Description</Label>
              <Textarea
                id="execution-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="execution-action">Suggested action</Label>
              <Textarea
                id="execution-action"
                value={suggestedAction}
                onChange={(event) => setSuggestedAction(event.target.value)}
                rows={3}
              />
            </div>

            {recommendation.relatedEntity?.type === "task" ? (
              <div className="space-y-2">
                <Label htmlFor="execution-priority">Priority</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as ExecutionDraft["priority"]) }>
                  <SelectTrigger id="execution-priority">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="rounded-lg border border-warning/60 bg-warning-subtle p-3 text-sm text-warning">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
                <p>{recommendation.riskLevel === "high" ? "This recommendation affects active execution and should be reviewed carefully." : "This is a small, controlled adjustment that still needs approval."}</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Edit later
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onDismiss}>
                Dismiss
              </Button>
              <Button type="button" onClick={() => void handleApprove()}>
                <CheckCircle2 className="mr-2 size-4" aria-hidden="true" />
                Approve
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
