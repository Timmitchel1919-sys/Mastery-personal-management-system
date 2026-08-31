"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pause, Play, SkipForward, Square } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  FormField,
  Input,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useGoalOptions } from "@/features/goals";
import { useProjectOptions } from "@/features/projects";
import {
  DEFAULT_POMODORO_CONFIG,
  PHASE_LABEL,
  pomodoroConfigSchema,
  type PomodoroConfig,
} from "../schema";
import type { PomodoroSnapshot } from "../pomodoro-store";

const NONE = "__none__";

function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

interface PomodoroTimerProps {
  state: PomodoroSnapshot;
  onStart: (config: PomodoroConfig) => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onCancel: () => void;
}

export function PomodoroTimer({
  state,
  onStart,
  onPause,
  onResume,
  onSkip,
  onCancel,
}: PomodoroTimerProps) {
  const idle = state.phase === "idle";

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="text-center">
          <p className="text-subtle text-xs tracking-wide uppercase">{PHASE_LABEL[state.phase]}</p>
          <p className="mt-1 text-6xl font-semibold tabular-nums">
            {formatClock(idle ? state.config.workMinutes * 60_000 : state.displayRemainingMs)}
          </p>
        </div>

        {!idle ? (
          <>
            <Progress
              value={Math.round(state.phaseProgress * 100)}
              label={`${PHASE_LABEL[state.phase]} progress`}
            />
            <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
              {Array.from({ length: state.config.plannedCycles }, (_, index) => (
                <span
                  key={index}
                  className={`size-2.5 rounded-full ${
                    index < state.cyclesDone ? "bg-primary" : "bg-surface border-border border"
                  }`}
                />
              ))}
            </div>
            <p className="text-subtle text-center text-sm">
              {state.cyclesDone} of {state.config.plannedCycles} focus intervals done
              {state.config.label ? ` · ${state.config.label}` : ""}
            </p>
            <div className="flex justify-center gap-2">
              {state.running ? (
                <Button variant="secondary" onClick={onPause}>
                  <Pause />
                  Pause
                </Button>
              ) : (
                <Button onClick={onResume}>
                  <Play />
                  Resume
                </Button>
              )}
              <Button variant="secondary" onClick={onSkip}>
                <SkipForward />
                Skip
              </Button>
              <Button variant="danger" onClick={onCancel}>
                <Square />
                End
              </Button>
            </div>
          </>
        ) : (
          <SetupForm defaultConfig={state.config} onStart={onStart} />
        )}
      </CardContent>
    </Card>
  );
}

function SetupForm({
  defaultConfig,
  onStart,
}: {
  defaultConfig: PomodoroConfig;
  onStart: (config: PomodoroConfig) => void;
}) {
  const { options: goalOptions } = useGoalOptions();
  const { options: projectOptions } = useProjectOptions();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PomodoroConfig>({
    resolver: zodResolver(pomodoroConfigSchema),
    defaultValues: {
      workMinutes: defaultConfig.workMinutes || DEFAULT_POMODORO_CONFIG.workMinutes,
      shortBreakMinutes:
        defaultConfig.shortBreakMinutes || DEFAULT_POMODORO_CONFIG.shortBreakMinutes,
      longBreakMinutes: defaultConfig.longBreakMinutes || DEFAULT_POMODORO_CONFIG.longBreakMinutes,
      plannedCycles: defaultConfig.plannedCycles || DEFAULT_POMODORO_CONFIG.plannedCycles,
      label: defaultConfig.label ?? "",
      goalId: defaultConfig.goalId ?? null,
      projectId: defaultConfig.projectId ?? null,
    },
  });

  const submit = handleSubmit((values) => onStart(values));

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Focus on" error={errors.label?.message}>
        <Input placeholder="What are you working on?" {...register("label")} />
      </FormField>

      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          control={control}
          name="goalId"
          render={({ field }) => (
            <FormField label="Goal" htmlFor="pomodoro-goal" error={errors.goalId?.message}>
              <Select
                value={field.value ?? NONE}
                onValueChange={(next) => field.onChange(next === NONE ? null : next)}
              >
                <SelectTrigger id="pomodoro-goal">
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
            <FormField label="Project" htmlFor="pomodoro-project" error={errors.projectId?.message}>
              <Select
                value={field.value ?? NONE}
                onValueChange={(next) => field.onChange(next === NONE ? null : next)}
              >
                <SelectTrigger id="pomodoro-project">
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <FormField label="Focus (min)" error={errors.workMinutes?.message}>
          <Input
            type="number"
            min={1}
            max={180}
            {...register("workMinutes", { valueAsNumber: true })}
          />
        </FormField>
        <FormField label="Short break" error={errors.shortBreakMinutes?.message}>
          <Input
            type="number"
            min={1}
            max={60}
            {...register("shortBreakMinutes", { valueAsNumber: true })}
          />
        </FormField>
        <FormField label="Long break" error={errors.longBreakMinutes?.message}>
          <Input
            type="number"
            min={1}
            max={120}
            {...register("longBreakMinutes", { valueAsNumber: true })}
          />
        </FormField>
        <FormField label="Intervals" error={errors.plannedCycles?.message}>
          <Input
            type="number"
            min={1}
            max={12}
            {...register("plannedCycles", { valueAsNumber: true })}
          />
        </FormField>
      </div>

      <div className="flex justify-center">
        <Button type="submit" size="lg">
          <Play />
          Start focus session
        </Button>
      </div>
    </form>
  );
}
