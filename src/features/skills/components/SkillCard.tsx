"use client";

import { useState } from "react";
import { Link2, Pencil, Trash2 } from "lucide-react";
import { PillarBadges } from "@/components/shared";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IconButton,
  Progress,
} from "@/components/ui";
import {
  SKILL_CATEGORY_LABEL,
  currentProficiency,
  progressToTarget,
  type Skill,
  type SkillReview,
} from "../schema";

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

interface SkillCardProps {
  skill: Skill;
  reviews: SkillReview[];
  goalTitleById: Map<string, string>;
  today: string;
  onEdit: (skill: Skill) => void;
  onArchive: (id: string) => Promise<void>;
  onLogReview: (skill: Skill) => void;
}

export function SkillCard({
  skill,
  reviews,
  goalTitleById,
  today,
  onEdit,
  onArchive,
  onLogReview,
}: SkillCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const current = currentProficiency(skill, reviews);
  const percent = progressToTarget(skill, reviews);
  const link = skill.goalId ? goalTitleById.get(skill.goalId) : undefined;
  const overdue = skill.nextReviewDate !== null && skill.nextReviewDate <= today;
  const recentReviews = [...reviews].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline">{SKILL_CATEGORY_LABEL[skill.category]}</Badge>
              <Badge variant="primary">
                {current} → {skill.targetProficiency}
              </Badge>
              {overdue ? <Badge variant="warning">Review due</Badge> : null}
            </div>
            <h3 className="mt-1 font-medium break-words">{skill.title}</h3>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <IconButton
              size="sm"
              aria-label="Edit skill"
              icon={<Pencil />}
              onClick={() => onEdit(skill)}
            />
            <IconButton
              size="sm"
              aria-label="Archive skill"
              icon={<Trash2 />}
              onClick={() => setConfirmOpen(true)}
            />
          </div>
        </div>

        {skill.description ? (
          <p className="text-muted text-sm break-words whitespace-pre-wrap">{skill.description}</p>
        ) : null}

        <Progress value={percent} />

        <div className="text-subtle flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {skill.nextReviewDate ? (
            <span className={overdue ? "text-warning" : undefined}>
              next review {skill.nextReviewDate}
            </span>
          ) : null}
          {link ? (
            <span className="inline-flex items-center gap-1">
              <Link2 className="size-3.5" aria-hidden="true" />
              {link}
            </span>
          ) : null}
        </div>

        {skill.practicePlan ? (
          <p className="text-muted text-sm break-words whitespace-pre-wrap">{skill.practicePlan}</p>
        ) : null}

        {skill.evidence.length > 0 ? (
          <ul className="list-disc space-y-0.5 pl-5 text-sm">
            {skill.evidence.map((item, index) => (
              <li key={index} className="break-words">
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        {skill.resources.length > 0 ? (
          <ul className="space-y-0.5 text-xs">
            {skill.resources.map((resource, index) =>
              isUrl(resource) ? (
                <li key={index}>
                  <a
                    href={resource}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary break-all hover:underline"
                  >
                    {resource}
                  </a>
                </li>
              ) : (
                <li key={index} className="text-subtle break-words">
                  {resource}
                </li>
              ),
            )}
          </ul>
        ) : null}

        {recentReviews.length > 0 ? (
          <ul className="space-y-0.5 text-xs">
            {recentReviews.map((review) => (
              <li key={review.id} className="text-subtle">
                {review.date} — proficiency {review.proficiency}
                {review.notes ? `: ${review.notes}` : ""}
              </li>
            ))}
          </ul>
        ) : null}

        {skill.pillarIds.length > 0 ? <PillarBadges pillars={skill.pillarIds} /> : null}

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onLogReview(skill)}>
            Log review
          </Button>
        </div>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this skill?</DialogTitle>
            <DialogDescription>
              It is removed from your skills list. This does not delete logged reviews.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="danger"
              loading={archiving}
              onClick={async () => {
                setArchiving(true);
                try {
                  await onArchive(skill.id);
                  setConfirmOpen(false);
                } finally {
                  setArchiving(false);
                }
              }}
            >
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
