"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { buildReportData, type ReportData } from "./report-data";
import { listRecentReports, reportRepository } from "./report-repository";
import {
  defaultReportTitle,
  resolvePeriodRange,
  type Report,
  type ReportFormValues,
} from "./report-schema";

type Status = "loading" | "ready" | "error";

export function useReports() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [history, setHistory] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [current, setCurrent] = useState<ReportData | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;

    listRecentReports().then(
      (loaded) => {
        if (cancelled) return;
        setHistory(loaded);
        setStatus("ready");
        setError(null);
      },
      (caught) => {
        if (cancelled) return;
        setStatus("error");
        setError(normalizeError(caught).message);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [authStatus, refreshToken]);

  const reload = useCallback(() => setRefreshToken((token) => token + 1), []);

  const generate = useCallback(async (values: ReportFormValues): Promise<ReportData | null> => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const range = resolvePeriodRange(values);
      const data = await buildReportData(range, values.sections);
      setCurrent(data);
      await reportRepository.create({
        title: defaultReportTitle(values.period, range),
        period: values.period,
        periodStart: range.start,
        periodEnd: range.end,
        sections: values.sections,
        format: "pdf",
        generatedAt: data.generatedAt,
      });
      setHistory(await listRecentReports());
      return data;
    } catch (caught) {
      setGenerateError(normalizeError(caught).message);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const clearCurrent = useCallback(() => setCurrent(null), []);

  return {
    status,
    history,
    error,
    reload,
    generate,
    generating,
    generateError,
    current,
    clearCurrent,
  };
}
