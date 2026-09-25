// PORTED FROM buzlee-app/src/entities/business/model/types.ts — keep in sync; see docs/admin-sync.md
import type { BusinessCategory, Town } from "@/entities/catalog/model/types";
import type { Database } from "@/types/database";

// Direct type inference from Supabase - single source of truth
export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type BusinessInsert =
  Database["public"]["Tables"]["businesses"]["Insert"];
export type BusinessUpdate =
  Database["public"]["Tables"]["businesses"]["Update"];
export type BusinessStatus = Database["public"]["Enums"]["business_status"];

/** Shape of the social_links JSONB column on businesses */
export type SocialLinks = {
  facebook?: string | null;
  instagram?: string | null;
  yelp?: string | null;
  google_business?: string | null;
};

// Extended types for query results with joins
export type BusinessWithDetails = Business & {
  category: BusinessCategory;
  town: Town | null;
  profile: {
    avatar_url: string | null;
  } | null;
};

export type BusinessFilters = {
  status?: BusinessStatus;
  categoryId?: string;
  townId?: string;
  userId?: string;
};

export type ImageAsset = {
  uri: string;
  type: string;
  name: string;
};
