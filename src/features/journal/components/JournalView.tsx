"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/components/ui";
import { useGoalOptions } from "@/features/goals";
import { useJournal } from "../use-journal";
import {
  JOURNAL_ENTRY_TYPES,
  JOURNAL_ENTRY_TYPE_LABEL,
  journalEntryInputFromForm,
  type JournalEntry,
} from "../schema";
import { JournalEntryCard } from "./JournalEntryCard";
import { JournalEntryDialog } from "./JournalEntryDialog";
import { JournalStats } from "./JournalStats";

const ALL_TYPES = "all" as const;

export function JournalView() {
  const {
    status,
    items,
    filteredItems,
    filter,
    setFilter,
    stats,
    error,
    reload,
    create,
    update,
    archive,
  } = useJournal();
  const { options: goalOptions } = useGoalOptions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);

  const goalTitleById = useMemo(
    () => new Map(goalOptions.map((option) => [option.id, option.title])),
    [goalOptions],
  );

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(entry: JournalEntry) {
    setEditing(entry);
    setDialogOpen(true);
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Journal"
        description="Free-form writing, guided reflection, gratitude, lessons learned, and decisions."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button onClick={openCreate} disabled={status === "loading"}>
            <Plus />
            New entry
          </Button>
        }
      />

      {status === "loading" ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <div className="space-y-3">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-40" />
            ))}
          </div>
        </div>
      ) : status === "error" ? (
        <ErrorState
          className="min-h-[40vh]"
          title="We couldn't load your journal"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : (
        <>
          <JournalStats stats={stats} />

          {items.length === 0 ? (
            <EmptyState
              title="No journal entries yet"
              description="Write your first entry — free-form, a reflection, or a gratitude list."
              action={
                <Button onClick={openCreate}>
                  <Plus />
                  Write your first entry
                </Button>
              }
            />
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search
                    className="text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <Input
                    className="pl-9"
                    placeholder="Search entries…"
                    aria-label="Search journal entries"
                    value={filter.query}
                    onChange={(event) => setFilter({ ...filter, query: event.target.value })}
                  />
                </div>
                <Select
                  value={filter.entryType}
                  onValueChange={(next) =>
                    setFilter({ ...filter, entryType: next as typeof filter.entryType })
                  }
                >
                  <SelectTrigger aria-label="Filter by type" className="sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_TYPES}>All types</SelectItem>
                    {JOURNAL_ENTRY_TYPES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {JOURNAL_ENTRY_TYPE_LABEL[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredItems.length === 0 ? (
                <EmptyState
                  title="No entries match"
                  description="Try a different search or type."
                />
              ) : (
                <div className="space-y-3">
                  {filteredItems.map((entry) => (
                    <JournalEntryCard
                      key={entry.id}
                      entry={entry}
                      goalTitleById={goalTitleById}
                      onEdit={openEdit}
                      onArchive={archive}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      <JournalEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={editing}
        goalOptions={goalOptions}
        onSubmit={async (values) => {
          const input = journalEntryInputFromForm(values);
          if (editing) await update(editing.id, input);
          else await create(input);
        }}
      />
    </PageContainer>
  );
}
