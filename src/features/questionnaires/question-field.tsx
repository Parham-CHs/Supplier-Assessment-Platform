"use client";
import type { Question } from "@/lib/types";
import { Input, Textarea } from "@/components/ui";
import { Download, Eye } from "lucide-react";
export function QuestionField({
  question,
  value,
  onChange,
  onFileSelect,
  onFileView,
  onFileDownload,
  fileUploading = false,
  fileOpening = false,
  fileDownloading = false,
  disabled,
}: {
  question: Question;
  value: unknown;
  onChange: (v: unknown) => void;
  onFileSelect?: (file: File) => Promise<void>;
  onFileView?: (value: unknown) => void;
  onFileDownload?: (value: unknown) => void;
  fileUploading?: boolean;
  fileOpening?: boolean;
  fileDownloading?: boolean;
  disabled?: boolean;
}) {
  const val = value ?? "";
  switch (question.type) {
    case "short_text":
      return (
        <Input
          value={String(val)}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer..."
          disabled={disabled}
        />
      );
    case "long_text":
      return (
        <Textarea
          rows={4}
          value={String(val)}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your answer..."
          disabled={disabled}
        />
      );
    case "yes_no":
      return (
        <div className="flex gap-3">
          {["yes", "no"].map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => onChange(v)}
              className={`rounded-xl border px-5 py-2.5 text-sm font-semibold capitalize ${val === v ? "border-brand bg-brand-soft text-brand" : "border-line bg-white text-muted"}`}
              disabled={disabled}
            >
              {v}
            </button>
          ))}
        </div>
      );
    case "single_choice":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {question.options.map((v) => (
            <label
              key={v}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm ${val === v ? "border-brand bg-brand-soft" : "border-line"}`}
            >
              <input
                type="radio"
                checked={val === v}
                onChange={() => onChange(v)}
                disabled={disabled}
              />
              {v}
            </label>
          ))}
        </div>
      );
    case "multiple_choice": {
      const values = Array.isArray(val) ? (val as string[]) : [];
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {question.options.map((v) => (
            <label
              key={v}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-line p-3 text-sm"
            >
              <input
                type="checkbox"
                checked={values.includes(v)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...values, v]
                      : values.filter((x) => x !== v),
                  )
                }
                disabled={disabled}
              />
              {v}
            </label>
          ))}
        </div>
      );
    }
    case "number":
      return (
        <Input
          type="number"
          value={String(val)}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
          placeholder="Enter a number"
          disabled={disabled}
        />
      );
    case "date":
      return (
        <Input
          type="date"
          value={String(val)}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
    case "rating":
      return (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => onChange(n)}
              className={`h-10 w-10 rounded-xl border text-sm font-bold ${val === n ? "border-brand bg-brand text-white" : "border-line bg-white text-muted"}`}
              disabled={disabled}
            >
              {n}
            </button>
          ))}
        </div>
      );
    case "file":
      const fileName =
        typeof val === "string"
          ? val
          : typeof val === "object" && val !== null && "name" in val
            ? String(val.name)
            : "";
      const hasUploadedFile =
        typeof val === "object" &&
        val !== null &&
        "path" in val &&
        typeof val.path === "string";
      return (
        <div>
          <Input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (onFileSelect) void onFileSelect(file);
              else onChange(file.name);
              event.target.value = "";
            }}
            disabled={disabled || fileUploading}
          />
          {fileUploading ? (
            <p role="status" className="mt-1 text-xs text-muted">
              Uploading file…
            </p>
          ) : fileName ? (
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="truncate text-xs text-muted">Attached: {fileName}</p>
              {hasUploadedFile && (onFileView || onFileDownload) && (
                <div className="flex shrink-0 items-center">
                  {onFileView && (
                    <button
                      type="button"
                      aria-label="View uploaded file"
                      title="View uploaded file"
                      onClick={() => onFileView(val)}
                      disabled={fileOpening}
                      className="rounded-lg p-2 text-muted hover:bg-gray-100 disabled:opacity-50"
                    >
                      <Eye size={16} />
                    </button>
                  )}
                  {onFileDownload && (
                    <button
                      type="button"
                      aria-label="Download uploaded file"
                      title="Download uploaded file"
                      onClick={() => onFileDownload(val)}
                      disabled={fileDownloading}
                      className="rounded-lg p-2 text-muted hover:bg-gray-100 disabled:opacity-50"
                    >
                      <Download size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : null}
          <p className="mt-1 text-xs text-muted">
            PDF, PNG, or JPEG, up to 10 MB. Demo mode stores only the filename.
          </p>
        </div>
      );
    default:
      return null;
  }
}
