"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BookOpen, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState } from "@/components/shared";
import { Button, Input, Skeleton, Textarea } from "@/components/ui";
import { CONTEXT_CONFIDENCE_LABEL, type ContextItem } from "../context-model";
import { useKnowledgeContext } from "../use-context";

function Section({
  id,
  title,
  icon,
  description,
  children,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="mastery-panel space-y-4 rounded-2xl p-5">
      <div className="space-y-1">
        <h2 id={`${id}-heading`} className="text-eyebrow flex items-center gap-1.5">
          {icon}
          {title}
        </h2>
        {description ? <p className="text-subtle text-xs">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ItemRow({ item }: { item: ContextItem }) {
  return (
    <li className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0 space-y-0.5">
        <Link href={item.href} className="text-foreground block truncate text-sm hover:underline">
          {item.title}
        </Link>
        <p className="text-muted line-clamp-2 text-xs">{item.snippet}</p>
        <p className="text-subtle text-[0.6875rem]">
          {item.type} · {CONTEXT_CONFIDENCE_LABEL[item.confidence]} · {item.date.slice(0, 10)}
        </p>
      </div>
    </li>
  );
}

export function KnowledgeHubView() {
  const { status, index, conflicts, query, userContext } = useKnowledgeContext();
  const [text, setText] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftTags, setDraftTags] = useState("");

  const searchResults = useMemo(
    () => (text.trim().length >= 2 ? query({ text, limit: 20 }) : []),
    [text, query],
  );

  const lessons = useMemo(() => index.filter((item) => item.type === "LEARNING"), [index]);
  const reflections = useMemo(() => index.filter((item) => item.type === "REFLECTION"), [index]);
  const projectHistory = useMemo(
    () =>
      index
        .filter((item) => item.type === "GOAL" || item.type === "PLAN")
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
    [index],
  );
  const explicitNotes = userContext.notes.filter((note) => note.status !== "archived");

  const submitNote = () => {
    if (!draftBody.trim() && !draftTitle.trim()) return;
    userContext.add({
      title: draftTitle,
      body: draftBody,
      tags: draftTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    setDraftTitle("");
    setDraftBody("");
    setDraftTags("");
  };

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Knowledge Hub"
        description="Your searchable MASTERY knowledge layer. Context makes intelligence useful — you own it and you control it."
        breadcrumbs={<BreadcrumbTrail />}
      />

      {status === "loading" ? (
        <div className="space-y-4">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="mastery-panel flex items-center gap-2 rounded-2xl p-3">
            <Search className="text-subtle size-4 shrink-0" aria-hidden="true" />
            <Input
              type="search"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Search goals, plans, tasks, notes, decisions, reflections…"
              aria-label="Search your MASTERY knowledge"
              className="border-0 bg-transparent focus-visible:ring-0"
            />
          </div>

          {text.trim().length >= 2 ? (
            <Section
              id="search"
              title={`Search results (${searchResults.length})`}
              icon={<Search className="size-3.5" aria-hidden="true" />}
              description="Deterministic text match across your records — no AI, no external service."
            >
              {searchResults.length === 0 ? (
                <p className="text-muted text-sm">No matches. Try a different term.</p>
              ) : (
                <ul className="divide-border divide-y">
                  {searchResults.map((result) => (
                    <ItemRow key={result.item.id} item={result.item} />
                  ))}
                </ul>
              )}
            </Section>
          ) : null}

          {conflicts.length > 0 ? (
            <Section
              id="conflicts"
              title={`Conflicting context (${conflicts.length})`}
              icon={<AlertTriangle className="size-3.5" aria-hidden="true" />}
              description="MASTERY does not choose for you — resolve these in the source record."
            >
              <ul className="space-y-2">
                {conflicts.map((conflict) => (
                  <li key={conflict.id} className="text-foreground text-sm">
                    {conflict.statement}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section
            id="important"
            title="Important context"
            icon={<BookOpen className="size-3.5" aria-hidden="true" />}
            description="Notes and constraints you add explicitly. These outrank anything MASTERY infers."
          >
            <div className="border-border space-y-2 rounded-xl border p-3">
              <Input
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                placeholder="Title — e.g. 'This project depends on the vendor contract'"
                aria-label="Context note title"
              />
              <Textarea
                value={draftBody}
                onChange={(event) => setDraftBody(event.target.value)}
                placeholder="Details — a planning constraint, a dependency, a relationship to remember…"
                aria-label="Context note details"
                rows={2}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={draftTags}
                  onChange={(event) => setDraftTags(event.target.value)}
                  placeholder="tags, comma separated"
                  aria-label="Context note tags"
                  className="max-w-xs"
                />
                <Button type="button" size="sm" onClick={submitNote}>
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add context
                </Button>
              </div>
            </div>

            {explicitNotes.length === 0 ? (
              <p className="text-muted text-sm">Nothing added yet.</p>
            ) : (
              <ul className="divide-border divide-y">
                {explicitNotes.map((note) => (
                  <li key={note.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-foreground text-sm font-medium">{note.title}</p>
                      <p className="text-muted line-clamp-2 text-xs">{note.body}</p>
                      {note.tags.length > 0 ? (
                        <p className="text-subtle text-[0.6875rem]">{note.tags.join(" · ")}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => userContext.setStatus(note.id, "archived")}
                        className="text-subtle hover:text-foreground rounded p-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Archive
                      </button>
                      <button
                        type="button"
                        onClick={() => userContext.remove(note.id)}
                        className="text-subtle hover:text-danger rounded p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Delete "${note.title}"`}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <Section
              id="lessons"
              title={`Lessons (${lessons.length})`}
              icon={<BookOpen className="size-3.5" aria-hidden="true" />}
              description="Your 'lessons learned' journal entries — evidence for future planning."
            >
              {lessons.length === 0 ? (
                <p className="text-muted text-sm">
                  No lessons captured yet. Add a “lessons learned” entry in the journal.
                </p>
              ) : (
                <ul className="divide-border divide-y">
                  {lessons.slice(0, 12).map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </Section>

            <Section
              id="reflections"
              title={`Reflections (${reflections.length})`}
              icon={<BookOpen className="size-3.5" aria-hidden="true" />}
            >
              {reflections.length === 0 ? (
                <p className="text-muted text-sm">No reflections yet.</p>
              ) : (
                <ul className="divide-border divide-y">
                  {reflections.slice(0, 12).map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </Section>
          </div>

          <Section
            id="project-history"
            title={`Project history (${projectHistory.length})`}
            icon={<BookOpen className="size-3.5" aria-hidden="true" />}
            description="Goals and plans, newest first. Older records are kept, not deleted."
          >
            {projectHistory.length === 0 ? (
              <EmptyState
                title="No project history yet"
                description="Goals and plans you create will appear here as searchable context."
              />
            ) : (
              <ul className="divide-border divide-y">
                {projectHistory.slice(0, 20).map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}
              </ul>
            )}
          </Section>

          {userContext.irrelevantSourceIds.length > 0 ? (
            <Section
              id="hidden"
              title={`Hidden from context (${userContext.irrelevantSourceIds.length})`}
              icon={<RotateCcw className="size-3.5" aria-hidden="true" />}
              description="Records you marked not relevant. Restore any of them here."
            >
              <ul className="space-y-1">
                {userContext.irrelevantSourceIds.map((sourceId) => {
                  const item = index.find((entry) => entry.sourceId === sourceId);
                  return (
                    <li key={sourceId} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted truncate">{item?.title ?? sourceId}</span>
                      <button
                        type="button"
                        onClick={() => userContext.restoreRelevance(sourceId)}
                        className="text-primary shrink-0 text-xs hover:underline"
                      >
                        Restore
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Section>
          ) : null}
        </>
      )}
    </PageContainer>
  );
}
