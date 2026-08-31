"use client";

import Link from "next/link";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import { Badge, Card, CardContent, Skeleton } from "@/components/ui";
import { CASCADE_KIND_LABEL, type CascadeKind } from "../build-cascade";
import { useCascade } from "../use-cascade";
import { CascadeNodeRow } from "./CascadeNodeRow";

const KIND_ORDER: CascadeKind[] = ["plan", "goal", "project", "milestone", "roadmap"];

export function CascadeView() {
  const { status, cascade, error, reload } = useCascade();
  const { roots, unlinked, counts } = cascade;

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Planning Cascade"
        description="How your plans, goals, projects, milestones, and roadmaps trace up to your vision."
        breadcrumbs={<BreadcrumbTrail />}
      />

      {status === "loading" ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-72" />
        </div>
      ) : status === "error" ? (
        <ErrorState
          className="min-h-[40vh]"
          title="We couldn't build your cascade"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : counts.nodes === 0 ? (
        <EmptyState
          title="Nothing to trace yet"
          description="Create a plan, goal, or project and link records to one another — the chain shows up here."
        />
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-wrap gap-x-6 gap-y-2 p-4 text-sm">
              <span>
                <strong className="tabular-nums">{counts.nodes}</strong> records
              </span>
              <span className="text-success">
                <strong className="tabular-nums">{counts.linked}</strong> linked
              </span>
              <span className={counts.unlinked > 0 ? "text-warning" : "text-subtle"}>
                <strong className="tabular-nums">{counts.unlinked}</strong> not yet linked
              </span>
              <span className="text-subtle">
                {KIND_ORDER.map(
                  (kind) =>
                    `${counts.byKind[kind]} ${CASCADE_KIND_LABEL[kind].toLowerCase()}${counts.byKind[kind] === 1 ? "" : "s"}`,
                ).join(" · ")}
              </span>
            </CardContent>
          </Card>

          {roots.length > 0 ? (
            <Card>
              <CardContent className="p-4">
                <ul className="space-y-1">
                  {roots.map((node) => (
                    <CascadeNodeRow key={`${node.kind}:${node.id}`} node={node} />
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-subtle p-4 text-sm">
                No plan sits at the top of a chain yet. Link a five-year plan or give your one-year
                plans a parent to start the cascade.
              </CardContent>
            </Card>
          )}

          {unlinked.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-sm font-medium">Not yet linked</h2>
              <p className="text-subtle text-sm">
                These records have no parent in the cascade. Open one and set its parent plan, goal,
                or project to fold it in.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {unlinked.map((group) => (
                  <Card key={group.kind}>
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{group.label}</Badge>
                        <span className="text-subtle text-xs tabular-nums">
                          {group.nodes.length}
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {group.nodes.map((node) => (
                          <li key={`${node.kind}:${node.id}`} className="text-sm">
                            <Link href={node.href} className="hover:underline">
                              {node.title}
                            </Link>
                            {node.danglingParent ? (
                              <span className="text-warning ml-2 text-xs">parent link broken</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </PageContainer>
  );
}
