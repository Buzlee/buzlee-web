// PORTED FROM buzlee-app/src/entities/catalog/model/types.ts — keep in sync; see docs/admin-sync.md
import type { Database } from "@/types/database";

export type BusinessCategory =
  Database["public"]["Tables"]["business_categories"]["Row"];
export type FlyerCategory =
  Database["public"]["Tables"]["flyer_categories"]["Row"];
export type Town = Database["public"]["Tables"]["towns"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];
