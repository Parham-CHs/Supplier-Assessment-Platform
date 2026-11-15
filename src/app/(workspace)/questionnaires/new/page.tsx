"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/app-provider";
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  Textarea,
  Badge,
} from "@/components/ui";
import type {
  Question,
  QuestionType,
  Questionnaire,
  QuestionnaireSection,
  Operator,
  DisplayMode,
} from "@/lib/types";
import { generateId } from "@/lib/utils";
import { Plus, Trash2, ArrowLeft, GitBranch, Save, Layers } from "lucide-react";
import { ConditionSummary } from "@/features/questionnaires/condition-summary";

const types: { value: QuestionType; label: string }[] = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "yes_no", label: "Yes / No" },
  { value: "single_choice", label: "Single choice" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "rating", label: "Rating (1–5)" },
  { value: "file", label: "File upload" },
];

export default function NewQuestionnaire() {
  const { data, addQuestionnaire } = useApp();
  const router = useRouter();

  const [title, setTitle] = useState("New supplier assessment");
  const [description, setDescription] = useState("");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("single_page");

  const [sections, setSections] = useState<QuestionnaireSection[]>(() => [
    {
      id: generateId(),
      title: "General information",
      description: "Basic information about your product and company.",
      position: 1,
    },
  ]);

  const [questions, setQuestions] = useState<Question[]>(() => [
    {
      id: generateId(),
      title: "Does your product have a valid certification?",
      type: "yes_no",
      required: true,
      options: [],
      position: 1,
      sectionId: sections[0]?.id ?? "",
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Section operations
  const addSection = () => {
    setSections((current) => [
      ...current,
      {
        id: generateId(),
        title: `Section ${current.length + 1}`,
        description: "",
        position: current.length + 1,
      },
    ]);
  };

  const updateSection = (id: string, patch: Partial<QuestionnaireSection>) => {
    setSections((current) =>
      current.map((section) =>
        section.id === id ? { ...section, ...patch } : section,
      ),
    );
  };

  const deleteSection = (id: string) => {
    if (sections.length <= 1) {
      setSaveError("A questionnaire must have at least one section.");
      return;
    }

    const remaining = sections.filter((section) => section.id !== id);
    const fallbackSectionId = remaining[0].id;

    setSections(remaining);
    setQuestions((current) =>
      current.map((question) =>
        question.sectionId === id
          ? { ...question, sectionId: fallbackSectionId }
          : question,
      ),
    );
    setSaveError("");
  };

  // Question operations
  const updateQuestion = (id: string, patch: Partial<Question>) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id ? { ...question, ...patch } : question,
      ),
    );
  };

  const addQuestion = (sectionId: string) => {
    setQuestions((current) => [
      ...current,
      {
        id: generateId(),
        title: "New question",
        type: "short_text",
        required: false,
        options: [],
        position: current.length + 1,
        sectionId,
      },
    ]);
  };

  const deleteQuestion = (id: string) => {
    setQuestions((current) =>
      current
        .filter((question) => question.id !== id)
        .map((question, index) => ({
          ...question,
          position: index + 1,
        })),
    );
  };

  // Save questionnaire
  const save = async (publish: boolean) => {
    if (!title.trim()) {
      setSaveError("Please enter a questionnaire title.");
      return;
    }

    if (!sections.length) {
      setSaveError("Add at least one section.");
      return;
    }

    if (!questions.length) {
      setSaveError("Add at least one question.");
      return;
    }

    if (sections.some((section) => !section.title.trim())) {
      setSaveError("Every section needs a title.");
      return;
    }

    if (questions.some((question) => !question.title.trim())) {
      setSaveError("Every question needs a title.");
      return;
    }

    if (
      questions.some(
        (question) =>
          ["single_choice", "multiple_choice"].includes(question.type) &&
          question.options.filter((option) => option.trim()).length < 2,
      )
    ) {
      setSaveError("Each choice question needs at least two options.");
      return;
    }

    setSaving(true);
    setSaveError("");

    const questionnaire: Questionnaire = {
      id: generateId(),
      title: title.trim(),
      description,
      status: publish ? "published" : "draft",
      version: 1,
      displayMode,
      sections: sections.map((section, index) => ({
        ...section,
        position: index + 1,
      })),
      questions: questions.map((question, index) => ({
        ...question,
        position: index + 1,
      })),
      updatedAt: new Date().toISOString(),
    };

    try {
      await addQuestionnaire(questionnaire);
      router.push("/questionnaires");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not save questionnaire.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-5">
        <Link
          href="/questionnaires"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
        >
          <ArrowLeft size={16} />
          Back to questionnaires
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Questionnaire builder</h1>
          <p className="mt-1 text-sm text-muted">
            Organize questions into sections and configure their behavior.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={saving}
            onClick={() => void save(false)}
          >
            <Save size={16} /> Save draft
          </Button>

          <Button disabled={saving} onClick={() => void save(true)}>
            Publish questionnaire
          </Button>
        </div>
      </div>

      {saveError && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {saveError}
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          {/* Questionnaire settings */}
          <Card>
            <Label>Questionnaire title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />

            <Label>Description</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this assessment about?"
            />

            <div className="mt-4">
              <Label>Display mode</Label>
              <Select
                value={displayMode}
                onChange={(e) => setDisplayMode(e.target.value as DisplayMode)}
              >
                <option value="single_page">Single page</option>
                <option value="step_by_step">Step by step</option>
              </Select>
              <p className="mt-1 text-xs text-muted">
                {displayMode === "single_page"
                  ? "Suppliers see all sections on one page."
                  : "Suppliers navigate through sections one at a time."}
              </p>
            </div>
          </Card>

          {/* Sections */}
          {sections.map((section, sectionIndex) => {
            const sectionQuestions = questions.filter(
              (question) => question.sectionId === section.id,
            );

            return (
              <Card key={section.id}>
                {/* Section heading */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={18} />
                    <Badge>Section {sectionIndex + 1}</Badge>
                    <span className="text-xs text-muted">
                      {sectionQuestions.length} questions
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    disabled={sections.length === 1}
                    onClick={() => deleteSection(section.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <Label>Section title</Label>
                <Input
                  value={section.title}
                  onChange={(e) =>
                    updateSection(section.id, { title: e.target.value })
                  }
                />

                <div className="mt-3">
                  <Label>Section description</Label>
                  <Textarea
                    rows={2}
                    value={section.description ?? ""}
                    onChange={(e) =>
                      updateSection(section.id, {
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe this section..."
                  />
                </div>

                {/* Conditional section */}
                {sectionIndex > 0 && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-3">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <GitBranch size={15} />
                      Conditional visibility
                    </div>

                    {(() => {
                      const previousSectionIds = new Set(
                        sections.slice(0, sectionIndex).map((item) => item.id),
                      );

                      const previousQuestions = questions.filter((item) =>
                        previousSectionIds.has(item.sectionId),
                      );

                      const condition = section.condition;
                      const rules = condition?.rules ?? [];

                      const getDefaultValue = (source: Question) => {
                        if (source.type === "yes_no") return "yes";
                        if (
                          source.type === "rating" ||
                          source.type === "number"
                        )
                          return 1;

                        if (
                          source.type === "single_choice" ||
                          source.type === "multiple_choice"
                        ) {
                          return source.options?.[0] ?? "";
                        }

                        return "";
                      };

                      const updateRules = (
                        nextRules: NonNullable<typeof condition>["rules"],
                      ) => {
                        updateSection(section.id, {
                          condition:
                            nextRules.length > 0
                              ? {
                                  logic: condition?.logic ?? "and",
                                  rules: nextRules,
                                }
                              : undefined,
                        });
                      };

                      const addRule = () => {
                        const source = previousQuestions.find(
                          (item) =>
                            !rules.some((rule) => rule.dependsOn === item.id),
                        );

                        if (!source) return;

                        updateRules([
                          ...rules,
                          {
                            dependsOn: source.id,
                            operator:
                              source.type === "multiple_choice"
                                ? "contains"
                                : "equals",
                            value: getDefaultValue(source),
                          },
                        ]);
                      };

                      return (
                        <>
                          {condition && (
                            <div className="mb-3 flex items-center gap-2">
                              <span className="text-xs text-muted">Match</span>

                              <Select
                                value={condition.logic}
                                onChange={(e) =>
                                  updateSection(section.id, {
                                    condition: {
                                      ...condition,
                                      logic: e.target.value as "and" | "or",
                                    },
                                  })
                                }
                              >
                                <option value="and">
                                  ALL conditions (AND)
                                </option>
                                <option value="or">ANY condition (OR)</option>
                              </Select>
                            </div>
                          )}

                          <div className="space-y-3">
                            {rules.map((rule, ruleIndex) => {
                              const sourceQuestion = previousQuestions.find(
                                (item) => item.id === rule.dependsOn,
                              );

                              const updateRule = (
                                patch: Partial<typeof rule>,
                              ) => {
                                updateRules(
                                  rules.map((item, index) =>
                                    index === ruleIndex
                                      ? { ...item, ...patch }
                                      : item,
                                  ),
                                );
                              };

                              return (
                                <div
                                  key={`${section.id}-${ruleIndex}`}
                                  className="rounded-lg border border-slate-200 bg-white p-2"
                                >
                                  <div className="grid gap-2 sm:grid-cols-3">
                                    <Select
                                      value={rule.dependsOn}
                                      onChange={(e) => {
                                        const source = previousQuestions.find(
                                          (item) => item.id === e.target.value,
                                        );

                                        if (!source) return;

                                        updateRule({
                                          dependsOn: source.id,
                                          operator:
                                            source.type === "multiple_choice"
                                              ? "contains"
                                              : "equals",
                                          value: getDefaultValue(source),
                                        });
                                      }}
                                    >
                                      {previousQuestions.map((item) => (
                                        <option key={item.id} value={item.id}>
                                          {item.title.slice(0, 35)}
                                        </option>
                                      ))}
                                    </Select>

                                    <Select
                                      value={rule.operator}
                                      onChange={(e) =>
                                        updateRule({
                                          operator: e.target.value as Operator,
                                        })
                                      }
                                    >
                                      <option value="equals">Equals</option>
                                      <option value="not_equals">
                                        Does not equal
                                      </option>
                                      <option value="contains">Contains</option>
                                      <option value="greater_than">
                                        Greater than
                                      </option>
                                      <option value="less_than">
                                        Less than
                                      </option>
                                    </Select>

                                    {(() => {
                                      const updateValue = (
                                        value: string | number,
                                      ) => updateRule({ value });

                                      if (sourceQuestion?.type === "date") {
                                        return (
                                          <Input
                                            type="date"
                                            value={String(rule.value)}
                                            onChange={(e) =>
                                              updateValue(e.target.value)
                                            }
                                          />
                                        );
                                      }

                                      if (sourceQuestion?.type === "yes_no") {
                                        return (
                                          <Select
                                            value={String(rule.value)}
                                            onChange={(e) =>
                                              updateValue(e.target.value)
                                            }
                                          >
                                            <option value="yes">Yes</option>
                                            <option value="no">No</option>
                                          </Select>
                                        );
                                      }

                                      if (
                                        sourceQuestion?.type ===
                                          "single_choice" ||
                                        sourceQuestion?.type ===
                                          "multiple_choice"
                                      ) {
                                        return (
                                          <Select
                                            value={String(rule.value)}
                                            onChange={(e) =>
                                              updateValue(e.target.value)
                                            }
                                          >
                                            {(sourceQuestion.options ?? []).map(
                                              (option) => (
                                                <option
                                                  key={option}
                                                  value={option}
                                                >
                                                  {option}
                                                </option>
                                              ),
                                            )}
                                          </Select>
                                        );
                                      }

                                      if (sourceQuestion?.type === "rating") {
                                        return (
                                          <Select
                                            value={String(rule.value)}
                                            onChange={(e) =>
                                              updateValue(
                                                Number(e.target.value),
                                              )
                                            }
                                          >
                                            {[1, 2, 3, 4, 5].map((rating) => (
                                              <option
                                                key={rating}
                                                value={rating}
                                              >
                                                {rating}
                                              </option>
                                            ))}
                                          </Select>
                                        );
                                      }

                                      if (sourceQuestion?.type === "number") {
                                        return (
                                          <Input
                                            type="number"
                                            value={String(rule.value)}
                                            onChange={(e) =>
                                              updateValue(
                                                e.target.value === ""
                                                  ? ""
                                                  : Number(e.target.value),
                                              )
                                            }
                                            placeholder="Expected number"
                                          />
                                        );
                                      }

                                      return (
                                        <Input
                                          value={String(rule.value)}
                                          onChange={(e) =>
                                            updateValue(e.target.value)
                                          }
                                          placeholder="Expected answer"
                                        />
                                      );
                                    })()}
                                  </div>

                                  <div className="mt-2 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateRules(
                                          rules.filter(
                                            (_, index) => index !== ruleIndex,
                                          ),
                                        )
                                      }
                                      className="text-xs text-red-600 hover:text-red-700"
                                    >
                                      Remove condition
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-3">
                            {!condition ? (
                              <Button
                                disabled={previousQuestions.length === 0}
                                onClick={addRule}
                              >
                                <Plus size={14} />
                                Add condition
                              </Button>
                            ) : (
                              <Button variant="secondary" onClick={addRule}>
                                <Plus size={14} />
                                Add another condition
                              </Button>
                            )}
                          </div>

                          <p className="mt-2 text-[11px] text-muted">
                            {condition?.logic === "or"
                              ? "This section appears when at least one condition matches."
                              : "This section appears only when all conditions match."}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Questions in this section */}
                <div className="mt-5 space-y-4">
                  {sectionQuestions.map((question) => {
                    const questionIndex = questions.findIndex(
                      (item) => item.id === question.id,
                    );

                    return (
                      <div
                        key={question.id}
                        className="rounded-xl border border-border p-4"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge>Question {questionIndex + 1}</Badge>

                            {question.condition && (
                              <Badge tone="blue">
                                <GitBranch size={12} className="mr-1 inline" />
                                Conditional
                              </Badge>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            onClick={() => deleteQuestion(question.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>

                        {question.condition && (
                          <div className="mb-4">
                            <ConditionSummary
                              condition={question.condition}
                              questions={questions}
                            />
                          </div>
                        )}

                        <Label>Question title</Label>
                        <Input
                          value={question.title}
                          onChange={(e) =>
                            updateQuestion(question.id, {
                              title: e.target.value,
                            })
                          }
                        />

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label>Question type</Label>
                            <Select
                              value={question.type}
                              onChange={(e) => {
                                const type = e.target.value as QuestionType;

                                updateQuestion(question.id, {
                                  type,
                                  options: [
                                    "single_choice",
                                    "multiple_choice",
                                  ].includes(type)
                                    ? ["Option 1", "Option 2"]
                                    : [],
                                });
                              }}
                            >
                              {types.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </Select>
                          </div>

                          <label className="mt-7 flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={question.required}
                              onChange={(e) =>
                                updateQuestion(question.id, {
                                  required: e.target.checked,
                                })
                              }
                            />
                            Required question
                          </label>
                        </div>

                        { ["single_choice", "multiple_choice"].includes(
                          question.type,
                        ) && (
                          <div className="mt-3">
                            <Label>Options</Label>
                            <div className="space-y-2">
                              {question.options.map((option, optionIndex) => (
                                <div
                                  key={`${question.id}-option-${optionIndex}`}
                                  className="flex items-center gap-2"
                                >
                                  <Input
                                    value={option}
                                    aria-label={`Option ${optionIndex + 1}`}
                                    placeholder={`Option ${optionIndex + 1}`}
                                    onChange={(event) =>
                                      updateQuestion(question.id, {
                                        options: question.options.map(
                                          (currentOption, index) =>
                                            index === optionIndex
                                              ? event.target.value
                                              : currentOption,
                                        ),
                                      })
                                    }
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    aria-label={`Remove option ${optionIndex + 1}`}
                                    disabled={question.options.length <= 2}
                                    onClick={() =>
                                      updateQuestion(question.id, {
                                        options: question.options.filter(
                                          (_, index) => index !== optionIndex,
                                        ),
                                      })
                                    }
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <Button
                              type="button"
                              variant="secondary"
                              className="mt-2"
                              onClick={() =>
                                updateQuestion(question.id, {
                                  options: [
                                    ...question.options,
                                    `Option ${question.options.length + 1}`,
                                  ],
                                })
                              }
                            >
                              <Plus size={15} />
                              Add option
                            </Button>
                          </div>
                        )}

                        {/* Move question */}
                        <div className="mt-3">
                          <Label>Move to section</Label>
                          <Select
                            value={question.sectionId}
                            onChange={(e) =>
                              updateQuestion(question.id, {
                                sectionId: e.target.value,
                              })
                            }
                          >
                            {sections.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.title}
                              </option>
                            ))}
                          </Select>
                        </div>

                        {/* Conditional question */}
                        {questionIndex > 0 && (
                          <div className="mt-4 rounded-xl bg-slate-50 p-3">
                            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                              <GitBranch size={15} />
                              Conditional visibility
                            </div>

                            {(() => {
                              const previousQuestions = questions.filter(
                                (item) =>
                                  item.id !== question.id &&
                                  item.position < questionIndex + 1,
                              );

                              const condition = question.condition;
                              const rules = condition?.rules ?? [];

                              const getDefaultValue = (
                                source: (typeof questions)[number],
                              ) => {
                                if (source.type === "yes_no") return "yes";
                                if (source.type === "rating") return 1;
                                if (
                                  source.type === "single_choice" ||
                                  source.type === "multiple_choice"
                                ) {
                                  return source.options?.[0] ?? "";
                                }
                                return "";
                              };

                              const updateRules = (
                                nextRules: NonNullable<
                                  typeof condition
                                >["rules"],
                              ) => {
                                updateQuestion(question.id, {
                                  condition:
                                    nextRules.length > 0
                                      ? {
                                          logic: condition?.logic ?? "and",
                                          rules: nextRules,
                                        }
                                      : undefined,
                                });
                              };

                              const addRule = () => {
                                const source = previousQuestions[0];

                                if (!source) return;

                                updateRules([
                                  ...rules,
                                  {
                                    dependsOn: source.id,
                                    operator:
                                      source.type === "multiple_choice"
                                        ? "contains"
                                        : "equals",
                                    value: getDefaultValue(source),
                                  },
                                ]);
                              };

                              return (
                                <>
                                  {condition && (
                                    <div className="mb-3 flex items-center gap-2">
                                      <span className="text-xs text-muted">
                                        Match
                                      </span>

                                      <Select
                                        value={condition.logic}
                                        onChange={(e) =>
                                          updateQuestion(question.id, {
                                            condition: {
                                              ...condition,
                                              logic: e.target.value as
                                                | "and"
                                                | "or",
                                            },
                                          })
                                        }
                                      >
                                        <option value="and">
                                          ALL conditions (AND)
                                        </option>
                                        <option value="or">
                                          ANY condition (OR)
                                        </option>
                                      </Select>
                                    </div>
                                  )}

                                  <div className="space-y-3">
                                    {rules.map((rule, ruleIndex) => {
                                      const sourceQuestion = questions.find(
                                        (item) => item.id === rule.dependsOn,
                                      );

                                      const updateRule = (
                                        patch: Partial<typeof rule>,
                                      ) => {
                                        updateRules(
                                          rules.map((item, index) =>
                                            index === ruleIndex
                                              ? { ...item, ...patch }
                                              : item,
                                          ),
                                        );
                                      };

                                      return (
                                        <div
                                          key={`${question.id}-${ruleIndex}`}
                                          className="rounded-lg border border-slate-200 bg-white p-2"
                                        >
                                          <div className="grid gap-2 sm:grid-cols-3">
                                            <Select
                                              value={rule.dependsOn}
                                              onChange={(e) => {
                                                const source =
                                                  previousQuestions.find(
                                                    (item) =>
                                                      item.id ===
                                                      e.target.value,
                                                  );

                                                if (!source) return;

                                                updateRule({
                                                  dependsOn: source.id,
                                                  operator:
                                                    source.type ===
                                                    "multiple_choice"
                                                      ? "contains"
                                                      : "equals",
                                                  value:
                                                    getDefaultValue(source),
                                                });
                                              }}
                                            >
                                              {previousQuestions.map((item) => (
                                                <option
                                                  key={item.id}
                                                  value={item.id}
                                                >
                                                  {item.title.slice(0, 35)}
                                                </option>
                                              ))}
                                            </Select>

                                            <Select
                                              value={rule.operator}
                                              onChange={(e) =>
                                                updateRule({
                                                  operator: e.target
                                                    .value as Operator,
                                                })
                                              }
                                            >
                                              <option value="equals">
                                                Equals
                                              </option>
                                              <option value="not_equals">
                                                Does not equal
                                              </option>
                                              <option value="contains">
                                                Contains
                                              </option>
                                              <option value="greater_than">
                                                Greater than
                                              </option>
                                              <option value="less_than">
                                                Less than
                                              </option>
                                            </Select>

                                            {(() => {
                                              const updateValue = (
                                                value: string | number,
                                              ) => updateRule({ value });

                                              if (
                                                sourceQuestion?.type === "date"
                                              ) {
                                                return (
                                                  <Input
                                                    type="date"
                                                    value={String(rule.value)}
                                                    onChange={(e) =>
                                                      updateValue(
                                                        e.target.value,
                                                      )
                                                    }
                                                  />
                                                );
                                              }

                                              if (
                                                sourceQuestion?.type ===
                                                "yes_no"
                                              ) {
                                                return (
                                                  <Select
                                                    value={String(rule.value)}
                                                    onChange={(e) =>
                                                      updateValue(
                                                        e.target.value,
                                                      )
                                                    }
                                                  >
                                                    <option value="yes">
                                                      Yes
                                                    </option>
                                                    <option value="no">
                                                      No
                                                    </option>
                                                  </Select>
                                                );
                                              }

                                              if (
                                                sourceQuestion?.type ===
                                                  "single_choice" ||
                                                sourceQuestion?.type ===
                                                  "multiple_choice"
                                              ) {
                                                return (
                                                  <Select
                                                    value={String(rule.value)}
                                                    onChange={(e) =>
                                                      updateValue(
                                                        e.target.value,
                                                      )
                                                    }
                                                  >
                                                    {(
                                                      sourceQuestion.options ??
                                                      []
                                                    ).map((option) => (
                                                      <option
                                                        key={option}
                                                        value={option}
                                                      >
                                                        {option}
                                                      </option>
                                                    ))}
                                                  </Select>
                                                );
                                              }

                                              if (
                                                sourceQuestion?.type ===
                                                "rating"
                                              ) {
                                                return (
                                                  <Select
                                                    value={String(rule.value)}
                                                    onChange={(e) =>
                                                      updateValue(
                                                        Number(e.target.value),
                                                      )
                                                    }
                                                  >
                                                    {[1, 2, 3, 4, 5].map(
                                                      (rating) => (
                                                        <option
                                                          key={rating}
                                                          value={rating}
                                                        >
                                                          {rating}
                                                        </option>
                                                      ),
                                                    )}
                                                  </Select>
                                                );
                                              }

                                              return (
                                                <Input
                                                  value={String(rule.value)}
                                                  onChange={(e) =>
                                                    updateValue(e.target.value)
                                                  }
                                                  placeholder="Expected answer"
                                                />
                                              );
                                            })()}
                                          </div>

                                          <div className="mt-2 flex justify-end">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                updateRules(
                                                  rules.filter(
                                                    (_, index) =>
                                                      index !== ruleIndex,
                                                  ),
                                                )
                                              }
                                              className="text-xs text-red-600 hover:text-red-700"
                                            >
                                              Remove condition
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {!condition && (
                                      <Button
                                        disabled={
                                          previousQuestions.length === 0
                                        }
                                        onClick={addRule}
                                      >
                                        <Plus size={14} />
                                        Add condition
                                      </Button>
                                    )}

                                    {condition && (
                                      <Button
                                        variant="secondary"
                                        disabled={
                                          rules.length >=
                                          previousQuestions.length
                                        }
                                        onClick={addRule}
                                      >
                                        <Plus size={14} />
                                        Add another condition
                                      </Button>
                                    )}
                                  </div>

                                  <p className="mt-2 text-[11px] text-muted">
                                    {condition?.logic === "or"
                                      ? "The question appears when at least one condition matches."
                                      : "The question appears only when all conditions match."}
                                  </p>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Button
                  variant="secondary"
                  className="mt-4 w-full border-dashed"
                  onClick={() => addQuestion(section.id)}
                >
                  <Plus size={16} />
                  Add question to this section
                </Button>
              </Card>
            );
          })}

          <Button
            variant="secondary"
            className="w-full border-dashed py-3"
            onClick={addSection}
          >
            <Plus size={16} />
            Add section
          </Button>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <h3 className="font-bold">Builder tips</h3>
            <ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-5 text-muted">
              <li>Use sections to organize related questions.</li>
              <li>Move questions between sections using the selector.</li>
              <li>Conditions can reference earlier questions.</li>
              <li>Required questions are validated when suppliers submit.</li>
              <li>
                Published questionnaires should remain immutable once assigned.
              </li>
            </ul>
          </Card>

          <Card>
            <h3 className="font-bold">Question types</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {types.map((type) => (
                <Badge key={type.value}>{type.label}</Badge>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-bold">Existing suppliers</h3>
            <p className="mt-2 text-sm text-muted">
              {data.suppliers.length} suppliers are available for assignment
              after publishing.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
