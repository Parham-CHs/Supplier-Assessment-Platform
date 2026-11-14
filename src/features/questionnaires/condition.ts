import type {Condition,Question} from "@/lib/types";
export function evaluateCondition(condition:Condition|undefined,answers:Record<string,unknown>):boolean{
 if(!condition)return true;const actual=answers[condition.dependsOn];if(actual===undefined||actual===null||actual==="")return false;
 switch(condition.operator){case "equals":return Array.isArray(actual)?actual.includes(condition.value):String(actual).toLowerCase()===String(condition.value).toLowerCase();case "not_equals":return String(actual).toLowerCase()!==String(condition.value).toLowerCase();case "contains":return Array.isArray(actual)?actual.includes(condition.value):String(actual).toLowerCase().includes(String(condition.value).toLowerCase());case "greater_than":return Number(actual)>Number(condition.value);case "less_than":return Number(actual)<Number(condition.value);default:return false;}
}
export function visibleQuestions(questions:Question[],answers:Record<string,unknown>){return questions.filter(q=>evaluateCondition(q.condition,answers));}
export function pruneHiddenAnswers(questions:Question[],answers:Record<string,unknown>){const visible=new Set(visibleQuestions(questions,answers).map(q=>q.id));return Object.fromEntries(Object.entries(answers).filter(([id])=>visible.has(id)));}
