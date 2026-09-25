"use client";

import {
  CheckCircle2,
  Circle,
  Download,
  FileUp,
  Loader2,
  MinusCircle,
  XCircle,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useConfirm } from "@/features/admin/dialogs/use-confirm";
import { ChoiceChips } from "@/features/admin/flyer-wizard/ui/components/choice-chips";
import { StatusChip } from "@/features/admin/shell/status-chip";
import { cn } from "@/lib/utils";
import { downloadCsvTemplate } from "../lib/csv-template";
import {
  type BatchRowResult,
  type BatchType,
  CSV_ACCEPT,
  useBatchUpload,
} from "../model/use-batch-upload";
import { ReviewRowCard, type ReviewRowField } from "./review-row-card";
import { RowEditSheet } from "./row-edit-sheet";
import { FIELD_DEFS } from "./row-field-defs";
import { ROW_STATUS_CHIP, type RowStatus } from "./row-status";

const TYPE_OPTIONS: { value: BatchType; label: string }[] = [
  { value: "flyers", label: "Flyers" },
  { value: "businesses", label: "Businesses" },
];

const TYPE_LABELS: Record<BatchType, string> = {
  flyers: "Flyers",
  businesses: "Businesses",
};

const RESULT_ICON: Record<
  BatchRowResult["status"],
  { icon: typeof Circle; className: string }
> = {
  success: { icon: CheckCircle2, className: "text-teal-700" },
  failed: { icon: XCircle, className: "text-destructive" },
  skipped: { icon: MinusCircle, className: "text-muted-foreground" },
  pending: { icon: Circle, className: "text-muted-foreground" },
};

function CountChip({ status, count }: { status: RowStatus; count: number }) {
  const chip = ROW_STATUS_CHIP[status];
  return (
    <StatusChip
      label={`${count} ${chip.label.toLowerCase()}`}
      variant={chip.variant}
    />
  );
}

