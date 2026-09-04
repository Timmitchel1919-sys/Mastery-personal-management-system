"use client";

import { useState } from "react";
import { Bell, Check, Flame, Link2, Pencil, Trash2, X } from "lucide-react";
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
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { DayState } from "../habit-streak";
import { HABIT_STATUS_LABEL, type Habit, type HabitLogStatus } from "../schema";

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function scheduleSummary(habit: Habit): string {
  if (habit.frequency === "daily") {
    return habit.interval <= 1 ? "Daily" : `Every ${habit.interval} days`;
  }
  if (habit.frequency === "weekly") {
    return habit.weekdays.length === 0
      ? "Weekly (any day)"
      : `Weekly (${habit.weekdays.map((day) => WEEKDAY_SHORT[day]).join(", ")})`;
  }
  const days = habit.daysOfMonth.length > 0 ? habit.daysOfMonth : [1];
  return `Monthly (day ${days.join(", ")})`;
}

const DAY_DOT: Record<DayState, string> = {
  completed: "bg-success",
  missed: "bg-danger",
  "not-expected": "bg-border-strong",
};

interface HabitCardProps {
  habit: Habit;
  today: string;
  streak: { currentStreak: number; longestStreak: number };
  recentDays: { date: string; state: DayState }[];
  goalTitleById: Map<string, string>;
  todayLogStatus: HabitLogStatus | null;
  onEdit: (habit: Habit) => void;
  onArchive: (id: string) => Promise<void>;
  onSetToday: (habitId: string, status: HabitLogStatus) => Promise<unknown>;
}

export function HabitCard({
  habit,
  streak,
  recentDays,
  goalTitleById,
  todayLogStatus,
  onEdit,
  onArchive,
  onSetToday,
}: HabitCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const link = habit.goalId ? goalTitleById.get(habit.goalId) : undefined;
  const paused = habit.habitStatus === "paused";

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={paused ? "neutral" : "primary"}>
                {HABIT_STATUS_LABEL[habit.habitStatus]}
              </Badge>
              <Badge variant="outline">{scheduleSummary(habit)}</Badge>
              {streak.currentStreak > 0 ? (
                <Badge variant="success" className="gap-1">
                  <Flame className="size-3.5" aria-hidden="true" />
                  {streak.currentStreak} streak
                </Badge>
              ) : null}
            </div>
            <h3 className="mt-1 font-medium break-words">{habit.title}</h3>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <IconButton
              size="sm"
              aria-label="Edit habit"
              icon={<Pencil />}
              onClick={() => onEdit(habit)}
            />
            <IconButton
              size="sm"
              aria-label="Archive habit"
              icon={<Trash2 />}
              onClick={() => setConfirmOpen(true)}
            />
          </div>
        </div>

        {habit.description ? (
          <p className="text-muted text-sm break-words whitespace-pre-wrap">{habit.description}</p>
        ) : null}

        <div className="flex items-center gap-1" aria-hidden="true">
          {recentDays.map((day) => (
            <span
              key={day.date}
              title={`${day.date}: ${day.state}`}
              className={cn("size-2.5 rounded-full", DAY_DOT[day.state])}
            />
          ))}
        </div>

        <div className="text-subtle flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span>
            best streak {streak.longestStreak}
            {habit.target > 0 && habit.unit ? ` · target ${habit.target} ${habit.unit}` : null}
          </span>
          {habit.reminderTime ? (
            <span className="inline-flex items-center gap-1">
              <Bell className="size-3.5" aria-hidden="true" />
              {habit.reminderTime}
            </span>
          ) : null}
          {link ? (
            <span className="inline-flex items-center gap-1">
              <Link2 className="size-3.5" aria-hidden="true" />
              {link}
            </span>
          ) : null}
        </div>

        {habit.pillarIds.length > 0 ? <PillarBadges pillars={habit.pillarIds} /> : null}

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant={todayLogStatus === "completed" ? "primary" : "outline"}
            onClick={() => onSetToday(habit.id, "completed")}
          >
            <Check />
            Done today
          </Button>
          <Button
            size="sm"
            variant={todayLogStatus === "missed" ? "danger" : "outline"}
            onClick={() => onSetToday(habit.id, "missed")}
          >
            <X />
            Missed
          </Button>
        </div>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this habit?</DialogTitle>
            <DialogDescription>
              It is removed from your habit list. This does not delete its logs.
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
                  await onArchive(habit.id);
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
