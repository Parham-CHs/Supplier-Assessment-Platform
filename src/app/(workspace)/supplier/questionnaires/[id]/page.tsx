"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/app-provider";
import { Card, Button, Badge } from "@/components/ui";
import { QuestionField } from "@/features/questionnaires/question-field";
import {
  pruneHiddenAnswers,
  visibleQuestions,
} from "@/features/questionnaires/condition";
import { ArrowLeft, Save, Send, ChevronLeft, ChevronRight } from "lucide-react";

type SectionCondition = {
  dependsOn: string;
  operator: string;
  value: string | number | boolean;
};

function matchesCondition(
  condition: SectionCondition | undefined,
  answers: Record<string, unknown>,
) {
  if (!condition) return true;

  const actual = answers[condition.dependsOn];
  const expected = String(condition.value);

  if (actual === undefined || actual === null) return false;

  switch (condition.operator) {
    case "equals":
      return String(actual) === expected;

    case "not_equals":
      return String(actual) !== expected;

    case "contains":
      return Array.isArray(actual)
        ? actual.map(String).includes(expected)
        : String(actual).includes(expected);

    case "greater_than":
      return Number(actual) > Number(condition.value);

    case "less_than":
      return Number(actual) < Number(condition.value);

    default:
      return false;
  }
}

