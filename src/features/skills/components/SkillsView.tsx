"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button, Skeleton } from "@/components/ui";
import { useGoalOptions } from "@/features/goals";
import { useSkills } from "../use-skills";
import {
  currentProficiency,
  skillInputFromForm,
  skillReviewInputFromForm,
  type Skill,
} from "../schema";
import { LogReviewDialog } from "./LogReviewDialog";
import { SkillCard } from "./SkillCard";
import { SkillDialog } from "./SkillDialog";
import { SkillsStats } from "./SkillsStats";

export function SkillsView() {
  const {
    status,
    items,
    reviewsBySkill,
    stats,
    error,
    reload,
    create,
    update,
    archive,
    logReview,
  } = useSkills();
  const { options: goalOptions } = useGoalOptions();

  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [reviewing, setReviewing] = useState<Skill | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const goalTitleById = useMemo(
    () => new Map(goalOptions.map((option) => [option.id, option.title])),
    [goalOptions],
  );

  function openCreate() {
    setEditing(null);
    setSkillDialogOpen(true);
  }
  function openEdit(skill: Skill) {
    setEditing(skill);
    setSkillDialogOpen(true);
  }
  function openLogReview(skill: Skill) {
    setReviewing(skill);
    setReviewDialogOpen(true);
  }

  const reviewingCurrent = reviewing
    ? currentProficiency(reviewing, reviewsBySkill.get(reviewing.id) ?? [])
    : 0;

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Skills"
        description="Skill inventory, proficiency targets, practice plans, and progress history."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button onClick={openCreate} disabled={status === "loading"}>
            <Plus />
            New skill
          </Button>
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
          title="We couldn't load your skills"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : (
        <>
          <SkillsStats stats={stats} />

          {items.length === 0 ? (
            <EmptyState
              title="No skills yet"
              description="Add a skill you're building, with a starting point and a target."
              action={
                <Button onClick={openCreate}>
                  <Plus />
                  Add your first skill
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  reviews={reviewsBySkill.get(skill.id) ?? []}
                  goalTitleById={goalTitleById}
                  today={today}
                  onEdit={openEdit}
                  onArchive={archive}
                  onLogReview={openLogReview}
                />
              ))}
            </div>
          )}
        </>
      )}

      <SkillDialog
        open={skillDialogOpen}
        onOpenChange={setSkillDialogOpen}
        skill={editing}
        goalOptions={goalOptions}
        onSubmit={async (values) => {
          const input = skillInputFromForm(values);
          if (editing) await update(editing.id, input);
          else await create(input);
        }}
      />

      <LogReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        skill={reviewing}
        currentProficiency={reviewingCurrent}
        onSubmit={async (values) => {
          if (!reviewing) return;
          await logReview(skillReviewInputFromForm(reviewing.id, values));
        }}
      />
    </PageContainer>
  );
}
