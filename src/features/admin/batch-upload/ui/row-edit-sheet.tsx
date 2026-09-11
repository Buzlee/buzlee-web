"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Field,
  textareaClass,
} from "@/features/admin/businesses/business-form";
import type { ConfirmFn } from "@/features/admin/dialogs/use-confirm";
import { ChoiceChips } from "@/features/admin/flyer-wizard/ui/components/choice-chips";
import type { BatchType, RowUpdateOutcome } from "../model/use-batch-upload";
import { FIELD_DEFS, type RowFieldDef } from "./row-field-defs";

export interface RowEditSheetProps {
  type: BatchType;
  /** Spreadsheet row number being edited; null closes the sheet. */
  rowNumber: number | null;
  initialValues: Record<string, string> | null;
  onSave: (values: Record<string, string>) => Promise<RowUpdateOutcome>;
  onClose: () => void;
  confirm: ConfirmFn;
}

function ChipField({
  def,
  value,
  onChange,
}: {
  def: RowFieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  const options = def.options ?? [];
  const selectedValue = value.trim() || options[0]?.value || null;
  return (
    <ChoiceChips
      aria-label={def.label}
      onChange={onChange}
      options={options}
      value={selectedValue}
    />
  );
}

function RowEditForm({
  type,
  rowNumber,
  initialValues,
  onSave,
  onClose,
  confirm,
}: Omit<RowEditSheetProps, "rowNumber" | "initialValues"> & {
  rowNumber: number;
  initialValues: Record<string, string>;
}) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirty = Object.keys(values).some(
    (key) => (values[key] ?? "") !== (initialValues[key] ?? ""),
  );

  const setValue = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isDirty || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const outcome = await onSave(values);
      if (outcome.ok) {
        onClose();
        return;
      }
      // Edits are already applied (the row is filed under "Needs attention");
      // ask whether to keep working on it here — same copy as the app.
      const keepEditing = await confirm({
        title: "Row still has an error",
        description: outcome.message ?? "Check the row values and try again.",
        ctaLabel: "Keep editing",
        cancelLabel: "Done for now",
      });
      if (!keepEditing) onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  const idFor = (key: string) => `batch-row-${rowNumber}-${key}`;

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
        {FIELD_DEFS[type].map((def) => (
          <Field
            hint={def.description}
            htmlFor={idFor(def.key)}
            key={def.key}
            label={def.required ? `${def.label} *` : def.label}
          >
            {def.kind === "chips" ? (
              <ChipField
                def={def}
                onChange={(v) => setValue(def.key, v)}
                value={values[def.key] ?? ""}
              />
            ) : def.kind === "multiline" ? (
              <textarea
                className={textareaClass}
                id={idFor(def.key)}
                onChange={(e) => setValue(def.key, e.target.value)}
                value={values[def.key] ?? ""}
              />
            ) : (
              <Input
                autoCapitalize={
                  def.inputType && def.inputType !== "text" ? "none" : undefined
                }
                id={idFor(def.key)}
                inputMode={def.inputMode}
                onChange={(e) => setValue(def.key, e.target.value)}
                placeholder={def.placeholder}
                type={def.inputType ?? "text"}
                value={values[def.key] ?? ""}
              />
            )}
          </Field>
        ))}
      </div>

      <SheetFooter className="flex-row justify-end border-t border-border">
        <Button
          disabled={isSubmitting}
          onClick={onClose}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          className="bg-foreground text-background hover:bg-foreground/90"
          disabled={!isDirty || isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Checking…" : "Save"}
        </Button>
      </SheetFooter>
    </form>
  );
}

/**
 * Side-sheet editor for one CSV row (web port of mobile `RowEditSheet`).
 * Values are the raw cell strings — the same zod pipeline that validates the
 * file re-validates the row on save, so the sheet never drifts from the CSV
 * rules. Saving an invalid row keeps the edits and files the row under
 * "Needs attention". The form remounts per row so a reopened sheet never
 * shows another row's edits.
 */
export function RowEditSheet({
  type,
  rowNumber,
  initialValues,
  onSave,
  onClose,
  confirm,
}: RowEditSheetProps) {
  const isOpen = rowNumber != null && initialValues != null;

  return (
    <Sheet onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Edit row {rowNumber ?? ""}</SheetTitle>
          <SheetDescription>
            {type === "flyers" ? "Flyer details" : "Business details"}
          </SheetDescription>
        </SheetHeader>
        {isOpen ? (
          <RowEditForm
            confirm={confirm}
            initialValues={initialValues}
            key={rowNumber}
            onClose={onClose}
            onSave={onSave}
            rowNumber={rowNumber}
            type={type}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
