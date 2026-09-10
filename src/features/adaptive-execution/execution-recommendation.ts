import type { BrainModuleId } from "@/features/brain-hub";
import type { Goal } from "@/features/goals/schema";
import type { Plan } from "@/features/plans/schema";
import type { Task } from "@/features/tasks/schema";

export type ExecutionRecommendationType =
  | "REVIEW_GOAL"
  | "CREATE_PLAN"
  | "BREAK_DOWN_PLAN"
  | "PRIORITIZE_ACTION"
  | "SCHEDULE_FOCUS"
  | "REVIEW_OVERDUE_ITEM"
  | "REVIEW_PROGRESS"
  | "START_FOCUS_SESSION"
  | "REVIEW_GROWTH_ACTIVITY";

export type ExecutionRecommendationStatus =
  | "PROPOSED"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type ExecutionRiskLevel = "low" | "medium" | "high";

export interface ExecutionRecommendationEntity {
  type: "goal" | "plan" | "task";
  id: string;
  title: string;
}

export interface ExecutionRecommendation {
  id: string;
  type: ExecutionRecommendationType;
  title: string;
  description: string;
  reason: string;
  sourceInsight: string;
  relatedModule: BrainModuleId | "global";
  relatedEntity?: ExecutionRecommendationEntity;
  suggestedAction: string;
  riskLevel: ExecutionRiskLevel;
  requiresApproval: boolean;
  status: ExecutionRecommendationStatus;
  createdAt: string;
}

export interface ExecutionRecommendationInput {
  goals: Goal[];
  plans: Plan[];
  tasks: Task[];
  nowIsoDate?: string;
}

function todayIso(input?: string): string {
  return input ?? new Date().toISOString().slice(0, 10);
}

function getOpenTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.status === "active" && task.taskStatus !== "done" && task.taskStatus !== "cancelled");
}

function makeRecommendation(partial: Omit<ExecutionRecommendation, "createdAt" | "status"> & Partial<Pick<ExecutionRecommendation, "createdAt" | "status">>): ExecutionRecommendation {
  return {
    createdAt: new Date().toISOString(),
    status: "PROPOSED",
    ...partial,
  };
}

export function buildExecutionRecommendations(input: ExecutionRecommendationInput): ExecutionRecommendation[] {
  const today = todayIso(input.nowIsoDate);
  const recommendations: ExecutionRecommendation[] = [];
  const openGoals = input.goals.filter((goal) => goal.status === "active" && goal.goalStatus !== "achieved" && goal.goalStatus !== "dropped");
  const openTasks = getOpenTasks(input.tasks);
  const planIds = new Set(input.plans.filter((plan) => plan.status === "active").map((plan) => plan.id));

  const unsupportedGoals = openGoals.filter((goal) => {
    const isLinkedToPlan = goal.parentPlanId ? planIds.has(goal.parentPlanId) : false;
    const hasTasks = openTasks.some((task) => task.goalId === goal.id);
    return !isLinkedToPlan && !hasTasks;
  });

  if (unsupportedGoals.length > 0) {
    const goal = unsupportedGoals[0]!;
    recommendations.push(
      makeRecommendation({
        id: `exec-goal-${goal.id}`,
        type: "REVIEW_GOAL",
        title: "Review the goal and map it to a next step",
        description: `The goal "${goal.title}" has no active plan link and no open action linked to it yet.`,
        reason: "Goal progress is not yet grounded in a plan or execution task.",
        sourceInsight: "Goal support analysis",
        relatedModule: "goals",
        relatedEntity: { type: "goal", id: goal.id, title: goal.title },
        suggestedAction: "Open the goal, connect it to a plan, and define the next concrete action before continuing.",
        riskLevel: "low",
        requiresApproval: true,
      }),
    );
  }

  const overdueTasks = openTasks.filter((task) => task.dueDate !== null && task.dueDate < today);
  if (overdueTasks.length > 0) {
    const task = overdueTasks.sort((a, b) => (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31"))[0]!;
    recommendations.push(
      makeRecommendation({
        id: `exec-overdue-${task.id}`,
        type: "REVIEW_OVERDUE_ITEM",
        title: "Review the overdue action",
        description: `The task "${task.title}" is due before today.`,
        reason: "The due date is in the past and it may need an updated priority or a re-plan.",
        sourceInsight: "Act backlog review",
        relatedModule: "act",
        relatedEntity: { type: "task", id: task.id, title: task.title },
        suggestedAction: "Set this task into focus, update the priority, or confirm whether the due date needs to change.",
        riskLevel: "medium",
        requiresApproval: true,
      }),
    );
  }

  const blockedTasks = openTasks.filter((task) => task.taskStatus === "blocked");
  if (blockedTasks.length > 0) {
    const task = blockedTasks[0]!;
    recommendations.push(
      makeRecommendation({
        id: `exec-priority-${task.id}`,
        type: "PRIORITIZE_ACTION",
        title: "Prioritize the next unblock step",
        description: `The task "${task.title}" is currently blocked.`,
        reason: "Blocked work is holding momentum and should be resolved or reprioritized before more work is added.",
        sourceInsight: "Execution attention signal",
        relatedModule: "act",
        relatedEntity: { type: "task", id: task.id, title: task.title },
        suggestedAction: "Move the task into a clear next step, raise its priority, or remove the blocker and continue.",
        riskLevel: "high",
        requiresApproval: true,
      }),
    );
  }

  const activeFocus = openTasks.filter((task) => task.taskStatus === "in-progress");
  if (activeFocus.length > 0) {
    const task = activeFocus[0]!;
    recommendations.push(
      makeRecommendation({
        id: `exec-progress-${task.id}`,
        type: "REVIEW_PROGRESS",
        title: "Check the current execution momentum",
        description: `The task "${task.title}" is already in progress.`,
        reason: "A quick review can confirm whether the current effort still matches the goal and priority.",
        sourceInsight: "Progress check",
        relatedModule: "focus",
        relatedEntity: { type: "task", id: task.id, title: task.title },
        suggestedAction: "Review the focus target, confirm the next milestone, and keep the task aligned with the active plan.",
        riskLevel: "low",
        requiresApproval: true,
      }),
    );
  }

  if (recommendations.length === 0) {
    return [];
  }

  return recommendations.slice(0, 3);
}
