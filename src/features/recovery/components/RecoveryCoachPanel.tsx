"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LifeBuoy } from "lucide-react";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  FormField,
  Textarea,
} from "@/components/ui";
import { ErrorState } from "@/components/shared";
import {
  recoveryCoachFormSchema,
  type RecoveryCoachFormValues,
  type RecoveryCoachSession,
} from "../recovery-coach-schema";
import { useRecoveryCoach } from "../use-recovery-coach";

function SessionCard({ session }: { session: RecoveryCoachSession }) {
  return (
    <li className="rounded-md border p-3 text-sm">
      <p className="text-subtle text-xs break-words">You: {session.message}</p>
      <p className="mt-1 break-words whitespace-pre-wrap">{session.reply}</p>
      {session.suggestedSteps.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {session.suggestedSteps.map((step) => (
            <li key={step.id} className="flex flex-col">
              <span className="font-medium">{step.label}</span>
              <span className="text-muted break-words">{step.description}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {session.disclaimers.length > 0 ? (
        <div className="mt-2 space-y-1">
          {session.disclaimers.map((line, index) => (
            <p key={index} className="text-subtle text-xs break-words">
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </li>
  );
}

export function RecoveryCoachPanel({ goalId }: { goalId: string }) {
  const { status, sessions, error, reload, ask, asking, askError } = useRecoveryCoach(goalId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecoveryCoachFormValues>({
    resolver: zodResolver(recoveryCoachFormSchema),
    defaultValues: { message: "" },
  });

  const submit = handleSubmit(async ({ message }) => {
    const result = await ask(message);
    if (result) reset({ message: "" });
  });

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <LifeBuoy className="size-4" aria-hidden="true" />
        <h3 className="font-semibold">Recovery Coach</h3>
        <Badge variant="outline">Private</Badge>
      </div>
      <p className="text-subtle text-sm">
        A judgment-free place to ask for a small next step. It only sees this goal&apos;s records,
        never your general planning data — and it isn&apos;t a substitute for a professional.
      </p>

      <Card>
        <CardContent className="space-y-3 p-4">
          <form onSubmit={submit} className="space-y-3" noValidate>
            {askError ? (
              <Alert variant="danger">
                <AlertDescription>{askError}</AlertDescription>
              </Alert>
            ) : null}
            <FormField
              label="What's going on right now?"
              htmlFor="coach-message"
              error={errors.message?.message}
            >
              <Textarea
                id="coach-message"
                rows={3}
                placeholder="e.g. I've had the urge all evening and I'm about to give in"
                {...register("message")}
              />
            </FormField>
            <div className="flex justify-end">
              <Button type="submit" loading={asking}>
                Ask for a next step
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {status === "error" ? (
        <ErrorState
          title="We couldn't load your coach history"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : status === "loading" ? (
        <p className="text-subtle text-sm">Loading…</p>
      ) : sessions.length === 0 ? (
        <p className="text-subtle text-sm">No coach conversations yet for this goal.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.slice(0, 5).map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </ul>
      )}
    </section>
  );
}
