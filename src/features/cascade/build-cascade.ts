import {
  PLAN_HORIZONS,
  PLAN_HORIZON_META,
  PLAN_STATUS_LABEL,
  type Plan,
  type PlanHorizon,
} from "@/features/plans";
import { GOAL_STATUS_LABEL, type Goal } from "@/features/goals";
import { PROJECT_STATUS_LABEL, type Project } from "@/features/projects";
import { MILESTONE_STATUS_LABEL, type Milestone } from "@/features/milestones";
import { ROADMAP_STATUS_LABEL, type Roadmap } from "@/features/roadmaps";

/**
 * Layer 8H — the planning cascade. A read-only tree derived from the parent-child id
 * references already stored on plans, goals, projects, milestones, and roadmaps. Nothing
 * here writes; missing links are allowed and simply surface in the "not yet linked" list.
 */

export type CascadeKind = "plan" | "goal" | "project" | "milestone" | "roadmap";

export const CASCADE_KIND_LABEL: Record<CascadeKind, string> = {
  plan: "Plan",
  goal: "Goal",
  project: "Project",
  milestone: "Milestone",
  roadmap: "Roadmap",
};

const KIND_HREF: Record<CascadeKind, string> = {
  plan: "/plan",
  goal: "/plan/goals",
  project: "/plan/projects",
  milestone: "/plan/milestones",
  roadmap: "/plan/roadmaps",
};

const KIND_RANK: Record<CascadeKind, number> = {
  plan: 0,
  goal: 1,
  project: 2,
  milestone: 3,
  roadmap: 4,
};

export interface CascadeNode {
  id: string;
  kind: CascadeKind;
  title: string;
  statusLabel: string;
  href: string;
  planHorizon?: PlanHorizon;
  /** The record names a parent that no longer resolves to an active record. */
  danglingParent?: boolean;
  children: CascadeNode[];
}

export interface UnlinkedGroup {
  kind: CascadeKind;
  label: string;
  nodes: CascadeNode[];
}

export interface CascadeCounts {
  nodes: number;
  linked: number;
  unlinked: number;
  byKind: Record<CascadeKind, number>;
}

export interface Cascade {
  roots: CascadeNode[];
  unlinked: UnlinkedGroup[];
  counts: CascadeCounts;
}

export interface CascadeInput {
  plansByHorizon: Record<PlanHorizon, Plan[]>;
  goals: Goal[];
  projects: Project[];
  milestones: Milestone[];
  roadmaps: Roadmap[];
}

function sortChildren(nodes: CascadeNode[]): void {
  nodes.sort((a, b) => {
    if (a.kind !== b.kind) return KIND_RANK[a.kind] - KIND_RANK[b.kind];
    if (a.kind === "plan" && b.kind === "plan") {
      const byHorizon =
        PLAN_HORIZONS.indexOf(a.planHorizon ?? "week") -
        PLAN_HORIZONS.indexOf(b.planHorizon ?? "week");
      if (byHorizon !== 0) return byHorizon;
    }
    return a.title.localeCompare(b.title);
  });
  for (const node of nodes) sortChildren(node.children);
}

