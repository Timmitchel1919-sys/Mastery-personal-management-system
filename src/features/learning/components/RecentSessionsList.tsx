"use client";

import { Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui";
import type { StudySession } from "../schema";

interface RecentSessionsListProps {
  sessions: StudySession[];
  itemTitleById: Map<string, string>;
  onRemove: (id: string) => Promise<void>;
  limit?: number;
}

export function RecentSessionsList({
  sessions,
  itemTitleById,
  onRemove,
  limit = 8,
}: RecentSessionsListProps) {
  if (sessions.length === 0) return null;

  return (
    <ul className="divide-border divide-y text-sm">
      {sessions.slice(0, limit).map((session) => (
        <li key={session.id} className="flex items-center justify-between gap-2 py-2">
          <div className="min-w-0">
            <span className="font-medium">{session.minutes} min</span>
            <span className="text-subtle"> — {session.date}</span>
            {session.learningItemId ? (
              <span className="text-subtle">
                {" "}
                · {itemTitleById.get(session.learningItemId) ?? "Deleted item"}
              </span>
            ) : (
              <span className="text-subtle"> · General study</span>
            )}
            {session.notes ? <p className="text-subtle text-xs">{session.notes}</p> : null}
          </div>
          <IconButton
            size="sm"
            aria-label="Remove session"
            icon={<Trash2 />}
            onClick={() => onRemove(session.id)}
          />
        </li>
      ))}
    </ul>
  );
}
