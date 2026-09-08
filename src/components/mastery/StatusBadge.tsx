import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Circle,
  CircleDot,
  Clock,
  PauseCircle,
  type LucideIcon,
} from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui";
import { cn } from "@/lib/utils";

export type StatusKind =
  | "complete"
  | "in-progress"
  | "active"
  | "pending"
  | "not-started"
  | "paused"
  | "overdue"
  | "blocked";

interface StatusMeta {
  label: string;
  icon: LucideIcon;
  variant: NonNullable<BadgeProps["variant"]>;
}

const STATUS: Record<StatusKind, StatusMeta> = {
  complete: { label: "Complete", icon: CheckCircle2, variant: "success" },
  "in-progress": { label: "In progress", icon: CircleDot, variant: "info" },
  active: { label: "Active", icon: CircleDot, variant: "primary" },
  pending: { label: "Pending", icon: Clock, variant: "neutral" },
  "not-started": { label: "Not started", icon: Circle, variant: "neutral" },
  paused: { label: "Paused", icon: PauseCircle, variant: "warning" },
  overdue: { label: "Overdue", icon: AlertTriangle, variant: "danger" },
  blocked: { label: "Blocked", icon: Ban, variant: "danger" },
};

export interface StatusBadgeProps {
  status: StatusKind;
  /** Override the default label text. */
  label?: string;
  className?: string;
}

/**
 * Canonical status pill. Semantic colour plus an icon and a text label, so the
 * meaning never rests on colour alone. Wraps the shared <Badge/>.
 */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const meta = STATUS[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} className={cn(className)}>
      <Icon className="size-3" aria-hidden="true" />
      {label ?? meta.label}
    </Badge>
  );
}
