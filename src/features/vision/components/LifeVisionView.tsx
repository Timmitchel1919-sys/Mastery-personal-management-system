"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { PageContainer, PageHeader, BreadcrumbTrail } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button, Skeleton } from "@/components/ui";
import { useLifeVision } from "../use-life-vision";
import { LIFE_VISION_CATEGORIES, LIFE_VISION_CATEGORY_META, type LifeVision } from "../schema";
import { VisionItemCard } from "./VisionItemCard";
import { VisionItemDialog } from "./VisionItemDialog";

export function LifeVisionView() {
  const { status, items, error, reload, create, update, archive } = useLifeVision();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LifeVision | null>(null);

  const grouped = useMemo(() => {
    return LIFE_VISION_CATEGORIES.map((category) => ({
      category,
      meta: LIFE_VISION_CATEGORY_META[category],
      entries: items.filter((item) => item.category === category),
    })).filter((group) => group.entries.length > 0);
  }, [items]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(item: LifeVision) {
    setEditing(item);
    setDialogOpen(true);
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Life Vision"
        description="Mission, values, purpose, and long-term direction — each linked to your life pillars."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button onClick={openCreate} disabled={status === "loading"}>
            <Plus />
            Add vision item
          </Button>
        }
      />

      {status === "loading" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-40" />
          ))}
        </div>
      ) : status === "error" ? (
        <ErrorState
          className="min-h-[40vh]"
          title="We couldn't load your Life Vision"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Your Life Vision is empty"
          description="Start with a personal mission or a core value. You can add the rest over time."
          action={
            <Button onClick={openCreate}>
              <Plus />
              Add your first item
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.category} className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold">{group.meta.label}</h2>
                <p className="text-subtle text-xs">{group.meta.description}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {group.entries.map((item) => (
                  <VisionItemCard key={item.id} item={item} onEdit={openEdit} onArchive={archive} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <VisionItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        onSubmit={async (values) => {
          if (editing) await update(editing.id, values);
          else await create(values);
        }}
      />
    </PageContainer>
  );
}
