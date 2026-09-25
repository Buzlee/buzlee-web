import { downloadTextFile } from "@/shared/lib/download-file";
import type { BatchType } from "../model/use-batch-upload";
import { businessRowSchema, flyerRowSchema } from "./batch-row-schemas";

/**
 * Header-only CSV templates derived from the row schemas, so the download
 * can never drift from the columns the validator accepts (the app ships the
 * equivalent files in buzlee-app/docs/batch-upload/).
 */
export function templateColumns(type: BatchType): string[] {
  const schema = type === "flyers" ? flyerRowSchema : businessRowSchema;
  return Object.keys(schema.shape);
}

export function downloadCsvTemplate(type: BatchType): void {
  downloadTextFile(
    `buzlee-${type}-template.csv`,
    `${templateColumns(type).join(",")}\r\n`,
  );
}
