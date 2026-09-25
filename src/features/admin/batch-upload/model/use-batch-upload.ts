// PORTED FROM buzlee-app/src/features/admin-batch-upload/model/use-batch-upload.ts — keep in sync; see docs/admin-sync.md
// Web adaptation: `pickAndValidate(file)` takes the File from an <input> /
// drop instead of opening expo-document-picker, and reads it with
// `File.text()` instead of expo-file-system. Everything else is verbatim.
"use client";

import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { adminKeys } from "@/entities/admin";
import { businessKeys } from "@/entities/business/api/use-business";
import { flyerKeys } from "@/entities/flyer/api/use-flyer";
import { useAuth } from "@/entities/session";
import {
  createBusinessRow,
  fetchExistingFlyerKeys,
  fetchReferenceData,
  flyerDuplicateKey,
  type ReferenceData,
  type ResolvedBusinessRow,
  type ResolvedFlyerRow,
  uploadFlyerRow,
} from "../api/batch-upload-queries";
import {
  BUSINESS_REQUIRED_HEADERS,
  FLYER_REQUIRED_HEADERS,
  type RowError,
  validateHeaders,
} from "../lib/batch-row-schemas";
import { parseCsv } from "../lib/csv";
import { validateBusinessBatch, validateFlyerBatch } from "../lib/resolve-rows";

export type BatchType = "flyers" | "businesses";

export type BatchStage = "idle" | "validating" | "ready" | "uploading" | "done";

export interface BatchRowResult {
  rowNumber: number;
  label: string;
  status: "pending" | "success" | "skipped" | "failed";
  message?: string;
}

export interface RowUpdateOutcome {
  ok: boolean;
  message?: string;
}

interface BatchState {
  stage: BatchStage;
  type: BatchType;
  fileName: string | null;
  /** Raw CSV values keyed by spreadsheet row number, kept so rows can be edited and re-validated. */
  rawRows: Map<number, Record<string, string>>;
  /** Rows rejected during validation (never uploaded). */
  rowErrors: RowError[];
  /** Per-row outcome for valid rows, updated live during upload. */
  results: BatchRowResult[];
  resolvedFlyers: ResolvedFlyerRow[];
  resolvedBusinesses: ResolvedBusinessRow[];
  globalError: string | null;
}

const INITIAL_STATE: BatchState = {
  stage: "idle",
  type: "flyers",
  fileName: null,
  rawRows: new Map(),
  rowErrors: [],
  results: [],
  resolvedFlyers: [],
  resolvedBusinesses: [],
  globalError: null,
};

/** Accept list for the CSV file input (same MIME set the app passes to the document picker). */
export const CSV_ACCEPT = [
  ".csv",
  "text/csv",
  "text/comma-separated-values",
  "text/plain",
  "application/csv",
].join(",");

/** Spreadsheet row number for a data row: header is row 1, data starts at 2. */
const toRowNumber = (index: number) => index + 2;

type ComputedBatch = Pick<
  BatchState,
  "rowErrors" | "results" | "resolvedFlyers" | "resolvedBusinesses"
>;