export function buildCascade(input: CascadeInput): Cascade {
  const planNodes = new Map<string, CascadeNode>();
  const goalNodes = new Map<string, CascadeNode>();
  const projectNodes = new Map<string, CascadeNode>();

  const roots: CascadeNode[] = [];
  const unlinkedByKind: Record<CascadeKind, CascadeNode[]> = {
    plan: [],
    goal: [],
    project: [],
    milestone: [],
    roadmap: [],
  };

  // Plans first — they form the spine of the cascade.
  for (const horizon of PLAN_HORIZONS) {
    for (const plan of input.plansByHorizon[horizon]) {
      planNodes.set(plan.id, {
        id: plan.id,
        kind: "plan",
        title: plan.title,
        statusLabel: PLAN_STATUS_LABEL[plan.planStatus],
        href: PLAN_HORIZON_META[horizon].route,
        planHorizon: horizon,
        children: [],
      });
    }
  }
  for (const horizon of PLAN_HORIZONS) {
    for (const plan of input.plansByHorizon[horizon]) {
      const node = planNodes.get(plan.id);
      if (!node) continue;
      const parent = plan.parentId ? planNodes.get(plan.parentId) : undefined;
      if (parent) {
        parent.children.push(node);
      } else {
        if (plan.parentId) node.danglingParent = true;
        roots.push(node);
      }
    }
  }

  // Goals hang off their parent plan.
  for (const goal of input.goals) {
    const node: CascadeNode = {
      id: goal.id,
      kind: "goal",
      title: goal.title,
      statusLabel: GOAL_STATUS_LABEL[goal.goalStatus],
      href: KIND_HREF.goal,
      children: [],
    };
    goalNodes.set(goal.id, node);
    const parent = goal.parentPlanId ? planNodes.get(goal.parentPlanId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else if (goal.parentPlanId) {
      node.danglingParent = true;
      unlinkedByKind.goal.push(node);
    } else {
      unlinkedByKind.goal.push(node);
    }
  }

  // Projects hang off their goal.
  for (const project of input.projects) {
    const node: CascadeNode = {
      id: project.id,
      kind: "project",
      title: project.title,
      statusLabel: PROJECT_STATUS_LABEL[project.projectStatus],
      href: KIND_HREF.project,
      children: [],
    };
    projectNodes.set(project.id, node);
    const parent = project.goalId ? goalNodes.get(project.goalId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      if (project.goalId) node.danglingParent = true;
      unlinkedByKind.project.push(node);
    }
  }

  // Milestones hang off a goal or a project.
  for (const milestone of input.milestones) {
    const node: CascadeNode = {
      id: milestone.id,
      kind: "milestone",
      title: milestone.title,
      statusLabel: MILESTONE_STATUS_LABEL[milestone.milestoneStatus],
      href: KIND_HREF.milestone,
      children: [],
    };
    const parent =
      milestone.parentType === "goal"
        ? milestone.parentId
          ? goalNodes.get(milestone.parentId)
          : undefined
        : milestone.parentType === "project"
          ? milestone.parentId
            ? projectNodes.get(milestone.parentId)
            : undefined
          : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      if (milestone.parentType !== "none") node.danglingParent = true;
      unlinkedByKind.milestone.push(node);
    }
  }

  // Roadmaps hang off a linked goal (preferred) or project.
  for (const roadmap of input.roadmaps) {
    const node: CascadeNode = {
      id: roadmap.id,
      kind: "roadmap",
      title: roadmap.title,
      statusLabel: ROADMAP_STATUS_LABEL[roadmap.roadmapStatus],
      href: KIND_HREF.roadmap,
      children: [],
    };
    const parent =
      (roadmap.linkedGoalId ? goalNodes.get(roadmap.linkedGoalId) : undefined) ??
      (roadmap.linkedProjectId ? projectNodes.get(roadmap.linkedProjectId) : undefined);
    if (parent) {
      parent.children.push(node);
    } else {
      if (roadmap.linkedGoalId || roadmap.linkedProjectId) node.danglingParent = true;
      unlinkedByKind.roadmap.push(node);
    }
  }

  sortChildren(roots);

  const unlinked: UnlinkedGroup[] = (Object.keys(unlinkedByKind) as CascadeKind[])
    .filter((kind) => unlinkedByKind[kind].length > 0)
    .map((kind) => ({
      kind,
      label: CASCADE_KIND_LABEL[kind],
      nodes: [...unlinkedByKind[kind]].sort((a, b) => a.title.localeCompare(b.title)),
    }));

  const byKind: Record<CascadeKind, number> = {
    plan: planNodes.size,
    goal: goalNodes.size,
    project: projectNodes.size,
    milestone: input.milestones.length,
    roadmap: input.roadmaps.length,
  };
  const nodeTotal = Object.values(byKind).reduce((sum, n) => sum + n, 0);
  const unlinkedTotal = unlinked.reduce((sum, group) => sum + group.nodes.length, 0);

  return {
    roots,
    unlinked,
    counts: {
      nodes: nodeTotal,
      linked: nodeTotal - unlinkedTotal,
      unlinked: unlinkedTotal,
      byKind,
    },
  };
}
