"use client";

import { useMemo, useState } from "react";
import { Clock, Plus } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button, Card, CardContent, Skeleton } from "@/components/ui";
import { useGoalOptions } from "@/features/goals";
import { useLearning } from "../use-learning";
import { learningItemInputFromForm, studySessionInputFromForm, type LearningItem } from "../schema";
import { LearningItemCard } from "./LearningItemCard";
import { LearningItemDialog } from "./LearningItemDialog";
import { LearningStats } from "./LearningStats";
import { LogSessionDialog } from "./LogSessionDialog";
import { RecentSessionsList } from "./RecentSessionsList";

export function LearningView() {
  const {
    status,
    items,
    sessions,
    studyMinutesByItem,
    stats,
    error,
    reload,
    create,
    update,
    archive,
    toggleLesson,
    logSession,
    removeSession,
  } = useLearning();
  const { options: goalOptions } = useGoalOptions();

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LearningItem | null>(null);

  const goalTitleById = useMemo(
    () => new Map(goalOptions.map((option) => [option.id, option.title])),
    [goalOptions],
  );
  const itemTitleById = useMemo(() => new Map(items.map((item) => [item.id, item.title])), [items]);

  function openCreate() {
    setEditing(null);
    setItemDialogOpen(true);
  }
  function openEdit(item: LearningItem) {
    setEditing(item);
    setItemDialogOpen(true);
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Learning"
        description="Courses, study plans, and skill practice — with lessons, resources, and study sessions."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSessionDialogOpen(true)}
              disabled={status === "loading"}
            >
              <Clock />
              Log session
            </Button>
            <Button onClick={openCreate} disabled={status === "loading"}>
              <Plus />
              New item
            </Button>
          </div>
        }
      />

      {status === "loading" ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-52" />
            ))}
          </div>
        </div>
      ) : status === "error" ? (
        <ErrorState
          className="min-h-[40vh]"
          title="We couldn't load your learning items"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : (
        <>
          <LearningStats stats={stats} />

          {items.length === 0 ? (
            <EmptyState
              title="No learning items yet"
              description="Add a course, study plan, or skill you're building."
              action={
                <Button onClick={openCreate}>
                  <Plus />
                  Add your first item
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <LearningItemCard
                  key={item.id}
                  item={item}
                  studyMinutes={studyMinutesByItem.get(item.id) ?? 0}
                  goalTitleById={goalTitleById}
                  onEdit={openEdit}
                  onArchive={archive}
                  onToggleLesson={toggleLesson}
                />
              ))}
            </div>
          )}

          {sessions.length > 0 ? (
            <section className="space-y-3">
              <h2 className="font-semibold">Recent study sessions</h2>
              <Card>
                <CardContent className="p-4">
                  <RecentSessionsList
                    sessions={sessions}
                    itemTitleById={itemTitleById}
                    onRemove={removeSession}
                  />
                </CardContent>
              </Card>
            </section>
          ) : null}
        </>
      )}

      <LearningItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        item={editing}
        goalOptions={goalOptions}
        onSubmit={async (values) => {
          const input = learningItemInputFromForm(values);
          if (editing) await update(editing.id, input);
          else await create(input);
        }}
      />

      <LogSessionDialog
        open={sessionDialogOpen}
        onOpenChange={setSessionDialogOpen}
        items={items}
        onSubmit={async (values) => {
          await logSession(studySessionInputFromForm(values));
        }}
      />
    </PageContainer>
  );
}
