// PORTED FROM buzlee-app/src/entities/admin/model/types.ts — keep in sync; see docs/admin-sync.md
import type { Business, BusinessStatus } from "@/entities/business/model/types";
import type { FlyerStatus } from "@/entities/flyer/model/types";

/**
 * Admin-specific filter types for querying pending items
 */
export type AdminBusinessFilters = {
  status?: BusinessStatus | BusinessStatus[];
  categoryId?: string;
  townId?: string;
};

export type AdminFlyerFilters = {
  status?: FlyerStatus | FlyerStatus[];
  categoryId?: string;
  townId?: string;
  businessId?: string;
};

/**
 * Extended types for admin dashboard views
 * These match the database views created in the migration
 */
export type AdminBusinessSummary = Pick<
  Business,
  | "id"
  | "user_id"
  | "name"
  | "description"
  | "email"
  | "phone"
  | "website"
  | "address"
  | "location"
  | "logo_url"
  | "cover_photo_url"
  | "status"
  | "approved_at"
  | "approved_by"
  | "rejected_at"
  | "rejected_by"
  | "rejection_reason"
  | "created_at"
  | "updated_at"
> & {
  category_id: string | null;
  category_name: string | null;
  town_id: string | null;
  town_name: string | null;
};

export type AdminFlyerSummary = {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  media_url: string | null;
  media_type: string | null;
  event_date: string;
  event_time: string | null;
  event_end_date: string | null;
  expires_at: string | null;
  location_address: string;
  external_link: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  business_name: string | null;
  business_logo: string | null;
  category_id: string | null;
  category_name: string | null;
  town_id: string | null;
  town_name: string | null;
};

/**
 * Flat resident row for the admin directory, returned by the
 * get_admin_residents RPC (residents → profiles → auth.users → towns).
 */
export type AdminResidentSummary = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  /** Sign-in email from auth.users — the address to use for marketing exports. */
  email: string | null;
  contact_email: string | null;
  town_id: string | null;
  town_name: string | null;
  created_at: string;
};

/**
 * Entity kinds an admin can delete (soft, with 15-day retention, or
 * permanently via the admin-hard-delete edge function).
 */
export type AdminDeletableEntity = "business" | "resident" | "flyer";

/**
 * Soft-deleted business awaiting purge, from the get_admin_deleted_businesses
 * RPC (restrictive RLS hides these rows from normal queries).
 */
export type AdminDeletedBusinessSummary = {
  id: string;
  name: string;
  email: string | null;
  logo_url: string | null;
  status: BusinessStatus;
  category_name: string | null;
  town_name: string | null;
  deleted_at: string;
  deleted_by: string | null;
};

/**
 * Full per-status counts from count_businesses_by_status /
 * count_flyers_by_status. The RPCs already return every status row — this
 * keeps them all (filter-chip counts, inbox hero) instead of discarding.
 */
export type AdminStatusCounts = {
  businesses: Record<string, number>;
  flyers: Record<string, number>;
};

/**
 * Admin dashboard stats
 */
export type AdminDashboardStats = {
  pendingBusinesses: number;
  approvedBusinesses: number;
  rejectedBusinesses: number;
  /** Flyers currently visible to residents. */
  liveFlyers: number;
};
