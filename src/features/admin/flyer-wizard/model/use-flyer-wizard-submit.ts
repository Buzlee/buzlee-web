// PORTED FROM buzlee-app/src/features/flyer-wizard/model/use-flyer-wizard-submit.ts — keep in sync; see docs/admin-sync.md
// Web fix: uploads take prepared Blobs (`lib/media.ts`), cache invalidation
// goes through `useQueryClient`, and the local-draft bookkeeping / analytics
// are not ported. The admin dashboard always acts as admin.

/**
 * Server save flow for the flyer wizard (create + edit): RPC upsert with
 * events, media / cover upload, tags, rollback on a failed create, cache
 * invalidation and member notifications. Pure orchestration — the wizard
 * state hook owns the draft.
 */
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { adminKeys } from "@/entities/admin/api/use-admin";
import * as queries from "@/entities/flyer/api/flyer-queries";
import * as tagQueries from "@/entities/flyer/api/flyer-tag-queries";
import { flyerKeys } from "@/entities/flyer/api/use-flyer";
import {
  invokeMemberFlyerNotify,
  toMemberFlyerNotifyRecord,
} from "@/entities/flyer/lib/send-member-flyer-notification";
import type { Flyer, FlyerWithDetails } from "@/entities/flyer/model/types";
import { coverPhotoUploadBlob, mediaUploadBlob } from "../lib/media";
import { buildUpsertInput } from "../lib/serialize-flyer-draft";
import { isDraftPublishable } from "../lib/validate-wizard-step";
import type { FlyerDraft, FlyerMediaDraft, WizardMode } from "./types";