/** Compact per-row line for the upload progress and done stages. */
function ResultRow({ result }: { result: BatchRowResult }) {
  const { icon: Icon, className } = RESULT_ICON[result.status];
  return (
    <li className="flex items-start gap-2 py-1.5">
      <Icon className={cn("mt-0.5 size-4 shrink-0", className)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          Row {result.rowNumber}: {result.label}
        </p>
        {result.message ? (
          <p className="text-xs text-muted-foreground">{result.message}</p>
        ) : null}
      </div>
    </li>
  );
}

function SectionHeader({ title, helper }: { title: string; helper?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {helper ? (
        <p className="text-sm text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}

/** Dashed drop target + file picker for the CSV. */
function CsvDropzone({
  busy,
  onFile,
}: {
  busy: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: drop target wrapping a real button
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border bg-card",
        busy && "opacity-60",
      )}
      onDragLeave={() => setDragging(false)}
      onDragOver={(event) => {
        event.preventDefault();
        if (!busy) setDragging(true);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!busy) handleFiles(event.dataTransfer.files);
      }}
    >
      <FileUp className="size-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Drag a CSV here, or choose a file
      </p>
      <input
        accept={CSV_ACCEPT}
        className="hidden"
        disabled={busy}
        onChange={(event) => handleFiles(event.target.files)}
        ref={inputRef}
        type="file"
      />
      <Button
        className="bg-foreground text-background hover:bg-foreground/90"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        {busy ? <Loader2 className="animate-spin" /> : <FileUp />}
        {busy ? "Validating…" : "Choose CSV file"}
      </Button>
    </div>
  );
}

/**
 * Web port of mobile `BatchUploadScreen`: pick Flyers / Businesses, drop a
 * CSV, review every row (edit / remove / needs-fix / skipped duplicates),
 * then upload row by row with live per-row results. All state and rules
 * live in the ported `useBatchUpload` hook.
 */
export function BatchUploadScreen() {
  const {
    stage,
    type,
    fileName,
    rawRows,
    rowErrors,
    results,
    globalError,
    setType,
    reset,
    pickAndValidate,
    updateRow,
    removeRow,
    startUpload,
  } = useBatchUpload();
  const { confirm, dialog } = useConfirm();

  const [editingRow, setEditingRow] = useState<number | null>(null);

  const pendingRows = results.filter((r) => r.status === "pending");
  const skippedRows = results.filter((r) => r.status === "skipped");
  const successCount = results.filter((r) => r.status === "success").length;
  const failedCount = results.filter((r) => r.status === "failed").length;
  const isReview = stage === "ready";
  const isBusy = stage === "validating" || stage === "uploading";
  const typeLabel = TYPE_LABELS[type].toLowerCase();

  const rawFor = useCallback(
    (rowNumber: number) => rawRows.get(rowNumber) ?? {},
    [rawRows],
  );

  const displayTitle = (rowNumber: number) => {
    const raw = rawFor(rowNumber);
    const title = type === "flyers" ? raw.title : raw.name;
    return title?.trim() || `Row ${rowNumber}`;
  };

  const displayMeta = (rowNumber: number) => {
    const raw = rawFor(rowNumber);
    const parts =
      type === "flyers"
        ? [raw.business_name, raw.event_date]
        : [raw.category, raw.town];
    return parts.filter((p) => p?.trim()).join(" · ") || undefined;
  };

  const displayFields = (rowNumber: number): ReviewRowField[] => {
    const raw = rawFor(rowNumber);
    return FIELD_DEFS[type]
      .map((def) => ({ label: def.label, value: (raw[def.key] ?? "").trim() }))
      .filter((field) => field.value.length > 0);
  };

  async function confirmRemove(rowNumber: number) {
    const ok = await confirm({
      title: `Remove row ${rowNumber}?`,
      description:
        "It will be left out of this upload. The CSV file is not changed.",
      ctaLabel: "Remove",
      destructive: true,
    });
    if (ok) void removeRow(rowNumber);
  }

  async function confirmStartOver() {
    if (rawRows.size === 0) {
      reset();
      return;
    }
    const ok = await confirm({
      title: "Choose a different file?",
      description: "Edits and removed rows in this batch will be reset.",
      ctaLabel: "Continue",
    });
    if (ok) reset();
  }

  const reviewCard = (
    rowNumber: number,
    status: RowStatus,
    message?: string,
  ) => (
    <ReviewRowCard
      fields={displayFields(rowNumber)}
      key={rowNumber}
      message={message}
      meta={displayMeta(rowNumber)}
      onEdit={() => setEditingRow(rowNumber)}
      onRemove={() => confirmRemove(rowNumber)}
      rowNumber={rowNumber}
      status={status}
      title={displayTitle(rowNumber)}
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
        {stage === "idle" || stage === "validating" ? (
          <>
            <p className="text-sm text-muted-foreground">
              Every row is checked and shown for review before anything uploads.
              Upload businesses first, then flyers — each flyer row references
              its business by name.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <ChoiceChips
                aria-label="Batch type"
                disabled={isBusy}
                onChange={setType}
                options={TYPE_OPTIONS}
                value={type}
              />
              <Button
                disabled={isBusy}
                onClick={() => downloadCsvTemplate(type)}
                size="sm"
                type="button"
                variant="outline"
              >
                <Download />
                {TYPE_LABELS[type]} template
              </Button>
            </div>

            <CsvDropzone busy={isBusy} onFile={pickAndValidate} />
          </>
        ) : null}

        {globalError ? (
          <Card className="border-destructive/40">
            <CardContent className="py-4">
              <p className="text-sm text-destructive">{globalError}</p>
            </CardContent>
          </Card>
        ) : null}

        {isReview ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{fileName ?? "CSV"}</CardTitle>
                <CardDescription>
                  {rawRows.size} row{rawRows.size === 1 ? "" : "s"} · review
                  before uploading
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <CountChip count={pendingRows.length} status="ready" />
                  {skippedRows.length > 0 ? (
                    <CountChip count={skippedRows.length} status="skipped" />
                  ) : null}
                  {rowErrors.length > 0 ? (
                    <StatusChip
                      label={`${rowErrors.length} need${rowErrors.length === 1 ? "s" : ""} fixes`}
                      variant={ROW_STATUS_CHIP["needs-fix"].variant}
                    />
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {rowErrors.length > 0 ? (
              <section className="flex flex-col gap-3">
                <SectionHeader
                  helper="These rows won't upload. Edit them here, or fix the spreadsheet and pick the file again."
                  title="Needs attention"
                />
                {rowErrors.map((error) =>
                  reviewCard(error.rowNumber, "needs-fix", error.message),
                )}
              </section>
            ) : null}

            {pendingRows.length > 0 ? (
              <section className="flex flex-col gap-3">
                <SectionHeader
                  helper="Expand a row to check its details before uploading."
                  title="Ready to upload"
                />
                {pendingRows.map((row) =>
                  reviewCard(row.rowNumber, "ready", row.message),
                )}
              </section>
            ) : null}

            {skippedRows.length > 0 ? (
              <details className="group flex flex-col gap-3">
                <summary className="cursor-pointer list-none text-sm font-semibold text-muted-foreground select-none hover:text-foreground">
                  Skipped duplicates ({skippedRows.length})
                </summary>
                <div className="mt-3 flex flex-col gap-3">
                  {skippedRows.map((row) =>
                    reviewCard(row.rowNumber, "skipped", row.message),
                  )}
                </div>
              </details>
            ) : null}
          </>
        ) : null}

        {stage === "uploading" || stage === "done" ? (
          <Card>
            <CardHeader>
              <CardTitle>{fileName ?? "CSV"}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {stage === "uploading" ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Uploading… {successCount + failedCount} of{" "}
                    {pendingRows.length + successCount + failedCount}
                  </p>
                </div>
              ) : null}

              {stage === "done" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    <CountChip count={successCount} status="uploaded" />
                    {failedCount > 0 ? (
                      <CountChip count={failedCount} status="failed" />
                    ) : null}
                    {skippedRows.length > 0 ? (
                      <CountChip count={skippedRows.length} status="skipped" />
                    ) : null}
                  </div>
                  <Button
                    className="self-start"
                    onClick={reset}
                    type="button"
                    variant="outline"
                  >
                    Upload another file
                  </Button>
                </div>
              ) : null}

              {results.length > 0 ? (
                <ul className="divide-y divide-border">
                  {results.map((result) => (
                    <ResultRow key={result.rowNumber} result={result} />
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {!isReview &&
        rowErrors.length > 0 &&
        stage !== "idle" &&
        stage !== "validating" ? (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle>Rows with errors</CardTitle>
              <CardDescription>
                These rows were not uploaded. Fix them in the spreadsheet and
                re-upload — rows that already succeeded are skipped
                automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {rowErrors.map((error) => (
                  <li
                    className="flex items-start gap-2 py-1.5"
                    key={error.rowNumber}
                  >
                    <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    <p className="flex-1 text-sm text-foreground">
                      Row {error.rowNumber}: {error.message}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {isReview ? (
        <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-6 py-4">
            <Button
              className="text-muted-foreground"
              onClick={confirmStartOver}
              type="button"
              variant="ghost"
            >
              Choose a different file
            </Button>
            <Button
              className="bg-foreground text-background hover:bg-foreground/90"
              disabled={pendingRows.length === 0}
              onClick={startUpload}
              type="button"
            >
              Upload {pendingRows.length} {typeLabel}
            </Button>
          </div>
        </div>
      ) : null}

      <RowEditSheet
        confirm={confirm}
        initialValues={editingRow != null ? rawFor(editingRow) : null}
        onClose={() => setEditingRow(null)}
        onSave={(values) =>
          editingRow != null
            ? updateRow(editingRow, values)
            : Promise.resolve({ ok: false, message: "No row selected." })
        }
        rowNumber={editingRow}
        type={type}
      />
      {dialog}
    </div>
  );
}