export default function AnswerQuestionnaire() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, saveResponse, supplierId } = useApp();

  const assignment = data.assignments.find(
    (a) => a.id === id && a.supplierId === (supplierId ?? "sup-samsung"),
  );

  const baseQuestionnaire = data.questionnaires.find(
    (q) => q.id === assignment?.questionnaireId,
  );

  const questionnaire =
    baseQuestionnaire && assignment
      ? {
          ...baseQuestionnaire,
          version: assignment.questionnaireVersion ?? baseQuestionnaire.version,
          displayMode: assignment.displayMode ?? baseQuestionnaire.displayMode,
          sections: assignment.sections?.length
            ? assignment.sections
            : baseQuestionnaire.sections,
          questions: assignment.questions?.length
            ? assignment.questions
            : baseQuestionnaire.questions,
        }
      : baseQuestionnaire;

  const [answers, setAnswers] = useState<Record<string, unknown>>(
    assignment?.response ?? {},
  );
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  const visible = useMemo(
    () =>
      questionnaire ? visibleQuestions(questionnaire.questions, answers) : [],
    [questionnaire, answers],
  );

  const sections = useMemo(() => {
    if (!questionnaire) return [];

    if (questionnaire.sections?.length) {
      return questionnaire.sections;
    }

    return [
      {
        id: "__default",
        title: "Assessment questions",
        description: "",
        position: 1,
      },
    ];
  }, [questionnaire]);

  const visibleSections = useMemo(
    () =>
      sections.filter((section) =>
        matchesCondition(section.condition, answers),
      ),
    [sections, answers],
  );

  if (!assignment || !questionnaire) {
    return <Card>Assignment not found or you do not have access.</Card>;
  }

  const submitted = assignment.status === "submitted";
  const stepByStep = questionnaire.displayMode === "step_by_step";

  const safeStep = Math.min(
    currentStep,
    Math.max(visibleSections.length - 1, 0),
  );

  const activeSection = visibleSections[safeStep];

  const questionsForSection = (sectionId: string) =>
    visible.filter((q) =>
      sectionId === "__default"
        ? true
        : q.sectionId === sectionId ||
          (!q.sectionId && sectionId === sections[0]?.id),
    );

  const update = (qid: string, value: unknown) => {
    setAnswers((a) =>
      pruneHiddenAnswers(questionnaire.questions, {
        ...a,
        [qid]: value,
      }),
    );
    setError("");
  };

  const save = async (submit: boolean) => {
    const cleaned = pruneHiddenAnswers(questionnaire.questions, answers);

    // Only questions in currently visible sections are applicable.
    const applicableQuestions = visibleSections.flatMap((section) =>
      questionsForSection(section.id),
    );

    if (submit) {
      const missing = applicableQuestions.filter(
        (q) =>
          q.required &&
          (cleaned[q.id] === undefined ||
            cleaned[q.id] === "" ||
            (Array.isArray(cleaned[q.id]) &&
              !(cleaned[q.id] as unknown[]).length)),
      );

      if (missing.length) {
        setError(
          `Please answer required question(s): ${missing
            .map((q) => q.title)
            .join(", ")}`,
        );

        return;
      }
    }

    // Preserve all answers in drafts. On submission, exclude hidden sections.
    const finalAnswers = submit
      ? Object.fromEntries(
          applicableQuestions
            .filter((q) => cleaned[q.id] !== undefined)
            .map((q) => [q.id, cleaned[q.id]]),
        )
      : cleaned;

    try {
      await saveResponse(id, finalAnswers, submit);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save your response.",
      );
      return;
    }

    setError(submit ? "Your response has been submitted." : "Draft saved.");

    if (submit) {
      router.push("/supplier");
    }
  };

  const renderQuestion = (q: (typeof visible)[number], index: number) => (
    <div key={q.id}>
      <div className="mb-2 flex items-start gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-brand-soft text-xs font-bold text-brand">
          {index + 1}
        </span>

        <div>
          <h3 className="text-sm font-semibold">
            {q.title} {q.required && <span className="text-red-500">*</span>}
          </h3>

          {q.description && (
            <p className="mt-1 text-xs text-muted">{q.description}</p>
          )}
        </div>
      </div>

      <div className="pl-8">
        <QuestionField
          question={q}
          value={answers[q.id]}
          onChange={(value) => update(q.id, value)}
          disabled={submitted}
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="mb-5">
        <Link
          href="/supplier"
          className="inline-flex items-center gap-2 text-sm text-muted"
        >
          <ArrowLeft size={16} />
          Back to portal
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{questionnaire.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {assignment.productName} · Due {assignment.deadline}
          </p>
        </div>

        <Badge tone={submitted ? "green" : "blue"}>
          {submitted ? "Submitted" : "Response in progress"}
        </Badge>
      </div>

      <Card>
        <div className="mb-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">Assessment questions</h2>
              <p className="mt-1 text-xs text-muted">
                {visible.length} of {questionnaire.questions.length} questions
                currently applicable
              </p>
            </div>

            <div className="h-2 w-28 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand"
                style={{
                  width: `${
                    questionnaire.questions.length
                      ? Math.round(
                          (Object.keys(answers).length /
                            questionnaire.questions.length) *
                            100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {stepByStep && visibleSections.length > 0 && (
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-xs text-muted">
              <span>
                Section {safeStep + 1} of {visibleSections.length}
              </span>
              <span>
                {Math.round(((safeStep + 1) / visibleSections.length) * 100)}%
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{
                  width: `${((safeStep + 1) / visibleSections.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="space-y-8">
          {stepByStep ? (
            activeSection ? (
              <section>
                <div className="mb-5 border-b border-line pb-4">
                  <h3 className="text-lg font-bold">{activeSection.title}</h3>

                  {activeSection.description && (
                    <p className="mt-1 text-sm text-muted">
                      {activeSection.description}
                    </p>
                  )}
                </div>

                <div className="space-y-7">
                  {questionsForSection(activeSection.id).map((q) =>
                    renderQuestion(q, visible.indexOf(q)),
                  )}
                </div>

                {questionsForSection(activeSection.id).length === 0 && (
                  <p className="text-sm text-muted">
                    There are no applicable questions in this section.
                  </p>
                )}
              </section>
            ) : (
              <p className="text-sm text-muted">
                There are no applicable sections.
              </p>
            )
          ) : (
            visibleSections.map((section) => {
              const sectionQuestions = questionsForSection(section.id);

              return (
                <section key={section.id}>
                  <div className="mb-5 border-b border-line pb-4">
                    <h3 className="text-lg font-bold">{section.title}</h3>

                    {section.description && (
                      <p className="mt-1 text-sm text-muted">
                        {section.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-7">
                    {sectionQuestions.map((q) =>
                      renderQuestion(q, visible.indexOf(q)),
                    )}
                  </div>

                  {sectionQuestions.length === 0 && (
                    <p className="text-sm text-muted">
                      There are no applicable questions in this section.
                    </p>
                  )}
                </section>
              );
            })
          )}
        </div>

        {error && (
          <p
            className={`mt-5 text-sm ${
              error.includes("submitted") || error.includes("saved")
                ? "text-emerald-700"
                : "text-red-600"
            }`}
          >
            {error}
          </p>
        )}

        {(stepByStep || !submitted) && (
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            {stepByStep ? (
              <Button
                variant="secondary"
                disabled={safeStep === 0}
                onClick={() => {
                  setCurrentStep((step) => Math.max(0, step - 1));
                  setError("");
                }}
              >
                <ChevronLeft size={16} />
                Previous
              </Button>
            ) : (
              <div />
            )}

            <div className="flex flex-wrap justify-end gap-2">
              {!submitted && (
                <>
                  <Button variant="secondary" onClick={() => save(false)}>
                    <Save size={16} />
                    Save draft
                  </Button>

                  {stepByStep && safeStep < visibleSections.length - 1 ? (
                    <Button
                      onClick={() => {
                        setCurrentStep((step) =>
                          Math.min(step + 1, visibleSections.length - 1),
                        );
                        setError("");
                      }}
                    >
                      Next
                      <ChevronRight size={16} />
                    </Button>
                  ) : (
                    <Button onClick={() => save(true)}>
                      <Send size={16} />
                      Submit response
                    </Button>
                  )}
                </>
              )}

              {submitted &&
                stepByStep &&
                safeStep < visibleSections.length - 1 && (
                  <Button
                    onClick={() =>
                      setCurrentStep((step) =>
                        Math.min(step + 1, visibleSections.length - 1),
                      )
                    }
                  >
                    Next
                    <ChevronRight size={16} />
                  </Button>
                )}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
