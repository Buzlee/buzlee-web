"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminDeletableEntity } from "@/entities/admin";
import {
  DELETE_RETENTION_DAYS,
  purgeDateLabel,
  useAdminDeleteEntity,
} from "@/entities/admin";

/**
 * Soft-delete dialog with an explicit escape hatch into hard delete.
 * Soft = hidden immediately, restorable for DELETE_RETENTION_DAYS, then
 * purged by the daily job. Hard = the admin-hard-delete edge function,
 * unrecoverable.
 */
export function DeleteDialog({
  open,
  onOpenChange,
  entity,
  entityId,
  name,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: AdminDeletableEntity;
  entityId: string;
  name: string;
  onDeleted?: () => void;
}) {
  const [hardMode, setHardMode] = useState(false);
  const deleteEntity = useAdminDeleteEntity();

  useEffect(() => {
    if (open) setHardMode(false);
  }, [open]);

  function handleDelete(mode: "soft" | "hard") {
    if (deleteEntity.isPending) return;
    deleteEntity.mutate(
      { entity, entityId, mode },
      {
        onSuccess: () => {
          toast.success(
            mode === "hard"
              ? `Deleted ${name} forever`
              : `Deleted ${name} — restorable for ${DELETE_RETENTION_DAYS} days`,
          );
          onOpenChange(false);
          onDeleted?.();
        },
        onError: (error) => toast.error(`Delete failed: ${error.message}`),
      },
    );
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 className="size-5 text-destructive" />
          </span>
          <DialogTitle>
            {hardMode ? `Delete ${name} forever?` : `Delete ${name}?`}
          </DialogTitle>
          <DialogDescription>
            {hardMode
              ? `Permanently erases this ${entity} — data, media, and (for residents) the account — right now. This cannot be undone.`
              : `Hidden from everyone immediately. Restorable for ${DELETE_RETENTION_DAYS} days (until ${purgeDateLabel(new Date().toISOString())}), then permanently purged.${entity === "business" ? " The business's flyers are hidden with it." : ""}`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between">
          {hardMode ? (
            <Button
              className="px-0 text-muted-foreground"
              disabled={deleteEntity.isPending}
              onClick={() => setHardMode(false)}
              type="button"
              variant="link"
            >
              Back to 15-day delete
            </Button>
          ) : (
            <Button
              className="px-0 text-muted-foreground"
              disabled={deleteEntity.isPending}
              onClick={() => setHardMode(true)}
              type="button"
              variant="link"
            >
              Delete forever instead…
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Button
              disabled={deleteEntity.isPending}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={deleteEntity.isPending}
              onClick={() => handleDelete(hardMode ? "hard" : "soft")}
              type="button"
              variant="destructive"
            >
              {deleteEntity.isPending
                ? "Deleting…"
                : hardMode
                  ? "Delete forever"
                  : `Delete for ${DELETE_RETENTION_DAYS} days`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
