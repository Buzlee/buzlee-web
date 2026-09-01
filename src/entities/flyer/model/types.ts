// PORTED FROM buzlee-app/src/entities/flyer/model/types.ts — keep in sync; see docs/admin-sync.md
// src/entities/flyer/model/types.ts

import type { Database } from "@/types/database";

// Direct type inference from Supabase - single source of truth
export type Flyer = Database["public"]["Tables"]["flyers"]["Row"];
export type FlyerInsert = Database["public"]["Tables"]["flyers"]["Insert"];
export type FlyerUpdate = Database["public"]["Tables"]["flyers"]["Update"];
export type FlyerStatus = Database["public"]["Enums"]["flyer_status"];
export type FlyerVisibility = "public" | "members_only";
export type FlyerType = Database["public"]["Enums"]["flyer_type"];

/**
 * One event inside a flyer (child table `flyer_events`). Every flyer has at
 * least one; `flyer_type === 'single'` means exactly one. The parent's
 * `event_date / event_end_date / recurrence_rule / expires_at` are summary
 * columns derived from these rows by a DB trigger.
 */
export type FlyerEvent = Database["public"]["Tables"]["flyer_events"]["Row"];
export type FlyerEventInsert =
  Database["public"]["Tables"]["flyer_events"]["Insert"];

/** Event payload accepted by `upsert_flyer_with_events`. `id` present = keep/update that row. */
export type FlyerEventInput = Pick<
  FlyerEventInsert,
  | "title"
  | "description"
  | "starts_at"
  | "ends_at"
  | "recurrence_rule"
  | "recurrence_until"
  | "sort_order"
> & { id?: string };

/**
 * Flyer payload accepted by `upsert_flyer_with_events`. Schedule summary
 * columns are omitted on purpose — the DB derives them from the events.
 * Include `id` to update an existing flyer; omit it to create.
 */
export type FlyerRpcInput = Omit<
  FlyerInsert,
  | "id"
  | "event_date"
  | "event_end_date"
  | "recurrence_rule"
  | "expires_at"
  | "posted_by"
> & { id?: string; flyer_type: FlyerType };

export type UpsertFlyerWithEventsInput = {
  flyer: FlyerRpcInput;
  events: FlyerEventInput[];
};

// Extended types for query results with joins
export type FlyerWithDetails = Flyer & {
  business: {
    id: string;
    name: string;
    logo_url: string | null;
    cover_photo_url: string | null;
    phone: string | null;
    email: string | null;
    show_email: boolean;
    website: string | null;
    address: string | null;
    social_links: {
      facebook?: string | null;
      instagram?: string | null;
      yelp?: string | null;
      google_business?: string | null;
    } | null;
  } | null;
  category: Database["public"]["Tables"]["flyer_categories"]["Row"];
  town: Database["public"]["Tables"]["towns"]["Row"] | null;
  tags?: {
    id: string;
    name: string;
    slug: string;
  }[];
  /** Ordered by sort_order, then starts_at. Empty only for legacy rows fetched without the relation. */
  events: FlyerEvent[];
};

export type DatePreset = "today" | "this_week" | "this_month";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export type FlyerFilters = {
  status?: FlyerStatus | FlyerStatus[];
  categoryId?: string;
  categoryIds?: string[];
  townId?: string;
  townIds?: string[];
  businessId?: string;
  dateFrom?: string;
  dateTo?: string;
  datePreset?: DatePreset;
  timeOfDay?: TimeOfDay;
  tagIds?: string[];
  isLive?: boolean;
  visibility?: FlyerVisibility | FlyerVisibility[];
};

export type ImageAsset = {
  uri: string;
  type: string;
  name: string;
};
