// PORTED FROM buzlee-app/src/entities/catalog/api/catalog-queries.ts — keep in sync; see docs/admin-sync.md
import { supabase } from "@/shared/lib/supabase";
import type {
  BusinessCategory,
  FlyerCategory,
  Tag,
  Town,
} from "../model/types";

/**
 * Fetch all active business categories
 */
export async function fetchBusinessCategories(): Promise<BusinessCategory[]> {
  const { data, error } = await supabase
    .from("business_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Fetch all active flyer categories
 */
export async function fetchFlyerCategories(): Promise<FlyerCategory[]> {
  const { data, error } = await supabase
    .from("flyer_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Fetch single flyer category by ID
 */
export async function fetchFlyerCategory(id: string): Promise<FlyerCategory> {
  const { data, error } = await supabase
    .from("flyer_categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch all towns in Westchester County
 */
export async function fetchTowns(): Promise<Town[]> {
  const { data, error } = await supabase
    .from("towns")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Fetch single town by ID
 */
export async function fetchTown(id: string): Promise<Town> {
  const { data, error } = await supabase
    .from("towns")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch town by name
 */
export async function fetchTownByName(name: string): Promise<Town | null> {
  const { data, error } = await supabase
    .from("towns")
    .select("*")
    .ilike("name", name)
    .single();

  if (error) {
    // Not found is not an error - return null
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }
  return data;
}

/**
 * Fetch all tags
 */
export async function fetchTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}
