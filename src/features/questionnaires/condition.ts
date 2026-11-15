// import type { Condition, Question } from "@/lib/types";
// export function evaluateCondition(
//   condition: Condition | undefined,
//   answers: Record<string, unknown>,
// ): boolean {
//   if (!condition) return true;
//   const actual = answers[condition.dependsOn];
//   if (actual === undefined || actual === null || actual === "") return false;
//   switch (condition.operator) {
//     case "equals":
//       return Array.isArray(actual)
//         ? actual.includes(condition.value)
//         : String(actual).toLowerCase() ===
//             String(condition.value).toLowerCase();
//     case "not_equals":
//       return (
//         String(actual).toLowerCase() !== String(condition.value).toLowerCase()
//       );
//     case "contains":
//       return Array.isArray(actual)
//         ? actual.includes(condition.value)
//         : String(actual)
//             .toLowerCase()
//             .includes(String(condition.value).toLowerCase());
//     case "greater_than":
//       return Number(actual) > Number(condition.value);
//     case "less_than":
//       return Number(actual) < Number(condition.value);
//     default:
//       return false;
//   }
// }
// export function visibleQuestions(
//   questions: Question[],
//   answers: Record<string, unknown>,
// ) {
//   return questions.filter((q) => evaluateCondition(q.condition, answers));
// }
// export function pruneHiddenAnswers(
//   questions: Question[],
//   answers: Record<string, unknown>,
// ) {
//   const visible = new Set(
//     visibleQuestions(questions, answers).map((q) => q.id),
//   );
//   return Object.fromEntries(
//     Object.entries(answers).filter(([id]) => visible.has(id)),
//   );
// }
import type { Condition, ConditionRule, Question } from "@/lib/types";

type Answers = Record<string, unknown>;

function matchesConditionRule(
  rule: ConditionRule,
  answers: Answers,
): boolean {
  const actual = answers[rule.dependsOn];
  const expected = rule.value;

  if (actual === undefined || actual === null || actual === "") {
    return false;
  }

  switch (rule.operator) {
    case "equals":
      return Array.isArray(actual)
        ? actual.map(String).includes(String(expected))
        : String(actual).toLowerCase() === String(expected).toLowerCase();

    case "not_equals":
      return String(actual).toLowerCase() !== String(expected).toLowerCase();

    case "contains":
      return Array.isArray(actual)
        ? actual.map(String).includes(String(expected))
        : String(actual).toLowerCase().includes(String(expected).toLowerCase());

    case "greater_than":
      return Number(actual) > Number(expected);

    case "less_than":
      return Number(actual) < Number(expected);

    default:
      return false;
  }
}

export function matchesCondition(
  condition: Condition | undefined,
  answers: Answers,
): boolean {
  if (!condition || condition.rules.length === 0) return true;

  return condition.logic === "and"
    ? condition.rules.every((rule) => matchesConditionRule(rule, answers))
    : condition.rules.some((rule) => matchesConditionRule(rule, answers));
}

export function visibleQuestions(
  questions: Question[],
  answers: Answers,
): Question[] {
  return questions.filter((question) =>
    matchesCondition(question.condition, answers),
  );
}

export function pruneHiddenAnswers(
  questions: Question[],
  answers: Answers,
): Answers {
  const visibleIds = new Set(
    visibleQuestions(questions, answers).map((question) => question.id),
  );

  return Object.fromEntries(
    Object.entries(answers).filter(([questionId]) =>
      visibleIds.has(questionId),
    ),
  );
}