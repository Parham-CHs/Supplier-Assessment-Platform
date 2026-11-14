"use client"; import { useId, useState } from "react"; import { useRouter } from "next/navigation"; import { useApp } from "@/components/app-provider"; import { Button, Card, Input, Label, Select, Textarea, Badge } from "@/components/ui"; import type { Question, QuestionType, Questionnaire, Operator } from "@/lib/types"; import { generateId } from "@/lib/utils"; import { Plus, Trash2, ArrowLeft, GitBranch, Save } from "lucide-react"; import Link from "next/link";
const types: { value: QuestionType; label: string }[] = [{ value: "short_text", label: "Short text" }, { value: "long_text", label: "Long text" }, { value: "yes_no", label: "Yes / No" }, { value: "single_choice", label: "Single choice" }, { value: "multiple_choice", label: "Multiple choice" }, { value: "number", label: "Number" }, { value: "date", label: "Date" }, { value: "rating", label: "Rating (1–5)" }, { value: "file", label: "File upload" }];
export default function NewQuestionnaire() {
    const { data, addQuestionnaire } = useApp();
    const router = useRouter();
    const [title, setTitle] = useState("New supplier assessment");
    const [description, setDescription] = useState("");
    const initialQuestionId = useId();
    const [questions, setQuestions] = useState<Question[]>([
        {
            id: initialQuestionId,
            title: "Does your product have a valid certification?",
            type: "yes_no",
            required: true,
            options: [],
            position: 1
        }
    ]);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const update = (id: string, patch: Partial<Question>) => setQuestions(qs => qs.map(q => q.id === id ? { ...q, ...patch } : q));
    const add = () => setQuestions(qs => [...qs, { id: generateId(), title: "New question", type: "short_text", required: false, options: [], position: qs.length + 1 }]);
    const save = async (publish: boolean) => {
        if (!title.trim() || !questions.length) return; setSaving(true); setSaveError("");
        const q: Questionnaire = { id: generateId(), title, description, status: publish ? "published" : "draft", version: 1, questions: questions.map((q, i) => ({ ...q, position: i + 1 })), updatedAt: new Date().toISOString() }; try { await addQuestionnaire(q); router.push("/questionnaires"); } catch (e) { setSaveError(e instanceof Error ? e.message : "Could not save questionnaire."); } finally { setSaving(false); }
    };
    return <>
        <div className="mb-5">
            <Link href="/questionnaires" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
                <ArrowLeft size={16} /> Back to questionnaires</Link>
        </div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 className="text-2xl font-bold">Questionnaire builder</h1><p className="mt-1 text-sm text-muted">Create questions and configure conditional visibility.</p>
            </div>
            <div className="flex gap-2">
                <Button variant="secondary" disabled={saving} onClick={() => void save(false)}><Save size={16} /> Save draft</Button>
                <Button disabled={saving} onClick={() => void save(true)}>Publish questionnaire</Button>
            </div>
        </div>
        {saveError && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{saveError}</p>}
        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
            <div className="space-y-4">
                <Card><Label>Questionnaire title</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} />
                    <Label>Description</Label><Textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this assessment about?" />

                </Card>
                {questions.map((q, i) =>
                    <Card key={q.id}><div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge>Question {i + 1}</Badge>{q.condition && <Badge tone="blue">
                                <GitBranch size={12} className="mr-1 inline" />Conditional</Badge>}
                        </div>
                        <Button variant="ghost" onClick={() => setQuestions(qs => qs.filter(x => x.id !== q.id))}><Trash2 size={16} />
                        </Button></div><Label>Question title</Label><Input value={q.title} onChange={e => update(q.id, { title: e.target.value })} />
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div>
                                <Label>Question type</Label>
                                <Select value={q.type} onChange={e => update(q.id, { type: e.target.value as QuestionType, options: ["single_choice", "multiple_choice"].includes(e.target.value) ? ["Option 1", "Option 2"] : [] })}>
                                    {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</Select>
                            </div>
                            <label className="mt-7 flex items-center gap-2 text-sm"><input type="checkbox" checked={q.required} onChange={e => update(q.id, { required: e.target.checked })} /> Required question</label>
                        </div>
                        {["single_choice", "multiple_choice"].includes(q.type) && <div className="mt-3"><Label>Options (comma separated)</Label><Input value={q.options.join(", ")} onChange={e => update(q.id, { options: e.target.value.split(",").map(x => x.trim()).filter(Boolean) })} /></div>}<div className="mt-4 rounded-xl bg-slate-50 p-3"><div className="mb-2 flex items-center gap-2 text-sm font-semibold"><GitBranch size={15} /> Conditional visibility</div><div className="grid gap-2 sm:grid-cols-3"><Select value={q.condition?.dependsOn ?? ""} onChange={e => update(q.id, { condition: e.target.value ? { dependsOn: e.target.value, operator: "equals", value: "yes" } : undefined })}><option value="">Always show</option>{questions.filter(x => x.id !== q.id && x.position < i + 1).map(x => <option key={x.id} value={x.id}>{x.title.slice(0, 35)}</option>)}</Select><Select disabled={!q.condition} value={q.condition?.operator ?? "equals"} onChange={e => q.condition && update(q.id, { condition: { ...q.condition, operator: e.target.value as Operator } })}><option value="equals">Equals</option><option value="not_equals">Does not equal</option><option value="contains">Contains</option><option value="greater_than">Greater than</option><option value="less_than">Less than</option></Select><Input disabled={!q.condition} value={String(q.condition?.value ?? "")} onChange={e => q.condition && update(q.id, { condition: { ...q.condition, value: e.target.value } })} placeholder="Expected answer" /></div><p className="mt-2 text-[11px] text-muted">The question appears only when the selected earlier question matches this condition.</p></div></Card>)}<Button variant="secondary" className="w-full border-dashed py-3" onClick={add}><Plus size={16} /> Add question</Button></div><div className="space-y-4"><Card><h3 className="font-bold">Builder tips</h3><ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-5 text-muted"><li>Use Yes/No questions to create simple branches.</li><li>Conditions can reference earlier questions only.</li><li>Required questions are validated when suppliers submit.</li><li>Published questionnaires should be treated as immutable once assigned.</li></ul></Card><Card><h3 className="font-bold">Question types</h3><div className="mt-3 flex flex-wrap gap-2">
                            {types.map(t => <Badge key={t.value}>{t.label}</Badge>)}
                        </div>
                        </Card>
                <Card>
                    <h3 className="font-bold">Existing suppliers</h3><p className="mt-2 text-sm text-muted">{data.suppliers.length} suppliers are available for assignment after publishing.</p>
                </Card>
            </div>
        </div></>
}
