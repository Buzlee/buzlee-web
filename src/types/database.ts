// PORTED FROM buzlee-app/src/types/database.ts — generated via 'pnpm db:types' in buzlee-app; keep in sync (see docs/admin-sync.md)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      admin_push_tokens: {
        Row: {
          created_at: string;
          id: string;
          platform: string;
          token: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          platform: string;
          token: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          platform?: string;
          token?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_push_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      business_categories: {
        Row: {
          created_at: string;
          display_order: number | null;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          display_order?: number | null;
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          display_order?: number | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      business_claim_invites: {
        Row: {
          accepted_at: string | null;
          business_id: string;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string | null;
          sent_at: string;
          status: string;
          token: string;
        };
        Insert: {
          accepted_at?: string | null;
          business_id: string;
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          sent_at?: string;
          status?: string;
          token?: string;
        };
        Update: {
          accepted_at?: string | null;
          business_id?: string;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          sent_at?: string;
          status?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_claim_invites_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      business_claims: {
        Row: {
          business_id: string;
          claimant_user_id: string;
          contact_email: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          created_at: string;
          id: string;
          message: string | null;
          rejection_reason: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["business_claim_status"];
          updated_at: string;
        };
        Insert: {
          business_id: string;
          claimant_user_id: string;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          message?: string | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["business_claim_status"];
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          claimant_user_id?: string;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          message?: string | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["business_claim_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_claims_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_claims_claimant_user_id_fkey";
            columns: ["claimant_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_claims_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      business_member_invites: {
        Row: {
          accepted_at: string | null;
          business_id: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string | null;
          last_delivery_attempted_at: string | null;
          last_delivery_error: string | null;
          last_delivery_status: string;
          sent_at: string;
          status: string;
          token: string;
        };
        Insert: {
          accepted_at?: string | null;
          business_id: string;
          email: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          last_delivery_attempted_at?: string | null;
          last_delivery_error?: string | null;
          last_delivery_status?: string;
          sent_at?: string;
          status?: string;
          token?: string;
        };
        Update: {
          accepted_at?: string | null;
          business_id?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          last_delivery_attempted_at?: string | null;
          last_delivery_error?: string | null;
          last_delivery_status?: string;
          sent_at?: string;
          status?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_member_invites_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      business_members: {
        Row: {
          business_id: string;
          id: string;
          invite_id: string | null;
          invited_by: string | null;
          joined_at: string;
          resident_id: string;
          revoked_at: string | null;
          status: string;
        };
        Insert: {
          business_id: string;
          id?: string;
          invite_id?: string | null;
          invited_by?: string | null;
          joined_at?: string;
          resident_id: string;
          revoked_at?: string | null;
          status?: string;
        };
        Update: {
          business_id?: string;
          id?: string;
          invite_id?: string | null;
          invited_by?: string | null;
          joined_at?: string;
          resident_id?: string;
          revoked_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_members_invite_fk";
            columns: ["invite_id"];
            isOneToOne: false;
            referencedRelation: "business_member_invites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_members_resident_id_fkey";
            columns: ["resident_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["id"];
          },
        ];
      };
      business_memberships: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          role: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          role: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          role?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_memberships_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      business_subscriptions: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          resident_id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          resident_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          resident_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_subscriptions_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_subscriptions_resident_id_fkey";
            columns: ["resident_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["id"];
          },
        ];
      };
      business_updates: {
        Row: {
          business_id: string;
          content: string;
          created_at: string;
          id: string;
          posted_by: string | null;
        };
        Insert: {
          business_id: string;
          content: string;
          created_at?: string;
          id?: string;
          posted_by?: string | null;
        };
        Update: {
          business_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          posted_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "business_updates_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_updates_posted_by_fkey";
            columns: ["posted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          address: string | null;
          approved_at: string | null;
          approved_by: string | null;
          category_id: string;
          claimed_at: string | null;
          cover_photo_url: string | null;
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          email: string | null;
          id: string;
          location: Json | null;
          logo_url: string | null;
          name: string;
          phone: string | null;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          show_email: boolean;
          social_links: Json | null;
          status: Database["public"]["Enums"]["business_status"];
          town_id: string | null;
          updated_at: string;
          user_id: string | null;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          category_id: string;
          claimed_at?: string | null;
          cover_photo_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          email?: string | null;
          id?: string;
          location?: Json | null;
          logo_url?: string | null;
          name: string;
          phone?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          show_email?: boolean;
          social_links?: Json | null;
          status?: Database["public"]["Enums"]["business_status"];
          town_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          category_id?: string;
          claimed_at?: string | null;
          cover_photo_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          email?: string | null;
          id?: string;
          location?: Json | null;
          logo_url?: string | null;
          name?: string;
          phone?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          show_email?: boolean;
          social_links?: Json | null;
          status?: Database["public"]["Enums"]["business_status"];
          town_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_approved_by_profiles_id_fk";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "businesses_category_id_business_categories_id_fk";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "business_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "businesses_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "businesses_rejected_by_profiles_id_fk";
            columns: ["rejected_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "businesses_town_id_towns_id_fk";
            columns: ["town_id"];
            isOneToOne: false;
            referencedRelation: "towns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "businesses_user_id_profiles_id_fk";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      event_reminders: {
        Row: {
          created_at: string;
          flyer_event_id: string;
          flyer_id: string;
          id: string;
          resident_id: string;
        };
        Insert: {
          created_at?: string;
          flyer_event_id: string;
          flyer_id: string;
          id?: string;
          resident_id: string;
        };
        Update: {
          created_at?: string;
          flyer_event_id?: string;
          flyer_id?: string;
          id?: string;
          resident_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_reminders_flyer_event_id_fkey";
            columns: ["flyer_event_id"];
            isOneToOne: false;
            referencedRelation: "flyer_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_reminders_flyer_id_fkey";
            columns: ["flyer_id"];
            isOneToOne: false;
            referencedRelation: "flyers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_reminders_resident_id_fkey";
            columns: ["resident_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["id"];
          },
        ];
      };
      flyer_categories: {
        Row: {
          created_at: string;
          display_order: number | null;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          display_order?: number | null;
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          display_order?: number | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      flyer_checkins: {
        Row: {
          checked_in_at: string;
          flyer_event_id: string;
          flyer_id: string;
          id: string;
          resident_id: string;
        };
        Insert: {
          checked_in_at?: string;
          flyer_event_id: string;
          flyer_id: string;
          id?: string;
          resident_id: string;
        };
        Update: {
          checked_in_at?: string;
          flyer_event_id?: string;
          flyer_id?: string;
          id?: string;
          resident_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flyer_checkins_flyer_event_id_fkey";
            columns: ["flyer_event_id"];
            isOneToOne: false;
            referencedRelation: "flyer_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flyer_checkins_flyer_id_fkey";
            columns: ["flyer_id"];
            isOneToOne: false;
            referencedRelation: "flyers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flyer_checkins_resident_id_fkey";
            columns: ["resident_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["id"];
          },
        ];
      };
      flyer_events: {
        Row: {
          check_in_count: number;
          created_at: string;
          description: string | null;
          ends_at: string | null;
          flyer_id: string;
          id: string;
          recurrence_rule: string | null;
          recurrence_until: string | null;
          sort_order: number;
          starts_at: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          check_in_count?: number;
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          flyer_id: string;
          id?: string;
          recurrence_rule?: string | null;
          recurrence_until?: string | null;
          sort_order?: number;
          starts_at: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          check_in_count?: number;
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          flyer_id?: string;
          id?: string;
          recurrence_rule?: string | null;
          recurrence_until?: string | null;
          sort_order?: number;
          starts_at?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flyer_events_flyer_id_fkey";
            columns: ["flyer_id"];
            isOneToOne: false;
            referencedRelation: "flyers";
            referencedColumns: ["id"];
          },
        ];
      };
      flyer_shares: {
        Row: {
          flyer_id: string;
          id: string;
          share_token: string;
          shared_at: string;
          user_id: string | null;
        };
        Insert: {
          flyer_id: string;
          id?: string;
          share_token: string;
          shared_at?: string;
          user_id?: string | null;
        };
        Update: {
          flyer_id?: string;
          id?: string;
          share_token?: string;
          shared_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "flyer_shares_flyer_id_flyers_id_fk";
            columns: ["flyer_id"];
            isOneToOne: false;
            referencedRelation: "flyers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flyer_shares_user_id_profiles_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      flyer_tags: {
        Row: {
          created_at: string;
          flyer_id: string;
          id: string;
          tag_id: string;
        };
        Insert: {
          created_at?: string;
          flyer_id: string;
          id?: string;
          tag_id: string;
        };
        Update: {
          created_at?: string;
          flyer_id?: string;
          id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flyer_tags_flyer_id_flyers_id_fk";
            columns: ["flyer_id"];
            isOneToOne: false;
            referencedRelation: "flyers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flyer_tags_tag_id_tags_id_fk";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      flyer_views: {
        Row: {
          flyer_id: string;
          id: string;
          user_id: string | null;
          view_type: string;
          viewed_at: string;
        };
        Insert: {
          flyer_id: string;
          id?: string;
          user_id?: string | null;
          view_type: string;
          viewed_at?: string;
        };
        Update: {
          flyer_id?: string;
          id?: string;
          user_id?: string | null;
          view_type?: string;
          viewed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flyer_views_flyer_id_flyers_id_fk";
            columns: ["flyer_id"];
            isOneToOne: false;
            referencedRelation: "flyers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flyer_views_user_id_profiles_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      flyers: {
        Row: {
          age_max_months: number | null;
          age_min_months: number | null;
          age_restriction: number | null;
          approved_at: string | null;
          approved_by: string | null;
          business_id: string;
          buzzing_threshold: number | null;
          category_id: string;
          check_in_count: number;
          cover_photo_url: string | null;
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          event_date: string;
          event_end_date: string | null;
          event_time: string | null;
          expires_at: string | null;
          external_link: string | null;
          flyer_type: Database["public"]["Enums"]["flyer_type"];
          id: string;
          is_buzzing: boolean;
          live_at: string | null;
          location: Json | null;
          location_address: string;
          location_name: string | null;
          media_type: string;
          media_url: string;
          posted_by: string | null;
          recurrence_rule: string | null;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          save_count: number;
          share_count: number;
          status: Database["public"]["Enums"]["flyer_status"];
          title: string;
          town_id: string | null;
          updated_at: string;
          view_count: number;
          visibility: Database["public"]["Enums"]["flyer_visibility"];
        };
        Insert: {
          age_max_months?: number | null;
          age_min_months?: number | null;
          age_restriction?: number | null;
          approved_at?: string | null;
          approved_by?: string | null;
          business_id: string;
          buzzing_threshold?: number | null;
          category_id: string;
          check_in_count?: number;
          cover_photo_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          event_date: string;
          event_end_date?: string | null;
          event_time?: string | null;
          expires_at?: string | null;
          external_link?: string | null;
          flyer_type?: Database["public"]["Enums"]["flyer_type"];
          id?: string;
          is_buzzing?: boolean;
          live_at?: string | null;
          location?: Json | null;
          location_address: string;
          location_name?: string | null;
          media_type: string;
          media_url: string;
          posted_by?: string | null;
          recurrence_rule?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          save_count?: number;
          share_count?: number;
          status?: Database["public"]["Enums"]["flyer_status"];
          title: string;
          town_id?: string | null;
          updated_at?: string;
          view_count?: number;
          visibility?: Database["public"]["Enums"]["flyer_visibility"];
        };
        Update: {
          age_max_months?: number | null;
          age_min_months?: number | null;
          age_restriction?: number | null;
          approved_at?: string | null;
          approved_by?: string | null;
          business_id?: string;
          buzzing_threshold?: number | null;
          category_id?: string;
          check_in_count?: number;
          cover_photo_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          event_date?: string;
          event_end_date?: string | null;
          event_time?: string | null;
          expires_at?: string | null;
          external_link?: string | null;
          flyer_type?: Database["public"]["Enums"]["flyer_type"];
          id?: string;
          is_buzzing?: boolean;
          live_at?: string | null;
          location?: Json | null;
          location_address?: string;
          location_name?: string | null;
          media_type?: string;
          media_url?: string;
          posted_by?: string | null;
          recurrence_rule?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          save_count?: number;
          share_count?: number;
          status?: Database["public"]["Enums"]["flyer_status"];
          title?: string;
          town_id?: string | null;
          updated_at?: string;
          view_count?: number;
          visibility?: Database["public"]["Enums"]["flyer_visibility"];
        };
        Relationships: [
          {
            foreignKeyName: "flyers_approved_by_profiles_id_fk";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flyers_business_id_businesses_id_fk";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flyers_category_id_flyer_categories_id_fk";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "flyer_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flyers_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flyers_posted_by_fkey";
            columns: ["posted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flyers_rejected_by_profiles_id_fk";
            columns: ["rejected_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flyers_town_id_towns_id_fk";
            columns: ["town_id"];
            isOneToOne: false;
            referencedRelation: "towns";
            referencedColumns: ["id"];
          },
        ];
      };
      geocode_rate_limits: {
        Row: {
          request_count: number;
          user_id: string;
          window_start: string;
        };
        Insert: {
          request_count?: number;
          user_id: string;
          window_start?: string;
        };
        Update: {
          request_count?: number;
          user_id?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      member_invite_email_verifications: {
        Row: {
          attempts: number;
          code_hash: string;
          expires_at: string;
          id: string;
          invite_email: string;
          requested_at: string;
          user_id: string;
          verified_at: string | null;
        };
        Insert: {
          attempts?: number;
          code_hash: string;
          expires_at: string;
          id?: string;
          invite_email: string;
          requested_at?: string;
          user_id: string;
          verified_at?: string | null;
        };
        Update: {
          attempts?: number;
          code_hash?: string;
          expires_at?: string;
          id?: string;
          invite_email?: string;
          requested_at?: string;
          user_id?: string;
          verified_at?: string | null;
        };
        Relationships: [];
      };
      notification_logs: {
        Row: {
          business_update_id: string | null;
          channel: string;
          flyer_event_id: string | null;
          flyer_id: string | null;
          id: string;
          member_invite_id: string | null;
          occurrence_start: string | null;
          resident_id: string;
          sent_at: string;
          type: string;
        };
        Insert: {
          business_update_id?: string | null;
          channel: string;
          flyer_event_id?: string | null;
          flyer_id?: string | null;
          id?: string;
          member_invite_id?: string | null;
          occurrence_start?: string | null;
          resident_id: string;
          sent_at?: string;
          type: string;
        };
        Update: {
          business_update_id?: string | null;
          channel?: string;
          flyer_event_id?: string | null;
          flyer_id?: string | null;
          id?: string;
          member_invite_id?: string | null;
          occurrence_start?: string | null;
          resident_id?: string;
          sent_at?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_logs_business_update_id_fkey";
            columns: ["business_update_id"];
            isOneToOne: false;
            referencedRelation: "business_updates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_logs_flyer_id_fkey";
            columns: ["flyer_id"];
            isOneToOne: false;
            referencedRelation: "flyers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_logs_member_invite_id_fkey";
            columns: ["member_invite_id"];
            isOneToOne: false;
            referencedRelation: "business_member_invites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_logs_resident_id_fkey";
            columns: ["resident_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          contact_email: string | null;
          created_at: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          onboarding_completed: boolean;
          role: Database["public"]["Enums"]["user_role"];
          settings: Json;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          contact_email?: string | null;
          created_at?: string;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          onboarding_completed?: boolean;
          role: Database["public"]["Enums"]["user_role"];
          settings?: Json;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          contact_email?: string | null;
          created_at?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          onboarding_completed?: boolean;
          role?: Database["public"]["Enums"]["user_role"];
          settings?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          created_at: string;
          id: string;
          platform: string;
          resident_id: string;
          token: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          platform: string;
          resident_id: string;
          token: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          platform?: string;
          resident_id?: string;
          token?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_tokens_resident_id_fkey";
            columns: ["resident_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["id"];
          },
        ];
      };
      resident_saved_flyers: {
        Row: {
          flyer_id: string;
          id: string;
          resident_id: string;
          saved_at: string;
        };
        Insert: {
          flyer_id: string;
          id?: string;
          resident_id: string;
          saved_at?: string;
        };
        Update: {
          flyer_id?: string;
          id?: string;
          resident_id?: string;
          saved_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resident_saved_flyers_flyer_id_flyers_id_fk";
            columns: ["flyer_id"];
            isOneToOne: false;
            referencedRelation: "flyers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resident_saved_flyers_resident_id_residents_id_fk";
            columns: ["resident_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["id"];
          },
        ];
      };
      residents: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          home_town_id: string | null;
          id: string;
          settings: Json | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          home_town_id?: string | null;
          id?: string;
          settings?: Json | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          home_town_id?: string | null;
          id?: string;
          settings?: Json | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "residents_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "residents_home_town_id_towns_id_fk";
            columns: ["home_town_id"];
            isOneToOne: false;
            referencedRelation: "towns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "residents_user_id_profiles_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_flyers: {
        Row: {
          flyer_id: string;
          id: string;
          saved_at: string;
          user_id: string;
        };
        Insert: {
          flyer_id: string;
          id?: string;
          saved_at?: string;
          user_id: string;
        };
        Update: {
          flyer_id?: string;
          id?: string;
          saved_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_flyers_flyer_id_flyers_id_fk";
            columns: ["flyer_id"];
            isOneToOne: false;
            referencedRelation: "flyers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_flyers_user_id_profiles_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      towns: {
        Row: {
          bounding_box: Json;
          center: Json;
          county_id: string;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          bounding_box: Json;
          center: Json;
          county_id?: string;
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          bounding_box?: Json;
          center?: Json;
          county_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_member_invite: {
        Args: { p_token: string };
        Returns: Database["public"]["CompositeTypes"]["member_invite_accept_result"][];
        SetofOptions: {
          from: "*";
          to: "member_invite_accept_result";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      admin_hard_delete_entity: {
        Args: { p_entity: string; p_id: string };
        Returns: undefined;
      };
      admin_restore_entity: {
        Args: { p_entity: string; p_id: string };
        Returns: undefined;
      };
      admin_soft_delete_entity: {
        Args: { p_entity: string; p_id: string };
        Returns: undefined;
      };
      app_instant: { Args: { p: string }; Returns: string };
      app_timezone: { Args: never; Returns: string };
      approve_business_claim: { Args: { p_claim_id: string }; Returns: string };
      auth_admin_can_post_for_business: {
        Args: { p_business_id: string };
        Returns: boolean;
      };
      auth_user_can_manage_flyer: {
        Args: { p_flyer_id: string };
        Returns: boolean;
      };
      check_geocode_rate_limit: {
        Args: { p_limit: number; p_user_id: string; p_window_seconds: number };
        Returns: boolean;
      };
      compute_flyer_expires_at: {
        Args: {
          p_flyer_id: string;
          p_status: Database["public"]["Enums"]["flyer_status"];
        };
        Returns: string;
      };
      count_businesses_by_status: {
        Args: never;
        Returns: {
          count: number;
          status: Database["public"]["Enums"]["business_status"];
        }[];
      };
      count_flyers_by_status: {
        Args: never;
        Returns: {
          count: number;
          status: Database["public"]["Enums"]["flyer_status"];
        }[];
      };
      create_admin_account: {
        Args: { admin_email: string; admin_password: string };
        Returns: Json;
      };
      create_member_invites: {
        Args: { p_business_id: string; p_emails: string[] };
        Returns: Database["public"]["CompositeTypes"]["member_invite_create_result"][];
        SetofOptions: {
          from: "*";
          to: "member_invite_create_result";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      current_resident_id: { Args: never; Returns: string };
      current_user_role: { Args: never; Returns: string };
      debug_profile_state: { Args: { user_id: string }; Returns: Json };
      delete_account: { Args: never; Returns: undefined };
      ensure_admin_profile: { Args: { user_id_input: string }; Returns: Json };
      expire_pending_member_invites: {
        Args: { p_business_id: string };
        Returns: number;
      };
      flyer_event_is_past: {
        Args: {
          p_ends_at: string;
          p_recurrence_rule: string;
          p_recurrence_until: string;
          p_starts_at: string;
        };
        Returns: boolean;
      };
      flyer_event_span_end: {
        Args: {
          p_ends_at: string;
          p_recurrence_rule: string;
          p_recurrence_until: string;
          p_starts_at: string;
        };
        Returns: string;
      };
      from_naive_ts: { Args: { p: string }; Returns: string };
      get_admin_deleted_businesses: {
        Args: never;
        Returns: {
          category_name: string;
          deleted_at: string;
          deleted_by: string;
          email: string;
          id: string;
          logo_url: string;
          name: string;
          status: Database["public"]["Enums"]["business_status"];
          town_name: string;
        }[];
      };
      get_admin_residents: {
        Args: never;
        Returns: {
          avatar_url: string;
          contact_email: string;
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          town_id: string;
          town_name: string;
          user_id: string;
        }[];
      };
      get_business_member_count: {
        Args: { p_business_id: string };
        Returns: number;
      };
      get_business_members: {
        Args: { p_business_id: string };
        Returns: {
          avatar_url: string;
          email: string;
          first_name: string;
          joined_at: string;
          last_name: string;
          member_id: string;
          resident_id: string;
          status: string;
          user_id: string;
        }[];
      };
      get_business_subscribers: {
        Args: { p_business_id: string };
        Returns: {
          avatar_url: string;
          email: string;
          first_name: string;
          last_name: string;
          resident_id: string;
          subscribed_at: string;
          subscription_id: string;
          user_id: string;
        }[];
      };
      has_verified_member_invite_email: {
        Args: { p_invite_email: string };
        Returns: boolean;
      };
      invoke_event_reminder: { Args: never; Returns: undefined };
      invoke_purge_soft_deleted: { Args: never; Returns: undefined };
      is_admin: { Args: never; Returns: boolean };
      is_business: { Args: never; Returns: boolean };
      is_resident: { Args: never; Returns: boolean };
      mark_member_invite_delivery: {
        Args: { p_error?: string; p_failed: boolean; p_invite_id: string };
        Returns: undefined;
      };
      naive_ts: { Args: { p: string }; Returns: string };
      notify_flyer_events_changed: {
        Args: { p_changes: Json; p_flyer_id: string };
        Returns: undefined;
      };
      owns_business: { Args: { business_id: string }; Returns: boolean };
      preview_member_invite: {
        Args: { p_token: string };
        Returns: {
          business_id: string;
          business_logo_url: string;
          business_name: string;
          email: string;
          expires_at: string;
          invite_id: string;
          status: string;
        }[];
      };
      recompute_flyer_schedule_summary: {
        Args: { p_flyer_id: string };
        Returns: undefined;
      };
      reject_business_claim: {
        Args: { p_claim_id: string; p_reason: string };
        Returns: string;
      };
      submit_business_claim_with_token: {
        Args: {
          p_contact_email?: string;
          p_contact_name?: string;
          p_contact_phone?: string;
          p_message?: string;
          p_token: string;
        };
        Returns: {
          business_id: string;
          claimant_user_id: string;
          contact_email: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          created_at: string;
          id: string;
          message: string | null;
          rejection_reason: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["business_claim_status"];
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "business_claims";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      upsert_flyer_with_events: {
        Args: { p_events: Json; p_flyer: Json };
        Returns: {
          age_max_months: number | null;
          age_min_months: number | null;
          age_restriction: number | null;
          approved_at: string | null;
          approved_by: string | null;
          business_id: string;
          buzzing_threshold: number | null;
          category_id: string;
          check_in_count: number;
          cover_photo_url: string | null;
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          event_date: string;
          event_end_date: string | null;
          event_time: string | null;
          expires_at: string | null;
          external_link: string | null;
          flyer_type: Database["public"]["Enums"]["flyer_type"];
          id: string;
          is_buzzing: boolean;
          live_at: string | null;
          location: Json | null;
          location_address: string;
          location_name: string | null;
          media_type: string;
          media_url: string;
          posted_by: string | null;
          recurrence_rule: string | null;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          save_count: number;
          share_count: number;
          status: Database["public"]["Enums"]["flyer_status"];
          title: string;
          town_id: string | null;
          updated_at: string;
          view_count: number;
          visibility: Database["public"]["Enums"]["flyer_visibility"];
        };
        SetofOptions: {
          from: "*";
          to: "flyers";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      upsert_profile_for_oauth: {
        Args: {
          p_first_name?: string;
          p_last_name?: string;
          user_id: string;
          user_role: string;
        };
        Returns: Json;
      };
      validate_business_claim_token: {
        Args: { p_token: string };
        Returns: {
          business_email: string;
          business_id: string;
          business_logo_url: string;
          business_name: string;
          expires_at: string;
          invite_email: string;
        }[];
      };
      verify_member_invite_email: {
        Args: { p_code: string; p_invite_email: string };
        Returns: boolean;
      };
    };
    Enums: {
      business_claim_status: "pending" | "approved" | "rejected";
      business_status: "pending" | "approved" | "rejected";
      flyer_status:
        | "draft"
        | "pending"
        | "approved"
        | "rejected"
        | "live"
        | "expired"
        | "archived";
      flyer_type: "single" | "multi";
      flyer_visibility: "public" | "members_only";
      user_role: "resident" | "business" | "admin";
    };
    CompositeTypes: {
      member_invite_accept_result: {
        accepted_business_id: string | null;
        accepted_member_id: string | null;
      };
      member_invite_create_result: {
        invite_id: string | null;
        recipient_email: string | null;
        outcome: string | null;
      };
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      business_claim_status: ["pending", "approved", "rejected"],
      business_status: ["pending", "approved", "rejected"],
      flyer_status: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "live",
        "expired",
        "archived",
      ],
      flyer_type: ["single", "multi"],
      flyer_visibility: ["public", "members_only"],
      user_role: ["resident", "business", "admin"],
    },
  },
} as const;
