import type { LearningItem, StudySession } from "./schema";

export interface LearningStats {
  totalItems: number;
  inProgress: number;
  completed: number;
  totalStudyMinutes: number;
  studyMinutesLast7Days: number;
}

function daysAgo(dateIso: string, todayIso: string): number {
  return (Date.parse(`${todayIso}T00:00:00Z`) - Date.parse(`${dateIso}T00:00:00Z`)) / 86_400_000;
}

/** Roll learning items + study sessions into headline stats. Pure. */
export function summarizeLearning(
  items: LearningItem[],
  sessions: StudySession[],
  today: string = new Date().toISOString().slice(0, 10),
): LearningStats {
  let inProgress = 0;
  let completed = 0;
  for (const item of items) {
    if (item.learningStatus === "in-progress") inProgress += 1;
    if (item.learningStatus === "completed") completed += 1;
  }

  let totalStudyMinutes = 0;
  let studyMinutesLast7Days = 0;
  for (const session of sessions) {
    totalStudyMinutes += session.minutes;
    const age = daysAgo(session.date, today);
    if (age >= 0 && age < 7) studyMinutesLast7Days += session.minutes;
  }

  return {
    totalItems: items.length,
    inProgress,
    completed,
    totalStudyMinutes,
    studyMinutesLast7Days,
  };
}

/** Sum of study-session minutes logged against one learning item. Pure. */
export function studyMinutesForItem(sessions: StudySession[], learningItemId: string): number {
  return sessions
    .filter((session) => session.learningItemId === learningItemId)
    .reduce((total, session) => total + session.minutes, 0);
}
