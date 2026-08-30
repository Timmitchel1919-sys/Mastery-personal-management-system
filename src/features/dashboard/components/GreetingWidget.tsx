"use client";

import { useMounted } from "@/hooks/use-mounted";
import { formatToday, greetingForHour, greetingText } from "../dashboard-aggregate";

interface GreetingWidgetProps {
  displayName: string;
  locale: string;
  timeZone: string;
}

export function GreetingWidget({ displayName, locale, timeZone }: GreetingWidgetProps) {
  // Time-of-day and the formatted date depend on the client's clock; render a stable
  // value until mounted to avoid a hydration mismatch on the greeting.
  const mounted = useMounted();
  const now = mounted ? new Date() : null;

  const greeting = now ? greetingText(greetingForHour(now.getHours())) : "Welcome back";
  const dateLabel = now ? formatToday(now, locale, timeZone) : "";

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {greeting}, {displayName}
      </h1>
      {dateLabel ? <p className="text-muted text-sm">{dateLabel}</p> : null}
    </div>
  );
}
