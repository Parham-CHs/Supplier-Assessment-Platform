import type { Condition, Operator, Question } from "@/lib/types";

const operatorLabels: Record<Operator, string> = {
  equals: "is",
  not_equals: "is not",
  contains: "contains",
  greater_than: "is greater than",
  less_than: "is less than",
};

export function ConditionSummary({
  condition,
  questions,
}: {
  condition: Condition;
  questions: Question[];
}) {
  if (!condition.rules.length) {
    return <p className="text-xs text-muted">No condition rules defined.</p>;
  }

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs">
      <p className="font-semibold text-blue-900">
        Show when {condition.logic === "and" ? "all" : "any"} conditions match
      </p>
      <ul className="mt-2 space-y-1.5 text-blue-900">
        {condition.rules.map((rule, index) => {
          const sourceQuestion = questions.find(
            (question) => question.id === rule.dependsOn,
          );
          const value = String(rule.value);

          return (
            <li key={`${rule.dependsOn}-${index}`} className="break-words">
              <span className="font-medium">
                {sourceQuestion?.title ?? "Question unavailable"}
              </span>{" "}
              {operatorLabels[rule.operator]}{" "}
              <span className="font-semibold">{value || "(empty)"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}