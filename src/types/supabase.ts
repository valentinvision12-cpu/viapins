/**
 * Supabase Database type definitions.
 * Regenerate with: npx supabase gen types typescript --project-id <id> > src/types/supabase.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];


export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      destinations: {
        Row: {
          id: string;
          country: string;
          city: string;
          tags: string[];
          published: boolean;
          cover_image: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          country: string;
          city: string;
          tags?: string[];
          published?: boolean;
          cover_image?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          country?: string;
          city?: string;
          tags?: string[];
          published?: boolean;
          cover_image?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "places_destination_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["destination_id"];
          },
        ];
      };
      places: {
        Row: {
          id: string;
          destination_id: string;
          name: string;
          translations: Json;
          image_url: string | null;
          lat: number | null;
          lng: number | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          destination_id: string;
          name: string;
          translations?: Json;
          image_url?: string | null;
          lat?: number | null;
          lng?: number | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          destination_id?: string;
          name?: string;
          translations?: Json;
          image_url?: string | null;
          lat?: number | null;
          lng?: number | null;
          order_index?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "places_destination_id_fkey";
            columns: ["destination_id"];
            isOneToOne: false;
            referencedRelation: "destinations";
            referencedColumns: ["id"];
          },
        ];
      };
      user_routes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          route_places: Json;
          status: "saved" | "visited";
          travel_date: string | null;
          city: string | null;
          country: string | null;
          route_type: "city" | "country";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          route_places?: Json;
          status?: "saved" | "visited";
          travel_date?: string | null;
          city?: string | null;
          country?: string | null;
          route_type?: "city" | "country";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          route_places?: Json;
          status?: "saved" | "visited";
          travel_date?: string | null;
          city?: string | null;
          country?: string | null;
          route_type?: "city" | "country";
          updated_at?: string;
        };
        Relationships: [];
      };
      user_favorites: {
        Row: {
          id: string;
          user_id: string;
          place_id: string;
          name: string;
          city: string;
          country: string;
          image_url: string;
          lat: number;
          lng: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          place_id: string;
          name: string;
          city: string;
          country: string;
          image_url?: string;
          lat?: number;
          lng?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          place_id?: string;
          name?: string;
          city?: string;
          country?: string;
          image_url?: string;
          lat?: number;
          lng?: number;
        };
        Relationships: [];
      };
      adventure_collections: {
        Row: {
          id: string;
          country: string;
          slug: string;
          title: string;
          subtitle: string;
          hero_image: string | null;
          wiki_title: string | null;
          total_days: number;
          seo: Json;
          places: Json;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          country: string;
          slug: string;
          title: string;
          subtitle: string;
          hero_image?: string | null;
          wiki_title?: string | null;
          total_days?: number;
          seo?: Json;
          places?: Json;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          country?: string;
          slug?: string;
          title?: string;
          subtitle?: string;
          hero_image?: string | null;
          wiki_title?: string | null;
          total_days?: number;
          seo?: Json;
          places?: Json;
          published?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: number;
          hero_titles: Json;
          social_links: Json;
          ad_scripts: Json;
          affiliate_config: Json;
          updated_at: string;
        };
        Insert: {
          id?: number;
          hero_titles?: Json;
          social_links?: Json;
          ad_scripts?: Json;
          affiliate_config?: Json;
          updated_at?: string;
        };
        Update: {
          hero_titles?: Json;
          social_links?: Json;
          ad_scripts?: Json;
          affiliate_config?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