export type UseFlyerWizardSubmitOptions = {
  mode: WizardMode;
  businessId: string;
  existingFlyer: FlyerWithDetails | null;
  draft: FlyerDraft;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export type FlyerWizardSubmit = {
  submitting: boolean;
  /** Create: insert as draft, live once the media is uploaded. Edit: draft → live (new `live_at`). */
  publish: () => Promise<void>;
  /** Create: insert as draft. Edit: move to / keep as draft. */
  saveDraft: () => Promise<void>;
  /** Edit only: keep the current status and `live_at`. */
  saveChanges: () => Promise<void>;
};

type SubmitIntent = "publish" | "saveDraft" | "saveChanges";

const ACTING_AS_ADMIN = true;

function isLiveStatus(flyer: FlyerWithDetails | null): boolean {
  return flyer?.status === "live" || flyer?.status === "approved";
}

function resolveTarget(
  intent: SubmitIntent,
  existingFlyer: FlyerWithDetails | null,
): { status: "live" | "draft"; keepLiveAt: boolean } {
  switch (intent) {
    case "publish":
      // Re-publishing an already-live flyer must not bump its live_at.
      return { status: "live", keepLiveAt: isLiveStatus(existingFlyer) };
    case "saveDraft":
      return { status: "draft", keepLiveAt: false };
    case "saveChanges":
      return {
        status: isLiveStatus(existingFlyer) ? "live" : "draft",
        keepLiveAt: true,
      };
  }
}

function invalidateBusinessFlyerQueries(
  queryClient: QueryClient,
  businessId: string,
  actingAsAdmin: boolean,
): void {
  void queryClient.invalidateQueries({ queryKey: flyerKeys.lists() });
  void queryClient.invalidateQueries({ queryKey: flyerKeys.live() });
  void queryClient.invalidateQueries({
    queryKey: [...flyerKeys.all, "businessDiscovery"],
  });
  if (actingAsAdmin) {
    void queryClient.invalidateQueries({
      queryKey: adminKeys.businessDetail(businessId),
    });
    void queryClient.invalidateQueries({ queryKey: adminKeys.flyers() });
    void queryClient.invalidateQueries({ queryKey: adminKeys.statusCounts() });
  }
}

function createSuccessMessage(
  status: "live" | "draft",
  actingAsAdmin: boolean,
): string {
  if (status === "draft") {
    return actingAsAdmin
      ? "Flyer saved as draft for this business."
      : "Your flyer has been saved as a draft. You can publish it later.";
  }
  return actingAsAdmin
    ? "Flyer created and is now live for this business."
    : "Your flyer has been created and is now live!";
}

function editSuccessMessage(
  intent: SubmitIntent,
  status: "live" | "draft",
  actingAsAdmin: boolean,
): string {
  const statusText =
    intent === "saveChanges"
      ? "updated"
      : status === "live"
        ? "published"
        : "saved as draft";
  return actingAsAdmin
    ? `Flyer ${statusText} for this business.`
    : `Your flyer has been ${statusText}!`;
}

function mapSubmitError(
  error: unknown,
  mode: WizardMode,
  actingAsAdmin: boolean,
): string {
  const err = error as { message?: unknown; code?: unknown } | null | undefined;
  const message = typeof err?.message === "string" ? err.message : "";

  if (message.includes("row-level security")) {
    if (mode === "create") {
      return actingAsAdmin
        ? "Permission denied. Ensure the business is approved and you have admin access."
        : "Permission denied. Please ensure your business profile is set up correctly.";
    }
    return actingAsAdmin
      ? "Permission denied. Ensure you have admin access for this business."
      : "Permission denied. You can only edit your own flyers.";
  }
  if (err?.code === "22007") {
    return "Invalid date/time format. Please check your inputs.";
  }
  if (message) return message;
  return mode === "create"
    ? "Failed to create flyer. Please try again."
    : "Failed to update flyer. Please try again.";
}

export function useFlyerWizardSubmit(
  opts: UseFlyerWizardSubmitOptions,
): FlyerWizardSubmit {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  // Synchronous re-entry guard: `submitting` only disables buttons after a
  // re-render, so a same-frame double click could submit twice.
  const submittingRef = useRef(false);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const runCreate = useCallback(
    async (intent: SubmitIntent): Promise<void> => {
      const { businessId, draft, onSuccess } = optsRef.current;
      const media = draft.media as FlyerMediaDraft;
      const { status } = resolveTarget(intent, null);

      // Encode before the insert so a bad file never leaves a media-less row.
      const mediaBlob = await mediaUploadBlob(media);
      const coverBlob = draft.coverPhoto
        ? await coverPhotoUploadBlob(draft.coverPhoto)
        : null;

      // The storage path is keyed by the flyer id, so the row has to exist
      // before the upload. Insert it as a draft and flip it live only once the
      // media is in place: a live row with `media_url: ''` must never exist,
      // even transiently or when the rollback below fails.
      const input = await buildUpsertInput(draft, {
        businessId,
        status: "draft",
        mediaType: media.type,
      });
      const flyer = await queries.upsertFlyerWithEvents(input);
      let saved: Flyer = flyer;

      try {
        const mediaUrl = await queries.uploadFlyerMedia(
          flyer.id,
          mediaBlob,
          media.type,
        );

        let coverPhotoUrl: string | null = null;
        if (coverBlob) {
          coverPhotoUrl = await queries.uploadFlyerCoverPhoto(
            flyer.id,
            coverBlob,
          );
        }

        // Same shape as `publishFlyer`: `expires_at` is derived by the DB
        // trigger on the status change.
        saved = await queries.updateFlyer(flyer.id, {
          media_url: mediaUrl,
          cover_photo_url: coverPhotoUrl,
          ...(status === "live"
            ? { status: "live", live_at: new Date().toISOString() }
            : {}),
        });

        if (draft.tagIds.length > 0) {
          await tagQueries.setFlyerTags(flyer.id, draft.tagIds);
        }
      } catch (error) {
        // Roll back the inserted row: without this, "please try again" retries
        // create duplicates (the row is still a draft, so it never reached feeds).
        await queries.deleteFlyer(flyer.id).catch((rollbackError) => {
          console.error("[FlyerWizard] Rollback delete failed:", rollbackError);
        });
        throw error;
      }

      await queryClient.invalidateQueries({
        queryKey: flyerKeys.myFlyers(businessId),
      });
      invalidateBusinessFlyerQueries(queryClient, businessId, ACTING_AS_ADMIN);

      if (status === "live") {
        await invokeMemberFlyerNotify({
          type: "INSERT",
          table: "flyers",
          record: toMemberFlyerNotifyRecord(saved),
        });
      }

      onSuccess(createSuccessMessage(status, ACTING_AS_ADMIN));
    },
    [queryClient],
  );

  const runEdit = useCallback(
    async (intent: SubmitIntent): Promise<void> => {
      const { businessId, draft, onSuccess } = optsRef.current;
      const existing = optsRef.current.existingFlyer as FlyerWithDetails;
      const media = draft.media as FlyerMediaDraft;
      const { status, keepLiveAt } = resolveTarget(intent, existing);

      // Upload changed files first so the row never points at a missing asset.
      // The previous objects stay in storage until the save has succeeded: a
      // failed RPC must leave the flyer's current artwork intact.
      let mediaUrl = existing.media_url;
      if (draft.mediaChanged) {
        mediaUrl = await queries.uploadFlyerMedia(
          existing.id,
          await mediaUploadBlob(media),
          media.type,
        );
      }

      let coverPhotoUrl: string | null = existing.cover_photo_url;
      if (draft.coverPhotoChanged) {
        coverPhotoUrl = draft.coverPhoto
          ? await queries.uploadFlyerCoverPhoto(
              existing.id,
              await coverPhotoUploadBlob(draft.coverPhoto),
            )
          : null;
      }

      const input = await buildUpsertInput(draft, {
        businessId,
        status,
        mediaType: media.type,
        id: existing.id,
        keepLiveAt,
        mediaUrl,
        coverPhotoUrl,
      });
      let updated: Flyer;
      try {
        updated = await queries.upsertFlyerWithEvents(input);
      } catch (error) {
        // The row still points at the old assets; drop the orphaned uploads.
        await Promise.all([
          mediaUrl !== existing.media_url
            ? queries.deleteFlyerMedia(mediaUrl)
            : null,
          coverPhotoUrl && coverPhotoUrl !== existing.cover_photo_url
            ? queries.deleteFlyerCoverPhoto(coverPhotoUrl)
            : null,
        ]).catch((cleanupError) => {
          console.error("[FlyerWizard] Upload cleanup failed:", cleanupError);
        });
        throw error;
      }
      await tagQueries.setFlyerTags(existing.id, draft.tagIds);

      // Replaced / removed assets are deleted only once the row no longer
      // references them. Best-effort: a leftover object is not a failed save.
      await Promise.all([
        draft.mediaChanged && existing.media_url
          ? queries.deleteFlyerMedia(existing.media_url)
          : null,
        draft.coverPhotoChanged && existing.cover_photo_url
          ? queries.deleteFlyerCoverPhoto(existing.cover_photo_url)
          : null,
      ]).catch((cleanupError) => {
        console.error(
          "[FlyerWizard] Stale asset cleanup failed:",
          cleanupError,
        );
      });

      // The RPC returns the bare row (no business/category/events relations),
      // so the detail cache is invalidated rather than written directly.
      void queryClient.invalidateQueries({
        queryKey: flyerKeys.detail(existing.id),
      });
      void queryClient.invalidateQueries({
        queryKey: flyerKeys.flyerTags(existing.id),
      });
      void queryClient.invalidateQueries({
        queryKey: flyerKeys.myFlyers(existing.business_id),
      });
      void queryClient.invalidateQueries({
        queryKey: adminKeys.flyerDetail(existing.id),
      });
      invalidateBusinessFlyerQueries(
        queryClient,
        existing.business_id,
        ACTING_AS_ADMIN,
      );

      if (status === "live") {
        await invokeMemberFlyerNotify({
          type: "UPDATE",
          table: "flyers",
          record: toMemberFlyerNotifyRecord(updated),
          old_record: toMemberFlyerNotifyRecord(existing),
        });
      }

      onSuccess(editSuccessMessage(intent, status, ACTING_AS_ADMIN));
    },
    [queryClient],
  );

  const run = useCallback(
    async (intent: SubmitIntent): Promise<void> => {
      if (submittingRef.current) return;
      const { mode, draft, existingFlyer, onError } = optsRef.current;
      // The screen disables the buttons for these; bail quietly if it didn't.
      if (!isDraftPublishable(draft) || !draft.media || !draft.location) return;
      if (mode === "edit" && !existingFlyer) return;
      // "Keep the current status" has no meaning for a flyer that does not exist yet.
      if (mode === "create" && intent === "saveChanges") return;

      submittingRef.current = true;
      setSubmitting(true);
      try {
        if (mode === "edit") {
          await runEdit(intent);
        } else {
          await runCreate(intent);
        }
      } catch (error) {
        console.error(
          mode === "edit"
            ? "[FlyerWizard] Update error:"
            : "[FlyerWizard] Create error:",
          error,
        );
        onError(mapSubmitError(error, mode, ACTING_AS_ADMIN));
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [runCreate, runEdit],
  );

  const publish = useCallback(() => run("publish"), [run]);
  const saveDraft = useCallback(() => run("saveDraft"), [run]);
  const saveChanges = useCallback(() => run("saveChanges"), [run]);

  return { submitting, publish, saveDraft, saveChanges };
}
