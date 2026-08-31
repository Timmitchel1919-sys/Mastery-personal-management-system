"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  AlertDescription,
  Button,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@/components/ui";
import type { GoalOption } from "@/features/goals";
import type { ProjectOption } from "@/features/projects";
import { normalizeError } from "@/lib/errors";
import {
  REMINDER_PRESETS,
  REPEAT_END_MODES,
  REPEAT_OPTIONS,
  RECURRENCE_FREQUENCY_LABEL,
  eventFormSchema,
  type CalendarEventFormValues,
} from "../schema";

const NONE = "__none__";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const END_MODE_LABEL: Record<(typeof REPEAT_END_MODES)[number], string> = {
  never: "Never ends",
  count: "After N times",
  until: "On a date",
};

function reminderLabel(minutes: number): string {
  if (minutes === 0) return "At start";
  if (minutes < 60) return `${minutes} min before`;
  if (minutes < 1440) return `${minutes / 60} h before`;
  return `${minutes / 1440} day${minutes / 1440 === 1 ? "" : "s"} before`;
}

export interface EventFormProps {
  goalOptions: GoalOption[];
  projectOptions: ProjectOption[];
  defaultValues: CalendarEventFormValues;
  submitLabel: string;
  onSubmit: (values: CalendarEventFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}

export function EventForm({
  goalOptions,
  projectOptions,
  defaultValues,
  submitLabel,
  onSubmit,
  onDelete,
  onCancel,
}: EventFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CalendarEventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
  });

  const allDay = useWatch({ control, name: "allDay" });
  const repeat = useWatch({ control, name: "repeat" });
  const repeatEndMode = useWatch({ control, name: "repeatEndMode" });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
    } catch (caught) {
      setFormError(normalizeError(caught).message);
    }
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {formError ? (
        <Alert variant="danger">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <FormField label="Title" error={errors.title?.message}>
        <Input placeholder="What is happening?" {...register("title")} />
      </FormField>

      <Controller
        control={control}
        name="allDay"
        render={({ field }) => (
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>All day</span>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </label>
        )}
      />

      {allDay ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Start date" error={errors.startDate?.message}>
            <Input type="date" {...register("startDate")} />
          </FormField>
          <FormField label="End date" error={errors.endDate?.message}>
            <Input type="date" {...register("endDate")} />
          </FormField>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Start" error={errors.startWall?.message}>
            <Input type="datetime-local" {...register("startWall")} />
          </FormField>
          <FormField label="End" error={errors.endWall?.message}>
            <Input type="datetime-local" {...register("endWall")} />
          </FormField>
        </div>
      )}

      <FormField label="Time zone" htmlFor="event-tz" error={errors.timeZone?.message}>
        <Input id="event-tz" placeholder="e.g. Europe/Amsterdam" {...register("timeZone")} />
      </FormField>

      <FormField label="Location" error={errors.location?.message}>
        <Input placeholder="Optional" {...register("location")} />
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        <Textarea rows={2} placeholder="Optional" {...register("description")} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="repeat"
          render={({ field }) => (
            <FormField label="Repeat" htmlFor="event-repeat" error={errors.repeat?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="event-repeat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Does not repeat</SelectItem>
                  {REPEAT_OPTIONS.filter((option) => option !== "none").map((option) => (
                    <SelectItem key={option} value={option}>
                      {RECURRENCE_FREQUENCY_LABEL[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
        {repeat !== "none" ? (
          <FormField label="Every (interval)" error={errors.interval?.message}>
            <Input
              type="number"
              min={1}
              max={365}
              {...register("interval", { valueAsNumber: true })}
            />
          </FormField>
        ) : null}
      </div>

      {repeat === "weekly" ? (
        <Controller
          control={control}
          name="repeatWeekdays"
          render={({ field }) => (
            <FormField label="On days" error={errors.repeatWeekdays?.message}>
              <div className="flex flex-wrap gap-1">
                {WEEKDAYS.map((label, index) => {
                  const active = field.value.includes(index);
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        field.onChange(
                          active
                            ? field.value.filter((d: number) => d !== index)
                            : [...field.value, index],
                        )
                      }
                      className={`h-8 w-10 rounded-md border text-xs font-medium ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </FormField>
          )}
        />
      ) : null}

      {repeat !== "none" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="repeatEndMode"
            render={({ field }) => (
              <FormField
                label="Ends"
                htmlFor="event-end-mode"
                error={errors.repeatEndMode?.message}
              >
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="event-end-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPEAT_END_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {END_MODE_LABEL[mode]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            )}
          />
          {repeatEndMode === "count" ? (
            <FormField label="Occurrences" error={errors.repeatCount?.message}>
              <Input
                type="number"
                min={1}
                max={730}
                {...register("repeatCount", { valueAsNumber: true })}
              />
            </FormField>
          ) : null}
          {repeatEndMode === "until" ? (
            <FormField label="Until" error={errors.repeatUntil?.message}>
              <Input type="date" {...register("repeatUntil")} />
            </FormField>
          ) : null}
        </div>
      ) : null}

      <Controller
        control={control}
        name="reminders"
        render={({ field }) => (
          <FormField label="Reminders" error={errors.reminders?.message}>
            <div className="flex flex-wrap gap-1.5">
              {REMINDER_PRESETS.map((minutes) => {
                const active = field.value.includes(minutes);
                return (
                  <button
                    key={minutes}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      field.onChange(
                        active
                          ? field.value.filter((m: number) => m !== minutes)
                          : [...field.value, minutes],
                      )
                    }
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted"
                    }`}
                  >
                    {reminderLabel(minutes)}
                  </button>
                );
              })}
            </div>
          </FormField>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="goalId"
          render={({ field }) => (
            <FormField label="Goal" htmlFor="event-goal" error={errors.goalId?.message}>
              <Select
                value={field.value || NONE}
                onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
              >
                <SelectTrigger id="event-goal">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {goalOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
        <Controller
          control={control}
          name="projectId"
          render={({ field }) => (
            <FormField label="Project" htmlFor="event-project" error={errors.projectId?.message}>
              <Select
                value={field.value || NONE}
                onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
              >
                <SelectTrigger id="event-project">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {projectOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            className="text-danger"
            loading={deleting}
            onClick={async () => {
              setDeleting(true);
              try {
                await onDelete();
              } finally {
                setDeleting(false);
              }
            }}
          >
            Delete
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
