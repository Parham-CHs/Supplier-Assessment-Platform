"use client";

import { useState } from "react";
import { useApp } from "@/components/app-provider";
import {
  Button,
  Card,
  Label,
  PageHeading,
  Select,
  Badge,
  Input,
} from "@/components/ui";
import { Send, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function Assignments() {
  const { data, createAssignment } = useApp();

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<
    string | null
  >(null);

  const [questionnaireId, setQ] = useState(
    data.questionnaires.find((q) => q.status === "published")?.id ?? "",
  );

  const [supplierIds, setS] = useState<string[]>([]);
  const [productIds, setP] = useState<string[]>([]);

  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  );

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const selectedQ = data.questionnaires.find((q) => q.id === questionnaireId);

  const selectedAssignment = data.assignments.find(
    (a) => a.id === selectedAssignmentId,
  );

  // Products belonging to at least one selected supplier
  const availableProducts = data.products.filter((p) =>
    supplierIds.some((sid) =>
      data.suppliers.find((s) => s.id === sid)?.products.includes(p.id),
    ),
  );

  // Remove products that are no longer eligible
  const validProductIds = productIds.filter((id) =>
    availableProducts.some((p) => p.id === id),
  );

  const toggle = (arr: string[], id: string, set: (v: string[]) => void) => {
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  };

  const send = async () => {
    if (
      !selectedQ ||
      !supplierIds.length ||
      !validProductIds.length ||
      !deadline
    ) {
      setMessage(
        "Please select a questionnaire, suppliers, products, and deadline.",
      );
      return;
    }

    setSending(true);
    setMessage("");

    try {
      await createAssignment({
        questionnaire: selectedQ,
        supplierIds,
        productIds: validProductIds,
        deadline,
      });

      setMessage("Assignments created and notifications sent.");

      setS([]);
      setP([]);
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Could not create assignments.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeading
        title="Assignments"
        description="Send questionnaires to suppliers for specific products and track completion."
      />

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        {/* CREATE ASSIGNMENT */}
        <Card>
          <h2 className="mb-4 font-bold">Create assignment</h2>

          <div className="space-y-4">
            {/* Questionnaire */}
            <div>
              <Label>Questionnaire</Label>

              <Select
                value={questionnaireId}
                onChange={(e) => setQ(e.target.value)}
              >
                {data.questionnaires
                  .filter((q) => q.status === "published")
                  .map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title}
                    </option>
                  ))}
              </Select>
            </div>

            {/* Suppliers */}
            <div>
              <Label>Suppliers</Label>

              <div className="max-h-40 space-y-2 overflow-auto rounded-xl border border-line p-3">
                {data.suppliers
                  .filter((s) => s.status === "active")
                  .map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={supplierIds.includes(s.id)}
                        onChange={() => toggle(supplierIds, s.id, setS)}
                      />

                      {s.name}
                    </label>
                  ))}

                {!data.suppliers.some((s) => s.status === "active") && (
                  <p className="text-xs text-muted">
                    No active suppliers available.
                  </p>
                )}
              </div>
            </div>

            {/* Products */}
            <div>
              <Label>Products</Label>

              <div className="max-h-40 space-y-2 overflow-auto rounded-xl border border-line p-3">
                {!supplierIds.length ? (
                  <p className="text-xs text-muted">
                    Select suppliers first to see their available products.
                  </p>
                ) : availableProducts.length === 0 ? (
                  <p className="text-xs text-muted">
                    No products are associated with the selected suppliers.
                  </p>
                ) : (
                  availableProducts.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={productIds.includes(p.id)}
                        onChange={() => toggle(productIds, p.id, setP)}
                      />

                      {p.name}
                    </label>
                  ))
                )}
              </div>

              <p className="mt-1 text-[11px] text-muted">
                Only existing supplier/product combinations will be created.
              </p>
            </div>

            {/* Deadline */}
            <div>
              <Label>Submission deadline</Label>

              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            {/* Send */}
            <Button
              className="w-full"
              onClick={send}
              disabled={
                sending ||
                !selectedQ ||
                !supplierIds.length ||
                !validProductIds.length ||
                !deadline
              }
            >
              <Send size={16} />
              {sending ? "Sending..." : "Send assignments"}
            </Button>

            {message && (
              <p className="text-xs font-medium text-emerald-700">{message}</p>
            )}
          </div>
        </Card>

        {/* ALL ASSIGNMENTS */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold">All assignments</h2>

              <p className="mt-1 text-xs text-muted">
                {data.assignments.length} supplier-product assignments
              </p>
            </div>

            <Badge tone="blue">Live workspace data</Badge>
          </div>

          <div className="overflow-x-auto">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] table-fixed text-sm">
                <colgroup>
                  <col className="w-[14%]" />
                  <col className="w-[11%]" />
                  <col className="w-[25%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[20%]" />
                </colgroup>

                <thead className="text-xs text-muted">
                  <tr>
                    <th className="pb-3 text-left">Supplier</th>
                    <th className="pb-3 text-left">Product</th>
                    <th className="pb-3 text-left">Questionnaire</th>
                    <th className="pb-3 text-left">Deadline</th>
                    <th className="pb-3 text-left">Status</th>
                    <th className="pb-3 text-center">      Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {data.assignments.map((a) => (
                    <tr key={a.id} className="border-t border-line">
                      <td className="py-4 pr-2 font-semibold">
                        {a.supplierName}
                      </td>

                      <td className="py-4 pr-2">{a.productName}</td>

                      <td className="py-4 pr-2 text-muted">
                        {a.questionnaireTitle}
                      </td>

                      <td className="py-4 pr-2 text-muted">
                        {formatDate(a.deadline)}
                      </td>

                      <td className="py-4 pr-2">
                        <Badge
                          tone={
                            a.status === "submitted"
                              ? "green"
                              : a.status === "overdue"
                                ? "red"
                                : a.status === "in_progress"
                                  ? "blue"
                                  : "yellow"
                          }
                        >
                          {a.status.replace("_", " ")}
                        </Badge>
                      </td>

                      <td className="py-4 text-left">
                        {a.status === "submitted" && (
                          <div className="flex justify-center">
                            <Button
                              onClick={() =>
                                setSelectedAssignmentId(
                                  selectedAssignmentId === a.id ? null : a.id,
                                )
                              }
                            >
                              <Eye size={15} />
                              View answers
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {data.assignments.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-sm text-muted"
                      >
                        No assignments have been created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SUPPLIER ANSWERS - OUTSIDE THE TABLE */}
          {selectedAssignment && (
            <div className="mt-6 rounded-xl border border-line p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold">Supplier Answers</h3>

                  <p className="mt-1 text-sm text-muted">
                    {selectedAssignment.supplierName} ·{" "}
                    {selectedAssignment.productName}
                  </p>
                </div>

                <Button onClick={() => setSelectedAssignmentId(null)}>
                  Close
                </Button>
              </div>

              <div className="space-y-4">
                {(selectedAssignment.questions ?? []).map((question, index) => {
                  const answer = selectedAssignment.response?.[question.id];

                  return (
                    <div
                      key={question.id}
                      className="rounded-lg bg-surface p-4"
                    >
                      <p className="mb-2 text-sm font-semibold">
                        {index + 1}. {question.title}
                      </p>

                      <p className="whitespace-pre-wrap text-sm text-muted">
                        {answer === undefined ||
                        answer === null ||
                        answer === ""
                          ? "No answer provided"
                          : Array.isArray(answer)
                            ? answer.join(", ")
                            : typeof answer === "object"
                              ? JSON.stringify(answer)
                              : String(answer)}
                      </p>
                    </div>
                  );
                })}

                {!selectedAssignment.questions?.length && (
                  <p className="text-sm text-muted">
                    No question details found for this assignment.
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
