import { Alert, AlertDescription, Badge, Card, CardContent } from "@/components/ui";
import { AI_INTENT_LABEL, type CoachExchange } from "../schema";

export function ExchangeCard({ exchange }: { exchange: CoachExchange }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{AI_INTENT_LABEL[exchange.intent]}</Badge>
          <span className="text-subtle text-xs">
            {new Date(exchange.createdAt).toLocaleString()}
          </span>
        </div>

        {exchange.userMessage ? (
          <p className="text-muted text-sm italic break-words">{`"${exchange.userMessage}"`}</p>
        ) : null}

        <p className="text-sm break-words whitespace-pre-wrap">{exchange.answer}</p>

        {exchange.assumptions.length > 0 ? (
          <div>
            <h4 className="text-subtle text-xs font-medium">Assumptions</h4>
            <ul className="list-disc space-y-0.5 pl-5 text-sm">
              {exchange.assumptions.map((assumption, index) => (
                <li key={index} className="break-words">
                  {assumption}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {exchange.suggestedActions.length > 0 ? (
          <div>
            <h4 className="text-subtle text-xs font-medium">Suggested actions</h4>
            <ul className="space-y-1 text-sm">
              {exchange.suggestedActions.map((action) => (
                <li key={action.id} className="break-words">
                  <span className="font-medium">{action.label}</span> — {action.description}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {exchange.disclaimers.length > 0 ? (
          <Alert variant="warning">
            <AlertDescription>{exchange.disclaimers.join(" ")}</AlertDescription>
          </Alert>
        ) : null}

        {exchange.influencedBy.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {exchange.influencedBy.map((ref) => (
              <Badge key={`${ref.collection}-${ref.id}`} variant="neutral">
                {ref.label}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
