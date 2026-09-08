"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  IconButton,
  Textarea,
} from "@/components/ui";
import { normalizeError } from "@/lib/errors";
import { quickNoteRepository, type QuickNote } from "../quick-note";

function relativeTime(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 45) return "just now";
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.round(seconds / 3600)}h ago`;
  if (seconds < 604_800) return `${Math.round(seconds / 86_400)}d ago`;
  return new Date(then).toLocaleDateString();
}

export function QuickNotesWidget({ initialNotes }: { initialNotes: QuickNote[] }) {
  const [notes, setNotes] = useState<QuickNote[]>(initialNotes);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(normalizeError(caught).message);
    } finally {
      setBusy(false);
    }
  }

  const addNote = () =>
    run(async () => {
      const body = draft.trim();
      if (!body) return;
      const created = await quickNoteRepository.create({ body });
      setNotes((current) => [created, ...current].slice(0, 8));
      setDraft("");
    });

  const saveEdit = (id: string) =>
    run(async () => {
      const body = editBody.trim();
      if (!body) return;
      const updated = await quickNoteRepository.update(id, { body });
      setNotes((current) => current.map((note) => (note.id === id ? updated : note)));
      setEditingId(null);
      setEditBody("");
    });

  const deleteNote = (id: string) =>
    run(async () => {
      await quickNoteRepository.archive(id);
      setNotes((current) => current.filter((note) => note.id !== id));
    });

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Quick notes</CardTitle>
        <span className="text-subtle text-xs">{notes.length}</span>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        {error ? (
          <Alert variant="danger">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-2">
          <Textarea
            rows={2}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Capture a thought…"
            aria-label="New quick note"
            maxLength={2000}
          />
          <Button
            size="sm"
            className="self-end"
            onClick={addNote}
            loading={busy}
            disabled={!draft.trim()}
          >
            <Plus />
            Add
          </Button>
        </div>

        {notes.length === 0 ? (
          <p className="text-muted text-sm">No notes yet.</p>
        ) : (
          <ul className="divide-border divide-y">
            {notes.map((note) => (
              <li key={note.id} className="py-2 first:pt-0 last:pb-0">
                {editingId === note.id ? (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      rows={2}
                      value={editBody}
                      onChange={(event) => setEditBody(event.target.value)}
                      aria-label="Edit quick note"
                      maxLength={2000}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(null);
                          setEditBody("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => saveEdit(note.id)} loading={busy}>
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm wrap-break-words whitespace-pre-wrap">{note.body}</p>
                      <p className="text-subtle mt-0.5 text-xs">{relativeTime(note.updatedAt)}</p>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <IconButton
                        size="sm"
                        aria-label="Edit note"
                        icon={<Pencil />}
                        onClick={() => {
                          setEditingId(note.id);
                          setEditBody(note.body);
                        }}
                      />
                      <IconButton
                        size="sm"
                        aria-label="Delete note"
                        icon={editingId === note.id ? <X /> : <Trash2 />}
                        onClick={() => deleteNote(note.id)}
                      />
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
