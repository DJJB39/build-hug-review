export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      handicap_events: {
        Row: {
          created_at: string
          handicap_after: number
          handicap_before: number
          id: string
          index_after: number
          index_before: number
          index_delta: number
          match_id: string | null
          notes: string | null
          reason: Database["public"]["Enums"]["handicap_reason"]
          user_id: string
        }
        Insert: {
          created_at?: string
          handicap_after: number
          handicap_before: number
          id?: string
          index_after: number
          index_before: number
          index_delta: number
          match_id?: string | null
          notes?: string | null
          reason: Database["public"]["Enums"]["handicap_reason"]
          user_id: string
        }
        Update: {
          created_at?: string
          handicap_after?: number
          handicap_before?: number
          id?: string
          index_after?: number
          index_before?: number
          index_delta?: number
          match_id?: string | null
          notes?: string | null
          reason?: Database["public"]["Enums"]["handicap_reason"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "handicap_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      league_members: {
        Row: {
          id: string
          joined_at: string
          league_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          league_id: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          league_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_members_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          combined_scoring: boolean
          created_at: string
          description: string | null
          format: Database["public"]["Enums"]["league_format"]
          handicap_enabled: boolean
          id: string
          join_code: string
          max_players: number | null
          name: string
          owner_id: string
          status: Database["public"]["Enums"]["league_status"]
          target_score: number
          updated_at: string
        }
        Insert: {
          combined_scoring?: boolean
          created_at?: string
          description?: string | null
          format?: Database["public"]["Enums"]["league_format"]
          handicap_enabled?: boolean
          id?: string
          join_code?: string
          max_players?: number | null
          name: string
          owner_id: string
          status?: Database["public"]["Enums"]["league_status"]
          target_score?: number
          updated_at?: string
        }
        Update: {
          combined_scoring?: boolean
          created_at?: string
          description?: string | null
          format?: Database["public"]["Enums"]["league_format"]
          handicap_enabled?: boolean
          id?: string
          join_code?: string
          max_players?: number | null
          name?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["league_status"]
          target_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      match_confirmations: {
        Row: {
          created_at: string
          id: string
          match_id: string
          note: string | null
          responded_at: string | null
          state: Database["public"]["Enums"]["confirmation_state"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          note?: string | null
          responded_at?: string | null
          state?: Database["public"]["Enums"]["confirmation_state"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          note?: string | null
          responded_at?: string | null
          state?: Database["public"]["Enums"]["confirmation_state"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_confirmations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_side_players: {
        Row: {
          ball_colour: Database["public"]["Enums"]["ball_colour"]
          handicap_snapshot: number
          id: string
          index_snapshot: number
          side_id: string
          user_id: string
        }
        Insert: {
          ball_colour?: Database["public"]["Enums"]["ball_colour"]
          handicap_snapshot: number
          id?: string
          index_snapshot: number
          side_id: string
          user_id: string
        }
        Update: {
          ball_colour?: Database["public"]["Enums"]["ball_colour"]
          handicap_snapshot?: number
          id?: string
          index_snapshot?: number
          side_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_side_players_side_id_fkey"
            columns: ["side_id"]
            isOneToOne: false
            referencedRelation: "match_sides"
            referencedColumns: ["id"]
          },
        ]
      }
      match_sides: {
        Row: {
          extra_strokes_received: number
          extra_strokes_used: number
          id: string
          match_id: string
          score: number
          side_number: number
        }
        Insert: {
          extra_strokes_received?: number
          extra_strokes_used?: number
          id?: string
          match_id: string
          score?: number
          side_number: number
        }
        Update: {
          extra_strokes_received?: number
          extra_strokes_used?: number
          id?: string
          match_id?: string
          score?: number
          side_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_sides_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          created_by: string
          ended_at: string | null
          handicap_applied: boolean
          id: string
          league_id: string
          match_type: Database["public"]["Enums"]["match_type"]
          scheduled_for: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["match_status"]
          target_score: number
          updated_at: string
          winner_side: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          ended_at?: string | null
          handicap_applied?: boolean
          id?: string
          league_id: string
          match_type?: Database["public"]["Enums"]["match_type"]
          scheduled_for?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          target_score?: number
          updated_at?: string
          winner_side?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          ended_at?: string | null
          handicap_applied?: boolean
          id?: string
          league_id?: string
          match_type?: Database["public"]["Enums"]["match_type"]
          scheduled_for?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          target_score?: number
          updated_at?: string
          winner_side?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          club: string | null
          created_at: string
          display_name: string
          gc_handicap: number
          gc_index: number
          handicap_source: Database["public"]["Enums"]["handicap_source"]
          id: string
          manual_override_at: string | null
          onboarded_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          club?: string | null
          created_at?: string
          display_name: string
          gc_handicap?: number
          gc_index?: number
          handicap_source?: Database["public"]["Enums"]["handicap_source"]
          id: string
          manual_override_at?: string | null
          onboarded_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          club?: string | null
          created_at?: string
          display_name?: string
          gc_handicap?: number
          gc_index?: number
          handicap_source?: Database["public"]["Enums"]["handicap_source"]
          id?: string
          manual_override_at?: string | null
          onboarded_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_join_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_league_admin: {
        Args: { _league_id: string; _user_id: string }
        Returns: boolean
      }
      is_league_member: {
        Args: { _league_id: string; _user_id: string }
        Returns: boolean
      }
      is_match_participant: {
        Args: { _match_id: string; _user_id: string }
        Returns: boolean
      }
      is_match_visible: {
        Args: { _match_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      ball_colour: "clay" | "ochre" | "navy" | "charcoal"
      confirmation_state: "pending" | "confirmed" | "disputed"
      handicap_reason: "match" | "manual" | "club_override" | "initial"
      handicap_source: "self" | "club" | "system"
      league_format: "singles" | "doubles" | "mixed"
      league_status: "active" | "archived"
      match_status:
        | "scheduled"
        | "live"
        | "awaiting_confirmation"
        | "confirmed"
        | "disputed"
        | "cancelled"
      match_type: "singles" | "doubles"
      member_role: "admin" | "player"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      ball_colour: ["clay", "ochre", "navy", "charcoal"],
      confirmation_state: ["pending", "confirmed", "disputed"],
      handicap_reason: ["match", "manual", "club_override", "initial"],
      handicap_source: ["self", "club", "system"],
      league_format: ["singles", "doubles", "mixed"],
      league_status: ["active", "archived"],
      match_status: [
        "scheduled",
        "live",
        "awaiting_confirmation",
        "confirmed",
        "disputed",
        "cancelled",
      ],
      match_type: ["singles", "doubles"],
      member_role: ["admin", "player"],
    },
  },
} as const
