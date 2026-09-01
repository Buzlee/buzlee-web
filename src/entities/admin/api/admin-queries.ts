// PORTED FROM buzlee-app/src/entities/admin/api/admin-queries.ts — keep in sync; see docs/admin-sync.md

import type { Business, SocialLinks } from "@/entities/business/model/types";
import type { Flyer } from "@/entities/flyer/model/types";
import { supabase } from "@/shared/lib/supabase";
import { sendBusinessStatusEmail } from "../lib/send-business-status-email";
import type {
  AdminBusinessFilters,
  AdminBusinessSummary,
  AdminDashboardStats,
  AdminDeletableEntity,
  AdminDeletedBusinessSummary,
  AdminFlyerFilters,
  AdminFlyerSummary,
  AdminResidentSummary,
  AdminStatusCounts,
} from "../model/types";

/**
 * Fetch single business for admin with full details
 * Efficient query for detail views - fetches only the requested business
 */
export async function fetchAdminBusiness(
  businessId: string,
): Promise<AdminBusinessSummary> {
  const { data, error } = await supabase
    .from("businesses")
    .select(
      `
      id,
      user_id,
      name,
      description,
      email,
      phone,
      website,
      address,
      location,
      logo_url,
      cover_photo_url,
      status,
      approved_at,
      approved_by,
      rejected_at,
      rejected_by,
      rejection_reason,
      created_at,
      updated_at,
      category:business_categories(id, name),
      town:towns(id, name)
    `,
    )
    .eq("id", businessId)
    .single();

  if (error) throw error;

  // Transform joined data to flat structure
  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    description: (data as any).description ?? null,
    email: data.email,
    phone: data.phone,
    website: data.website,
    address: data.address,
    location: data.location,
    logo_url: data.logo_url,
    cover_photo_url: data.cover_photo_url,
    status: data.status,
    approved_at: data.approved_at,
    approved_by: data.approved_by,
    rejected_at: data.rejected_at,
    rejected_by: data.rejected_by,
    rejection_reason: data.rejection_reason,
    created_at: data.created_at,
    updated_at: data.updated_at,
    category_id: (data.category as any)?.id ?? null,
    category_name: (data.category as any)?.name ?? null,
    town_id: (data.town as any)?.id ?? null,
    town_name: (data.town as any)?.name ?? null,
  };
}

/**
 * Fetch businesses for admin dashboard with filters
 * Uses the standard businesses table with joins for related data
 */
export async function fetchAdminBusinesses(
  filters?: AdminBusinessFilters,
): Promise<AdminBusinessSummary[]> {
  let query = supabase
    .from("businesses")
    .select(
      `
      id,
      user_id,
      name,
      description,
      email,
      phone,
      website,
      address,
      location,
      logo_url,
      cover_photo_url,
      status,
      approved_at,
      approved_by,
      rejected_at,
      rejected_by,
      rejection_reason,
      created_at,
      updated_at,
      category:business_categories(id, name),
      town:towns(id, name)
    `,
    )
    .order("created_at", { ascending: false });

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in("status", filters.status);
    } else {
      query = query.eq("status", filters.status);
    }
  }

  if (filters?.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters?.townId) {
    query = query.eq("town_id", filters.townId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Transform joined data to flat structure
  return data.map((item: any) => ({
    id: item.id,
    user_id: item.user_id,
    name: item.name,
    description: item.description ?? null,
    email: item.email,
    phone: item.phone,
    website: item.website,
    address: item.address,
    location: item.location,
    logo_url: item.logo_url,
    cover_photo_url: item.cover_photo_url,
    status: item.status,
    approved_at: item.approved_at,
    approved_by: item.approved_by,
    rejected_at: item.rejected_at,
    rejected_by: item.rejected_by,
    rejection_reason: item.rejection_reason,
    created_at: item.created_at,
    updated_at: item.updated_at,
    category_id: item.category?.id ?? null,
    category_name: item.category?.name ?? null,
    town_id: item.town?.id ?? null,
    town_name: item.town?.name ?? null,
  }));
}

/**
 * Fetch flyers for admin dashboard with filters
 * Uses the standard flyers table with joins for related data
 */
export async function fetchAdminFlyers(
  filters?: AdminFlyerFilters,
): Promise<AdminFlyerSummary[]> {
  let query = supabase
    .from("flyers")
    .select(
      `
      id,
      business_id,
      title,
      description,
      media_url,
      media_type,
      event_date,
      event_time,
      event_end_date,
      expires_at,
      location_address,
      external_link,
      status,
      created_at,
      updated_at,
      business:businesses(name, logo_url),
      category:flyer_categories(id, name),
      town:towns(id, name)
    `,
    )
    .order("created_at", { ascending: false });

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in("status", filters.status);
    } else {
      query = query.eq("status", filters.status);
    }
  }

  if (filters?.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters?.townId) {
    query = query.eq("town_id", filters.townId);
  }

  if (filters?.businessId) {
    query = query.eq("business_id", filters.businessId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Transform joined data to flat structure
  return data.map((item: any) => ({
    id: item.id,
    business_id: item.business_id,
    title: item.title,
    description: item.description,
    media_url: item.media_url,
    media_type: item.media_type,
    event_date: item.event_date,
    event_time: item.event_time,
    event_end_date: item.event_end_date,
    expires_at: item.expires_at,
    location_address: item.location_address,
    external_link: item.external_link,
    status: item.status,
    created_at: item.created_at,
    updated_at: item.updated_at,
    business_name: item.business?.name ?? null,
    business_logo: item.business?.logo_url ?? null,
    category_id: item.category?.id ?? null,
    category_name: item.category?.name ?? null,
    town_id: item.town?.id ?? null,
    town_name: item.town?.name ?? null,
  }));
}

/**
 * Fetch all residents for the admin directory.
 * Uses the get_admin_residents SECURITY DEFINER RPC so the sign-in email
 * (auth.users) is included — needed for marketing exports.
 */
export async function fetchAdminResidents(): Promise<AdminResidentSummary[]> {
  const { data, error } = await supabase.rpc("get_admin_residents");

  if (error) throw error;

  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    first_name: row.first_name,
    last_name: row.last_name,
    avatar_url: row.avatar_url,
    email: row.email,
    contact_email: row.contact_email,
    town_id: row.town_id,
    town_name: row.town_name,
    created_at: row.created_at,
  }));
}

