"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@/components/ui";
import { useGoalOptions } from "@/features/goals";
import { WeeklySummariesView } from "@/features/weekly-summaries";
import { useAiCoach } from "../use-ai-coach";
import { AI_INTENT_LABEL, AI_INTENTS, type AiIntent } from "../schema";
import { ExchangeCard } from "./ExchangeCard";

export function AiCoachView() {
  const { status, exchanges, error, reload, ask, asking, askError } = useAiCoach();
  const { options: goalOptions } = useGoalOptions();

  const [intent, setIntent] = useState<AiIntent>("coach-query");
  const [userMessage, setUserMessage] = useState("");
  const [goalId, setGoalId] = useState("");

  const needsMessage = intent === "coach-query";
  const needsGoal = intent === "goal-breakdown";
  const canSubmit =
    (!needsMessage || userMessage.trim().length > 0) && (!needsGoal || goalId !== "");

  // Contextual quick-actions — each maps to a real intent (and, for a free-form
  // query, a starting prompt). Not decorative: clicking one primes the composer.
  const CONTEXT_CHIPS: { label: string; intent: AiIntent; message?: string }[] = [
    { label: "Plan recommendations", intent: "planning-recommendations" },
    { label: "Execution patterns", intent: "execution-patterns" },
    { label: "Reflection prompts", intent: "reflection-questions" },
    {
      label: "Prioritize my goals",
      intent: "coach-query",
      message: "Which of my goals should I prioritize right now, and why?",
    },
    {
      label: "Find what's overdue",
      intent: "coach-query",
      message: "What in my plan is overdue or at risk, and what should I do first?",
    },
  ];

  async function handleAsk() {
    await ask(intent, {
      userMessage: needsMessage ? userMessage : null,
      targetRef: needsGoal && goalId ? { collection: "goals", id: goalId } : null,
    });
    if (needsMessage) setUserMessage("");
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="AI Coach"
        description="Ask a question, generate structured recommendations, or review your weekly summaries — grounded only in your own data, never applied automatically."
        breadcrumbs={<BreadcrumbTrail />}
      />

      <Tabs defaultValue="ask">
        <TabsList>
          <TabsTrigger value="ask">Ask</TabsTrigger>
          <TabsTrigger value="weekly-summaries">Weekly Summaries</TabsTrigger>
        </TabsList>

        <TabsContent value="ask" className="space-y-6">
          <div className="flex flex-wrap gap-2" aria-label="Quick actions">
            {CONTEXT_CHIPS.map((chip) => (
              <Button
                key={chip.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  setIntent(chip.intent);
                  if (chip.message) setUserMessage(chip.message);
                }}
              >
                {chip.label}
              </Button>
            ))}
          </div>

          <Card>
            <CardContent className="space-y-4 p-4">
              <Select value={intent} onValueChange={(next) => setIntent(next as AiIntent)}>
                <SelectTrigger aria-label="What do you need">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_INTENTS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {AI_INTENT_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {needsMessage ? (
                <Textarea
                  rows={3}
                  placeholder="What's on your mind?"
                  value={userMessage}
                  onChange={(event) => setUserMessage(event.target.value)}
                />
              ) : null}

              {needsGoal ? (
                <Select value={goalId} onValueChange={setGoalId}>
                  <SelectTrigger aria-label="Goal">
                    <SelectValue placeholder="Pick a goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {goalOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              {askError ? (
                <Alert variant="danger">
                  <AlertDescription>{askError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex justify-end">
                <Button onClick={handleAsk} loading={asking} disabled={!canSubmit}>
                  <Send />
                  {needsMessage ? "Ask" : "Generate"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {status === "loading" ? (
            <Skeleton className="h-40" />
          ) : status === "error" ? (
            <ErrorState
              className="min-h-[30vh]"
              title="We couldn't load your coach history"
              description={error ?? "Please try again."}
              onRetry={reload}
            />
          ) : exchanges.length === 0 ? (
            <EmptyState
              title="No coach exchanges yet"
              description="Ask a question above to get started."
            />
          ) : (
            <div className="space-y-4" aria-live="polite" aria-busy={asking}>
              {exchanges.map((exchange) => (
                <ExchangeCard key={exchange.id} exchange={exchange} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="weekly-summaries">
          <WeeklySummariesView />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