export function useBatchUpload() {
  const [state, setState] = React.useState<BatchState>(INITIAL_STATE);
  const stateRef = React.useRef(state);
  stateRef.current = state;
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  /** Reference data + already-in-database flyer keys, cached for the life of one picked file. */
  const refsRef = React.useRef<ReferenceData | null>(null);
  const existingKeysRef = React.useRef<Set<string>>(new Set());
  const fetchedBusinessIdsRef = React.useRef<Set<string>>(new Set());

  const setType = React.useCallback((type: BatchType) => {
    setState({ ...INITIAL_STATE, type });
  }, []);

  const reset = React.useCallback(() => {
    setState((prev) => ({ ...INITIAL_STATE, type: prev.type }));
  }, []);

  /**
   * Validate every raw row against the cached reference data. Existing-flyer
   * keys are fetched lazily per business so edits that introduce a new
   * business only cost one extra query.
   */
  const computeForRaw = React.useCallback(
    async (
      rawRows: Map<number, Record<string, string>>,
      type: BatchType,
    ): Promise<ComputedBatch> => {
      const refs = refsRef.current;
      if (!refs)
        throw new Error("Reference data is not loaded — pick the file again.");

      if (type === "flyers") {
        const { rowErrors, resolved } = validateFlyerBatch(rawRows, refs);

        const newBusinessIds = [
          ...new Set(resolved.map((r) => r.businessId)),
        ].filter((id) => !fetchedBusinessIdsRef.current.has(id));
        if (newBusinessIds.length > 0) {
          const keys = await fetchExistingFlyerKeys(newBusinessIds);
          // Web fix: for…of instead of forEach (biome useIterableCallbackReturn).
          for (const key of keys) existingKeysRef.current.add(key);
          for (const id of newBusinessIds)
            fetchedBusinessIdsRef.current.add(id);
        }

        const results: BatchRowResult[] = resolved.map((r) => {
          const exists = existingKeysRef.current.has(
            flyerDuplicateKey(r.businessId, r.row.title, r.row.event_date),
          );
          return {
            rowNumber: r.rowNumber,
            label: r.row.title,
            status: exists ? "skipped" : "pending",
            message: exists
              ? "already exists (same business, title, and date)"
              : r.warnings.join("; ") || undefined,
          };
        });

        return {
          rowErrors,
          results,
          resolvedFlyers: resolved,
          resolvedBusinesses: [],
        };
      }

      const { rowErrors, resolved } = validateBusinessBatch(rawRows, refs);
      const results: BatchRowResult[] = resolved.map((r) => {
        const exists = refs.businessesByName.has(r.row.name.toLowerCase());
        return {
          rowNumber: r.rowNumber,
          label: r.row.name,
          status: exists ? "skipped" : "pending",
          message: exists
            ? "a business with this name already exists"
            : r.warnings.join("; ") || undefined,
        };
      });

      return {
        rowErrors,
        results,
        resolvedFlyers: [],
        resolvedBusinesses: resolved,
      };
    },
    [],
  );

  const pickAndValidate = React.useCallback(
    async (file: File) => {
      setState((prev) => ({
        ...INITIAL_STATE,
        type: prev.type,
        stage: "validating",
        fileName: file.name,
      }));

      try {
        const text = await file.text();
        const { headers, rows } = parseCsv(text);

        const currentType = stateRef.current.type;

        if (rows.length === 0) {
          setState((prev) => ({
            ...prev,
            stage: "idle",
            globalError: "The CSV has no data rows.",
          }));
          return;
        }

        const headerError = validateHeaders(
          headers,
          currentType === "flyers"
            ? FLYER_REQUIRED_HEADERS
            : BUSINESS_REQUIRED_HEADERS,
        );
        if (headerError) {
          setState((prev) => ({
            ...prev,
            stage: "idle",
            globalError: headerError,
          }));
          return;
        }

        refsRef.current = await fetchReferenceData();
        existingKeysRef.current = new Set();
        fetchedBusinessIdsRef.current = new Set();

        const rawRows = new Map(rows.map((row, i) => [toRowNumber(i), row]));
        const computed = await computeForRaw(rawRows, currentType);

        setState((prev) => ({ ...prev, stage: "ready", rawRows, ...computed }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          stage: "idle",
          globalError:
            error instanceof Error
              ? error.message
              : "Failed to read the CSV file.",
        }));
      }
    },
    [computeForRaw],
  );

  /**
   * Apply edited values to one row and re-validate the whole batch, so
   * duplicate detection stays correct. Returns whether the edited row is now
   * valid; the edit is applied either way so nothing typed is lost.
   */
  const updateRow = React.useCallback(
    async (
      rowNumber: number,
      values: Record<string, string>,
    ): Promise<RowUpdateOutcome> => {
      const prev = stateRef.current;
      if (prev.stage !== "ready") {
        return {
          ok: false,
          message: "Rows can only be edited before the upload starts.",
        };
      }
      const current = prev.rawRows.get(rowNumber);
      if (!current) {
        return {
          ok: false,
          message: `Row ${rowNumber} is no longer in this batch.`,
        };
      }

      const rawRows = new Map(prev.rawRows);
      rawRows.set(rowNumber, { ...current, ...values });

      try {
        const computed = await computeForRaw(rawRows, prev.type);
        setState((p) => ({ ...p, rawRows, ...computed }));
        const rowError = computed.rowErrors.find(
          (e) => e.rowNumber === rowNumber,
        );
        return rowError
          ? { ok: false, message: rowError.message }
          : { ok: true };
      } catch (error) {
        // Nothing was applied — the batch is unchanged, so the edit can be retried.
        return {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "Could not re-check the row. Try again.",
        };
      }
    },
    [computeForRaw],
  );

  /** Leave one row out of the batch. The CSV file itself is untouched. */
  const removeRow = React.useCallback(
    async (rowNumber: number) => {
      const prev = stateRef.current;
      if (prev.stage !== "ready") return;

      const rawRows = new Map(prev.rawRows);
      rawRows.delete(rowNumber);

      try {
        const computed = await computeForRaw(rawRows, prev.type);
        setState((p) => ({ ...p, rawRows, ...computed }));
      } catch (error) {
        setState((p) => ({
          ...p,
          globalError:
            error instanceof Error
              ? error.message
              : "Could not re-check the remaining rows.",
        }));
      }
    },
    [computeForRaw],
  );

  const startUpload = React.useCallback(async () => {
    if (!userId) return;

    setState((prev) => ({ ...prev, stage: "uploading" }));

    const updateResult = (
      rowNumber: number,
      patch: Partial<BatchRowResult>,
    ) => {
      setState((prev) => ({
        ...prev,
        results: prev.results.map((r) =>
          r.rowNumber === rowNumber ? { ...r, ...patch } : r,
        ),
      }));
    };

    const snapshot = stateRef.current;
    const pending = new Set(
      snapshot.results
        .filter((r) => r.status === "pending")
        .map((r) => r.rowNumber),
    );

    if (snapshot.type === "flyers") {
      for (const resolved of snapshot.resolvedFlyers) {
        if (!pending.has(resolved.rowNumber)) continue;
        try {
          await uploadFlyerRow(resolved);
          updateResult(resolved.rowNumber, { status: "success" });
        } catch (error) {
          updateResult(resolved.rowNumber, {
            status: "failed",
            message: error instanceof Error ? error.message : "upload failed",
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: adminKeys.flyers() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      // Web fix: sidebar nav counts read adminKeys.statusCounts().
      queryClient.invalidateQueries({ queryKey: adminKeys.statusCounts() });
      queryClient.invalidateQueries({ queryKey: flyerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: flyerKeys.live() });
    } else {
      for (const resolved of snapshot.resolvedBusinesses) {
        if (!pending.has(resolved.rowNumber)) continue;
        try {
          const created = await createBusinessRow(resolved, userId);
          if (created) {
            updateResult(resolved.rowNumber, { status: "success" });
          } else {
            updateResult(resolved.rowNumber, {
              status: "skipped",
              message: "a business with this name already exists",
            });
          }
        } catch (error) {
          updateResult(resolved.rowNumber, {
            status: "failed",
            message: error instanceof Error ? error.message : "upload failed",
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: adminKeys.businesses() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      // Web fix: sidebar nav counts read adminKeys.statusCounts().
      queryClient.invalidateQueries({ queryKey: adminKeys.statusCounts() });
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
    }

    setState((prev) => ({ ...prev, stage: "done" }));
  }, [queryClient, userId]);

  return {
    ...state,
    setType,
    reset,
    pickAndValidate,
    updateRow,
    removeRow,
    startUpload,
  };
}