/**
 * Fetch dashboard statistics
 * Uses PostgreSQL RPC function for efficient server-side aggregation
 * Avoids fetching all rows and aggregating client-side
 */
export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  // Use parallel queries for optimal performance
  const [businessResult, flyerResult] = await Promise.all([
    // Count businesses by status using PostgreSQL COUNT
    supabase.rpc("count_businesses_by_status"),
    // Count flyers by status using PostgreSQL COUNT
    supabase.rpc("count_flyers_by_status"),
  ]);

  if (businessResult.error) throw businessResult.error;
  if (flyerResult.error) throw flyerResult.error;

  // Transform RPC results to stats object
  const businessStats = (businessResult.data || []) as {
    status: string;
    count: number;
  }[];
  const flyerStats = (flyerResult.data || []) as {
    status: string;
    count: number;
  }[];

  const stats: AdminDashboardStats = {
    pendingBusinesses:
      businessStats.find((s) => s.status === "pending")?.count ?? 0,
    approvedBusinesses:
      businessStats.find((s) => s.status === "approved")?.count ?? 0,
    rejectedBusinesses:
      businessStats.find((s) => s.status === "rejected")?.count ?? 0,
    liveFlyers: flyerStats.find((s) => s.status === "live")?.count ?? 0,
  };

  return stats;
}

/**
 * Fetch full per-status counts for businesses and flyers.
 * Same two RPCs as fetchAdminDashboardStats, but every status row is kept —
 * used by the Inbox hero and the filter-chip counts (Screens - Admin v2).
 */
export async function fetchAdminStatusCounts(): Promise<AdminStatusCounts> {
  const [businessResult, flyerResult] = await Promise.all([
    supabase.rpc("count_businesses_by_status"),
    supabase.rpc("count_flyers_by_status"),
  ]);

  if (businessResult.error) throw businessResult.error;
  if (flyerResult.error) throw flyerResult.error;

  const toRecord = (rows: unknown): Record<string, number> =>
    ((rows as { status: string; count: number }[] | null) ?? []).reduce<
      Record<string, number>
    >((acc, row) => {
      acc[row.status] = Number(row.count);
      return acc;
    }, {});

  return {
    businesses: toRecord(businessResult.data),
    flyers: toRecord(flyerResult.data),
  };
}

/**
 * Fetch a single flyer for the admin flyer-review screen.
 * Lives in entities/admin (not entities/flyer) so admin views stay
 * admin-scoped; same joined shape as fetchAdminFlyers.
 */
export async function fetchAdminFlyer(
  flyerId: string,
): Promise<AdminFlyerSummary> {
  const { data, error } = await supabase
    .from("flyers")
    .select(
      `
      id,
      business_id,
      title,
      description,
      media_url,
      media_type,
      event_date,
      event_time,
      event_end_date,
      expires_at,
      location_address,
      external_link,
      status,
      created_at,
      updated_at,
      business:businesses(name, logo_url),
      category:flyer_categories(id, name),
      town:towns(id, name)
    `,
    )
    .eq("id", flyerId)
    .single();

  if (error) throw error;

  const item = data as any;
  return {
    id: item.id,
    business_id: item.business_id,
    title: item.title,
    description: item.description,
    media_url: item.media_url,
    media_type: item.media_type,
    event_date: item.event_date,
    event_time: item.event_time,
    event_end_date: item.event_end_date,
    expires_at: item.expires_at,
    location_address: item.location_address,
    external_link: item.external_link,
    status: item.status,
    created_at: item.created_at,
    updated_at: item.updated_at,
    business_name: item.business?.name ?? null,
    business_logo: item.business?.logo_url ?? null,
    category_id: item.category?.id ?? null,
    category_name: item.category?.name ?? null,
    town_id: item.town?.id ?? null,
    town_name: item.town?.name ?? null,
  };
}

/**
 * Fields required to create an admin-posted ("unclaimed") business listing.
 */
