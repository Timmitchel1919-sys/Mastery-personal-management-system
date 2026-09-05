"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge, Button, IconButton } from "@/components/ui";
import { ErrorState } from "@/components/shared";
import {
  COPING_CATEGORY_LABEL,
  COPING_SUGGESTIONS,
  type RecoveryCopingAction,
  type RecoveryCopingActionFormValues,
} from "../recovery-coping-schema";
import { useRecoveryCoping } from "../use-recovery-coping";
import { CopingActionDialog } from "./CopingActionDialog";

function CopingCard({
  action,
  onRemove,
}: {
  action: RecoveryCopingAction;
  onRemove: (id: string) => void;
}) {
  return (
    <li className="rounded-md border p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{COPING_CATEGORY_LABEL[action.category]}</Badge>
            <span className="font-medium break-words">{action.title}</span>
          </div>
          {action.howTo ? (
            <p className="text-muted mt-1 break-words whitespace-pre-wrap">{action.howTo}</p>
          ) : null}
        </div>
        <IconButton
          size="sm"
          aria-label={`Remove ${action.title}`}
          icon={<X />}
          onClick={() => onRemove(action.id)}
        />
      </div>
    </li>
  );
}

export function CopingToolkitSection({
  goalId,
  faithBased,
}: {
  goalId: string;
  faithBased: boolean;
}) {
  const { status, items, error, reload, addCopingAction, addSuggestion, removeCopingAction } =
    useRecoveryCoping(goalId);
  const [dialogOpen, setDialogOpen] = useState(false);

  const usedTitles = useMemo(
    () => new Set(items.map((entry) => entry.title.toLowerCase())),
    [items],
  );
  const suggestions = useMemo(
    () =>
      COPING_SUGGESTIONS.filter(
        (suggestion) =>
          (faithBased || suggestion.category !== "faith") &&
          !usedTitles.has(suggestion.title.toLowerCase()),
      ),
    [faithBased, usedTitles],
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">Coping toolkit</h3>
        <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus />
          Add your own
        </Button>
      </div>
      <p className="text-subtle text-sm">
        Things to reach for when an urge shows up. Add what works for you.
      </p>

      {status === "error" ? (
        <ErrorState
          title="We couldn't load your toolkit"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : status === "loading" ? (
        <p className="text-subtle text-sm">Loading…</p>
      ) : (
        <>
          {items.length === 0 ? (
            <p className="text-subtle text-sm">
              Nothing here yet. Add your own, or start from a suggestion below.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((action) => (
                <CopingCard key={action.id} action={action} onRemove={removeCopingAction} />
              ))}
            </ul>
          )}

          {suggestions.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-subtle text-xs">Quick add</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion.title}
                    variant="ghost"
                    size="sm"
                    className="border"
                    onClick={() => addSuggestion(suggestion)}
                  >
                    <Plus />
                    {suggestion.title}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}

      <CopingActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goalId={goalId}
        onSubmit={async (values: RecoveryCopingActionFormValues) => {
          await addCopingAction(values);
        }}
      />
    </section>
  );
}
