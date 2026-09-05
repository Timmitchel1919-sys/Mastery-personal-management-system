"use client";

import { REPORT_SECTION_LABEL, type ReportPeriod, REPORT_PERIOD_LABEL } from "../report-schema";
import type { ReportData } from "../report-data";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-neutral-500 text-xs">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function SectionShell({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 break-inside-avoid">
      <h2 className="border-b pb-1 text-base font-semibold">
        {REPORT_SECTION_LABEL[id as keyof typeof REPORT_SECTION_LABEL]}
      </h2>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="text-neutral-500 text-sm">No data for this period.</p>;
}

export function ReportDocument({ data, period }: { data: ReportData; period: ReportPeriod }) {
  return (
    <article
      data-report-print
      className="mx-auto max-w-2xl space-y-6 rounded-lg border bg-white p-8 text-sm text-neutral-900"
    >
      <header className="space-y-1 border-b pb-4">
        <p className="text-lg font-bold tracking-tight">Mastery</p>
        <p className="text-neutral-500 text-xs">Plan · Focus · Act · Grow</p>
        <h1 className="pt-2 text-xl font-semibold">
          {period === "custom" ? "Report" : REPORT_PERIOD_LABEL[period]}
        </h1>
        <p className="text-neutral-600 text-xs">
          {data.range.start} to {data.range.end} · generated{" "}
          {new Date(data.generatedAt).toLocaleString()}
        </p>
      </header>

      {data.summary ? (
        <SectionShell id="summary">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Goals achieved" value={String(data.summary.goalsAchieved)} />
            <Stat label="Milestones done" value={String(data.summary.milestonesCompleted)} />
            <Stat label="Tasks completed" value={String(data.summary.tasksCompleted)} />
            <Stat label="Focus minutes" value={String(data.summary.focusMinutes)} />
            <Stat
              label="Habit consistency"
              value={
                data.summary.habitConsistencyPercent === null
                  ? "—"
                  : `${data.summary.habitConsistencyPercent}%`
              }
            />
            <Stat label="Active KPIs" value={String(data.summary.activeKpis)} />
          </div>
        </SectionShell>
      ) : null}

      {data.goals ? (
        <SectionShell id="goals">
          {data.goals.achieved.length === 0 &&
          data.goals.inProgress.length === 0 &&
          data.goals.milestonesCompleted.length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-2">
              {data.goals.achieved.length > 0 ? (
                <div>
                  <p className="font-medium">Achieved this period</p>
                  <ul className="list-disc pl-5">
                    {data.goals.achieved.map((g, i) => (
                      <li key={i}>{g.title}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {data.goals.milestonesCompleted.length > 0 ? (
                <div>
                  <p className="font-medium">Milestones completed</p>
                  <ul className="list-disc pl-5">
                    {data.goals.milestonesCompleted.map((m, i) => (
                      <li key={i}>{m.title}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {data.goals.inProgress.length > 0 ? (
                <div>
                  <p className="font-medium">Still in progress</p>
                  <ul className="pl-5">
                    {data.goals.inProgress.map((g, i) => (
                      <li key={i} className="list-disc">
                        {g.title} — {g.progress}%
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </SectionShell>
      ) : null}

      {data.habits ? (
        <SectionShell id="habits">
          {data.habits.perHabit.length === 0 ? (
            <Empty />
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-neutral-500 text-xs">
                  <th className="pb-1 font-medium">Habit</th>
                  <th className="pb-1 font-medium">Done</th>
                  <th className="pb-1 font-medium">Consistency</th>
                </tr>
              </thead>
              <tbody>
                {data.habits.perHabit.map((h, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1">{h.title}</td>
                    <td className="py-1 tabular-nums">
                      {h.completed}/{h.expected}
                    </td>
                    <td className="py-1 tabular-nums">{h.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionShell>
      ) : null}

      {data.focus ? (
        <SectionShell id="focus">
          {data.focus.sessionCount === 0 ? (
            <Empty />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Total minutes" value={String(data.focus.totalMinutes)} />
              <Stat label="Sessions" value={String(data.focus.sessionCount)} />
              <Stat label="Longest" value={`${data.focus.longestMinutes}m`} />
              <Stat label="Average" value={`${data.focus.averageMinutes}m`} />
            </div>
          )}
        </SectionShell>
      ) : null}

      {data.kpis ? (
        <SectionShell id="kpis">
          {data.kpis.length === 0 ? (
            <Empty />
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-neutral-500 text-xs">
                  <th className="pb-1 font-medium">KPI</th>
                  <th className="pb-1 font-medium">Start</th>
                  <th className="pb-1 font-medium">End</th>
                  <th className="pb-1 font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {data.kpis.map((k, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1">
                      {k.title}
                      {k.unit ? <span className="text-neutral-500"> ({k.unit})</span> : null}
                    </td>
                    <td className="py-1 tabular-nums">{k.from ?? "—"}</td>
                    <td className="py-1 tabular-nums">{k.to ?? "—"}</td>
                    <td className="py-1 tabular-nums">
                      {k.change === null ? "—" : k.change > 0 ? `+${k.change}` : k.change}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionShell>
      ) : null}

      {data.planning ? (
        <SectionShell id="planning">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="On time" value={String(data.planning.completedOnTime)} />
            <Stat label="Late" value={String(data.planning.completedLate)} />
            <Stat label="Cancelled" value={String(data.planning.cancelled)} />
            <Stat label="Still overdue" value={String(data.planning.stillOverdue)} />
          </div>
        </SectionShell>
      ) : null}

      <footer className="text-neutral-500 border-t pt-4 text-xs">
        Generated by Mastery. Recovery Center data is never included in a report.
      </footer>
    </article>
  );
}