export type CreateUnclaimedBusinessInput = {
  name: string;
  /** Optional for unclaimed listings — backfilled when the business is claimed. */
  email?: string | null;
  categoryId: string;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  townId?: string | null;
  location?: Record<string, unknown> | null;
  description?: string | null;
  socialLinks?: SocialLinks | null;
};

/**
 * Admin: Create an unclaimed business listing (no owner yet).
 * Listings are published as 'approved' so residents can see them immediately;
 * a business owner can later claim ownership.
 */
export async function createUnclaimedBusiness(
  input: CreateUnclaimedBusinessInput,
  adminId: string,
): Promise<Business> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("businesses")
    .insert({
      name: input.name,
      email: input.email ?? null,
      category_id: input.categoryId,
      phone: input.phone ?? null,
      website: input.website ?? null,
      address: input.address ?? null,
      town_id: input.townId ?? null,
      location: (input.location ?? null) as Business["location"],
      description: input.description ?? null,
      social_links: input.socialLinks ?? null,
      status: "approved",
      approved_at: now,
      approved_by: adminId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Admin: Approve business
 * Re-exports from business-queries for consistency
 */
export async function approveBusiness(
  businessId: string,
  adminId: string,
): Promise<Business> {
  const { data, error } = await supabase
    .from("businesses")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: adminId,
    })
    .eq("id", businessId)
    .select()
    .single();

  if (error) throw error;

  // Send approval email (async, non-blocking)
  // Web fix: user_id/email are nullable for unclaimed listings; supabase-js
  // >=2.100 surfaces that. Empty strings keep the call-always semantics —
  // the edge function's failure is caught and logged, never blocking.
  sendBusinessStatusEmail({
    id: data.id,
    user_id: data.user_id ?? "",
    name: data.name,
    email: data.email ?? "",
    status: "approved",
  }).catch((err) => console.error("[approveBusiness] Email send failed:", err));

  return data;
}

/**
 * Admin: Reject business
 * Re-exports from business-queries for consistency
 */
export async function rejectBusiness(
  businessId: string,
  adminId: string,
  reason: string,
): Promise<Business> {
  const { data, error } = await supabase
    .from("businesses")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      rejected_by: adminId,
      rejection_reason: reason,
    })
    .eq("id", businessId)
    .select()
    .single();

  if (error) throw error;

  // Send rejection email (async, non-blocking)
  // Web fix: nullable user_id/email — see approveBusiness above.
  sendBusinessStatusEmail({
    id: data.id,
    user_id: data.user_id ?? "",
    name: data.name,
    email: data.email ?? "",
    status: "rejected",
    rejection_reason: reason,
  }).catch((err) => console.error("[rejectBusiness] Email send failed:", err));

  return data;
}

/**
 * Fetch soft-deleted businesses awaiting the 15-day purge.
 * Uses a SECURITY DEFINER RPC because restrictive RLS hides these rows
 * from every client role, admins included.
 */
export async function fetchAdminDeletedBusinesses(): Promise<
  AdminDeletedBusinessSummary[]
> {
  const { data, error } = await supabase.rpc("get_admin_deleted_businesses");

  if (error) throw error;
  return (data ?? []) as AdminDeletedBusinessSummary[];
}

/**
 * Admin: Reverse a soft delete before the purge runs.
 * Restoring a business also restores the flyers its deletion hid.
 */
export async function restoreEntity(
  entity: AdminDeletableEntity,
  entityId: string,
): Promise<void> {
  const { error } = await supabase.rpc("admin_restore_entity", {
    p_entity: entity,
    p_id: entityId,
  });

  if (error) throw error;
}

/**
 * Admin: Soft-delete a business, resident, or flyer.
 * The row is hidden from all clients immediately (restrictive RLS) and
 * permanently purged 15 days later. Soft-deleting a business also
 * soft-deletes its flyers.
 */
export async function softDeleteEntity(
  entity: AdminDeletableEntity,
  entityId: string,
): Promise<void> {
  const { error } = await supabase.rpc("admin_soft_delete_entity", {
    p_entity: entity,
    p_id: entityId,
  });

  if (error) throw error;
}

/**
 * Admin: Permanently delete a business, resident, or flyer right now.
 * Goes through the admin-hard-delete edge function, which authorizes the
 * caller as an admin, deletes rows (cascades included) and storage assets,
 * and for residents removes the auth account. Unrecoverable.
 */
export async function hardDeleteEntity(
  entity: AdminDeletableEntity,
  entityId: string,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke("admin-hard-delete", {
    body: { entityType: entity, entityId },
  });

  if (error) throw error;

  if (data?.error) {
    throw new Error(data.error.message ?? "Failed to delete");
  }
}

/**
 * Admin: Take a flyer down (moderation).
 * Sets status to rejected with a reason the business sees on the flyer.
 */
export async function rejectFlyer(
  flyerId: string,
  adminId: string,
  reason: string,
): Promise<Flyer> {
  const { data, error } = await supabase
    .from("flyers")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      rejected_by: adminId,
      rejection_reason: reason,
    })
    .eq("id", flyerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
