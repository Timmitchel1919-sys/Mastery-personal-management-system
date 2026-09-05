"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileDown, Printer } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/components/ui";
import {
  REPORT_PERIOD_LABEL,
  REPORT_PERIODS,
  REPORT_SECTION_DESCRIPTION,
  REPORT_SECTION_LABEL,
  REPORT_SECTIONS,
  reportFormSchema,
  type ReportFormValues,
  type ReportSection,
} from "../report-schema";
import { useReports } from "../use-reports";
import { ReportDocument } from "./ReportDocument";

function GenerateForm({
  generating,
  onSubmit,
}: {
  generating: boolean;
  onSubmit: (values: ReportFormValues) => void;
}) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      period: "weekly",
      periodStart: "",
      periodEnd: "",
      sections: [...REPORT_SECTIONS],
    },
  });

  const period = useWatch({ control, name: "period" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Controller
        control={control}
        name="period"
        render={({ field }) => (
          <FormField label="Period" htmlFor="report-period">
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="report-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_PERIODS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {REPORT_PERIOD_LABEL[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      />

      {period === "custom" ? (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="From" error={errors.periodStart?.message}>
            <Input type="date" {...register("periodStart")} />
          </FormField>
          <FormField label="To" error={errors.periodEnd?.message}>
            <Input type="date" {...register("periodEnd")} />
          </FormField>
        </div>
      ) : null}

      <FormField label="Sections" error={errors.sections?.message}>
        <div className="flex flex-col gap-2">
          {REPORT_SECTIONS.map((section) => (
            <Controller
              key={section}
              control={control}
              name="sections"
              render={({ field }) => {
                const checked = field.value.includes(section);
                return (
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox
                      className="mt-0.5"
                      checked={checked}
                      onCheckedChange={(next) => {
                        const set = new Set<ReportSection>(field.value);
                        if (next === true) set.add(section);
                        else set.delete(section);
                        field.onChange(REPORT_SECTIONS.filter((value) => set.has(value)));
                      }}
                    />
                    <span>
                      <span className="font-medium">{REPORT_SECTION_LABEL[section]}</span>
                      <span className="text-subtle block text-xs">
                        {REPORT_SECTION_DESCRIPTION[section]}
                      </span>
                    </span>
                  </label>
                );
              }}
            />
          ))}
        </div>
      </FormField>

      <Button type="submit" loading={generating}>
        <FileDown />
        Generate report
      </Button>
    </form>
  );
}

export function ReportsView() {
  const {
    status,
    history,
    error,
    reload,
    generate,
    generating,
    generateError,
    current,
    clearCurrent,
  } = useReports();
  const [period, setPeriod] = useState<ReportFormValues["period"]>("weekly");

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Reports"
        description="Compose a report for any period, then save it as a PDF from your browser's print dialog."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          current ? (
            <div className="flex gap-2" data-print-hide>
              <Button variant="ghost" onClick={clearCurrent}>
                New report
              </Button>
              <Button onClick={() => window.print()}>
                <Printer />
                Download PDF
              </Button>
            </div>
          ) : null
        }
      />

      {current ? (
        <ReportDocument data={current} period={period} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[20rem_1fr]" data-print-hide>
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-medium">New report</h2>
              {generateError ? (
                <Alert variant="danger">
                  <AlertDescription>{generateError}</AlertDescription>
                </Alert>
              ) : null}
              <GenerateForm
                generating={generating}
                onSubmit={(values) => {
                  setPeriod(values.period);
                  void generate(values);
                }}
              />
              <p className="text-subtle text-xs">A report never includes Recovery Center data.</p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h2 className="font-medium">History</h2>
            {status === "loading" ? (
              <div className="space-y-2">
                {[0, 1, 2].map((key) => (
                  <Skeleton key={key} className="h-16" />
                ))}
              </div>
            ) : status === "error" ? (
              <ErrorState
                title="We couldn't load your reports"
                description={error ?? "Please try again."}
                onRetry={reload}
              />
            ) : history.length === 0 ? (
              <EmptyState
                title="No reports yet"
                description="Generate your first report with the form."
              />
            ) : (
              <ul className="space-y-2">
                {history.map((report) => (
                  <li key={report.id} className="rounded-md border p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium break-words">{report.title}</span>
                      <Badge variant="outline">{REPORT_PERIOD_LABEL[report.period]}</Badge>
                    </div>
                    <p className="text-subtle text-xs">
                      {report.periodStart} to {report.periodEnd} · {report.sections.length} section
                      {report.sections.length === 1 ? "" : "s"} ·{" "}
                      {new Date(report.generatedAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
