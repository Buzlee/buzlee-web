// PORTED FROM buzlee-app/src/features/admin-batch-upload/lib/resolve-rows.ts — keep in sync; see docs/admin-sync.md
import {
  flyerDuplicateKey,
  type ReferenceData,
  type ResolvedBusinessRow,
  type ResolvedFlyerRow,
} from "../api/batch-upload-queries";
import {
  businessRowSchema,
  flyerRowSchema,
  formatZodError,
  type RowError,
} from "./batch-row-schemas";

/**
 * Pure row → resolved-row logic shared by the initial CSV validation and by
 * per-row edits on the review screen. Batch-level concerns (in-file duplicate
 * detection, already-in-database checks) live in the batch validators below so
 * a single edited row can be re-checked against the whole file.
 */

export type RowResolution<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

export function resolveFlyerRow(
  raw: Record<string, string>,
  refs: ReferenceData,
): RowResolution<Omit<ResolvedFlyerRow, "rowNumber">> {
  const parsed = flyerRowSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: formatZodError(parsed.error) };
  }
  const row = parsed.data;
  const warnings: string[] = [];

  const businessMatches =
    refs.businessesByName.get(row.business_name.toLowerCase()) ?? [];
  const approved = businessMatches.filter((b) => b.status === "approved");
  if (approved.length === 0) {
    return {
      ok: false,
      message:
        businessMatches.length > 0
          ? `business "${row.business_name}" exists but is not approved`
          : `business "${row.business_name}" not found — upload it via the Businesses batch (or Create Business) first`,
    };
  }
  if (approved.length > 1) {
    return {
      ok: false,
      message: `multiple approved businesses named "${row.business_name}" — cannot resolve`,
    };
  }

  const categoryId = refs.flyerCategoriesByName.get(row.category.toLowerCase());
  if (!categoryId) {
    return {
      ok: false,
      message: `flyer category "${row.category}" not found`,
    };
  }

  let townId: string | null = null;
  if (row.town) {
    townId = refs.townsByName.get(row.town.toLowerCase()) ?? null;
    if (!townId) warnings.push(`town "${row.town}" not found — left blank`);
  }

  const tagIds: string[] = [];
  for (const tag of row.tags) {
    const tagId = refs.tagsByName.get(tag.toLowerCase());
    if (tagId) tagIds.push(tagId);
    else warnings.push(`tag "${tag}" not found — skipped`);
  }

  return {
    ok: true,
    value: {
      row,
      businessId: approved[0].id,
      categoryId,
      townId,
      tagIds,
      warnings,
    },
  };
}

export function resolveBusinessRow(
  raw: Record<string, string>,
  refs: ReferenceData,
): RowResolution<Omit<ResolvedBusinessRow, "rowNumber">> {
  const parsed = businessRowSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: formatZodError(parsed.error) };
  }
  const row = parsed.data;
  const warnings: string[] = [];

  const categoryId = refs.businessCategoriesByName.get(
    row.category.toLowerCase(),
  );
  if (!categoryId) {
    return {
      ok: false,
      message: `business category "${row.category}" not found`,
    };
  }

  let townId: string | null = null;
  if (row.town) {
    townId = refs.townsByName.get(row.town.toLowerCase()) ?? null;
    if (!townId) warnings.push(`town "${row.town}" not found — left blank`);
  }

  return { ok: true, value: { row, categoryId, townId, warnings } };
}

/** Raw CSV rows keyed by their spreadsheet row number (header = row 1, data starts at 2). */
export type RawRowMap = ReadonlyMap<number, Record<string, string>>;

const sortedRowNumbers = (rawRows: RawRowMap) =>
  [...rawRows.keys()].sort((a, b) => a - b);

export function validateFlyerBatch(
  rawRows: RawRowMap,
  refs: ReferenceData,
): { rowErrors: RowError[]; resolved: ResolvedFlyerRow[] } {
  const rowErrors: RowError[] = [];
  const resolved: ResolvedFlyerRow[] = [];
  const seenKeys = new Set<string>();

  for (const rowNumber of sortedRowNumbers(rawRows)) {
    // Web fix: `?? {}` instead of `!` — the key came from the map itself.
    const result = resolveFlyerRow(rawRows.get(rowNumber) ?? {}, refs);
    if (!result.ok) {
      rowErrors.push({ rowNumber, message: result.message });
      continue;
    }

    const key = flyerDuplicateKey(
      result.value.businessId,
      result.value.row.title,
      result.value.row.event_date,
    );
    if (seenKeys.has(key)) {
      rowErrors.push({
        rowNumber,
        message: "duplicate of an earlier row (same business, title, and date)",
      });
      continue;
    }
    seenKeys.add(key);

    resolved.push({ ...result.value, rowNumber });
  }

  return { rowErrors, resolved };
}

export function validateBusinessBatch(
  rawRows: RawRowMap,
  refs: ReferenceData,
): { rowErrors: RowError[]; resolved: ResolvedBusinessRow[] } {
  const rowErrors: RowError[] = [];
  const resolved: ResolvedBusinessRow[] = [];
  const seenNames = new Set<string>();

  for (const rowNumber of sortedRowNumbers(rawRows)) {
    // Web fix: `?? {}` instead of `!` — the key came from the map itself.
    const result = resolveBusinessRow(rawRows.get(rowNumber) ?? {}, refs);
    if (!result.ok) {
      rowErrors.push({ rowNumber, message: result.message });
      continue;
    }

    const nameKey = result.value.row.name.toLowerCase();
    if (seenNames.has(nameKey)) {
      rowErrors.push({
        rowNumber,
        message: `duplicate of an earlier row ("${result.value.row.name}")`,
      });
      continue;
    }
    seenNames.add(nameKey);

    resolved.push({ ...result.value, rowNumber });
  }

  return { rowErrors, resolved };
}
