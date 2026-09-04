"use client";

import { useState } from "react";
import { Clock, Link2, Pencil, Sparkles, Trash2 } from "lucide-react";
import { PillarBadges } from "@/components/shared";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
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
import { cn } from "@/lib/utils";
import {
  LEARNING_ITEM_TYPE_LABEL,
  LEARNING_STATUS_LABEL,
  lessonProgress,
  type LearningItem,
  type LearningStatus,
} from "../schema";

const STATUS_VARIANT: Record<LearningStatus, "neutral" | "primary" | "success" | "warning"> = {
  "not-started": "neutral",
  "in-progress": "primary",
  completed: "success",
  paused: "warning",
};

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

interface LearningItemCardProps {
  item: LearningItem;
  studyMinutes: number;
  goalTitleById: Map<string, string>;
  skillTitleById: Map<string, string>;
  onEdit: (item: LearningItem) => void;
  onArchive: (id: string) => Promise<void>;
  onToggleLesson: (item: LearningItem, lessonId: string) => Promise<unknown>;
}

export function LearningItemCard({
  item,
  studyMinutes,
  goalTitleById,
  skillTitleById,
  onEdit,
  onArchive,
  onToggleLesson,
}: LearningItemCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const progress = lessonProgress(item);
  const percent = progress.total === 0 ? 0 : (progress.completed / progress.total) * 100;
  const link = item.goalId ? goalTitleById.get(item.goalId) : undefined;
  const skillLink = item.skillId ? skillTitleById.get(item.skillId) : undefined;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline">{LEARNING_ITEM_TYPE_LABEL[item.itemType]}</Badge>
              <Badge variant={STATUS_VARIANT[item.learningStatus]}>
                {LEARNING_STATUS_LABEL[item.learningStatus]}
              </Badge>
              {progress.total > 0 ? (
                <Badge variant="neutral">
                  {progress.completed}/{progress.total} lessons
                </Badge>
              ) : null}
            </div>
            <h3 className="mt-1 font-medium break-words">{item.title}</h3>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <IconButton
              size="sm"
              aria-label="Edit item"
              icon={<Pencil />}
              onClick={() => onEdit(item)}
            />
            <IconButton
              size="sm"
              aria-label="Archive item"
              icon={<Trash2 />}
              onClick={() => setConfirmOpen(true)}
            />
          </div>
        </div>

        {item.description ? (
          <p className="text-muted text-sm break-words whitespace-pre-wrap">{item.description}</p>
        ) : null}

        {progress.total > 0 ? <Progress value={percent} /> : null}

        <div className="text-subtle flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {item.provider ? <span>{item.provider}</span> : null}
          {item.targetCompletionDate ? <span>target {item.targetCompletionDate}</span> : null}
          {studyMinutes > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden="true" />
              {studyMinutes} min studied
            </span>
          ) : null}
          {link ? (
            <span className="inline-flex items-center gap-1">
              <Link2 className="size-3.5" aria-hidden="true" />
              {link}
            </span>
          ) : null}
          {skillLink ? (
            <span className="inline-flex items-center gap-1">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {skillLink}
            </span>
          ) : null}
        </div>

        {item.lessons.length > 0 ? (
          <ul className="space-y-1">
            {item.lessons.map((lesson) => (
              <li key={lesson.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={lesson.completed}
                  aria-label={`${lesson.title}${lesson.completed ? " (done)" : ""}`}
                  onCheckedChange={() => onToggleLesson(item, lesson.id)}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 break-words",
                    lesson.completed && "text-subtle line-through",
                  )}
                >
                  {lesson.title}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {item.resources.length > 0 ? (
          <ul className="space-y-0.5 text-xs">
            {item.resources.map((resource, index) =>
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

        {item.assessmentNotes ? (
          <p className="text-subtle text-xs break-words whitespace-pre-wrap">
            {item.assessmentNotes}
          </p>
        ) : null}

        {item.pillarIds.length > 0 ? <PillarBadges pillars={item.pillarIds} /> : null}
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this item?</DialogTitle>
            <DialogDescription>
              It is removed from your learning list. This does not delete logged study sessions.
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
                  await onArchive(item.id);
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
