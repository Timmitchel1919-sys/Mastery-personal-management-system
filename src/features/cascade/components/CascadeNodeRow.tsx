import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui";
import { CASCADE_KIND_LABEL, type CascadeKind, type CascadeNode } from "../build-cascade";

const KIND_VARIANT: Record<CascadeKind, "primary" | "info" | "neutral" | "outline"> = {
  plan: "primary",
  goal: "info",
  project: "neutral",
  milestone: "outline",
  roadmap: "outline",
};

function Row({ node }: { node: CascadeNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-1">
      <Badge variant={KIND_VARIANT[node.kind]}>{CASCADE_KIND_LABEL[node.kind]}</Badge>
      <Link href={node.href} className="text-foreground font-medium hover:underline">
        {node.title}
      </Link>
      <span className="text-subtle text-xs">{node.statusLabel}</span>
      {node.danglingParent ? (
        <span className="text-warning inline-flex items-center gap-1 text-xs">
          <AlertTriangle className="size-3.5" aria-hidden="true" />
          parent link broken
        </span>
      ) : null}
    </div>
  );
}

export function CascadeNodeRow({ node }: { node: CascadeNode }) {
  if (node.children.length === 0) {
    return (
      <li className="border-border border-l pl-4">
        <Row node={node} />
      </li>
    );
  }

  return (
    <li className="border-border border-l pl-4">
      <details open className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1">
          <ChevronRight
            className="text-subtle size-4 shrink-0 transition-transform group-open:rotate-90"
            aria-hidden="true"
          />
          <Row node={node} />
        </summary>
        <ul className="mt-1 space-y-1">
          {node.children.map((child) => (
            <CascadeNodeRow key={`${child.kind}:${child.id}`} node={child} />
          ))}
        </ul>
      </details>
    </li>
  );
}
