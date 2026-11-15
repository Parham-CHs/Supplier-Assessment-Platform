"use client";
import { useParams } from "next/navigation";
import { useApp } from "@/components/app-provider";
import { Card, PageHeading, Badge } from "@/components/ui";
import Link from "next/link";
export default function QuestionnaireDetail() {
  const { id } = useParams<{ id: string }>();
  const { data } = useApp();
  const q = data.questionnaires.find((x) => x.id === id);
  if (!q) return <Card>Questionnaire not found.</Card>;
  return (
    <>
      <PageHeading title={q.title} description={q.description} />
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">Question list</h2>
          <Badge tone={q.status === "published" ? "green" : "yellow"}>
            {q.status}
          </Badge>
        </div>
        <div className="space-y-3">
          {q.questions.map((x, i) => (
            <div key={x.id} className="rounded-xl border border-line p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {i + 1}. {x.title}
                </span>
                <Badge>{x.type.replace("_", " ")}</Badge>
              </div>
              <div className="mt-2 flex gap-2 text-xs text-muted">
                {x.required ? "Required" : "Optional"}
                {x.condition && (
                  <span>
                    {/* · Conditional on {x.condition.dependsOn}{" "}
                    {x.condition.operator} {String(x.condition.value)} */}
                    · Conditional ({x.condition.logic.toUpperCase()}):{" "}
                    {x.condition.rules.length} rule
                    {x.condition.rules.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          This version is read-only in the demo once published. Create a new
          questionnaire version to change a live assessment.
        </p>
        <Link
          href="/assignments"
          className="mt-4 inline-block text-sm font-semibold text-brand"
        >
          Go to assignments →
        </Link>
      </Card>
    </>
  );
}
