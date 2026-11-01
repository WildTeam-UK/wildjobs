export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      candidate_career_area_preferences: {
        Row: {
          career_area_id: number;
          created_at: string;
          user_id: string;
        };
        Insert: {
          career_area_id: number;
          created_at?: string;
          user_id: string;
        };
        Update: {
          career_area_id?: number;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "candidate_career_area_preferences_career_area_id_fkey";
            columns: ["career_area_id"];
            isOneToOne: false;
            referencedRelation: "career_areas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "candidate_career_area_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "candidate_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      candidate_contract_preferences: {
        Row: {
          contract_type: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          contract_type: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          contract_type?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "candidate_contract_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "candidate_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      candidate_hours_preferences: {
        Row: {
          created_at: string;
          hours_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          hours_type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          hours_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "candidate_hours_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "candidate_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      candidate_preferences: {
        Row: {
          created_at: string;
          experience_level: string;
          preferred_location: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          experience_level?: string;
          preferred_location?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          experience_level?: string;
          preferred_location?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "candidate_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "candidate_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      candidate_profiles: {
        Row: {
          created_at: string;
          onboarding_complete: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          onboarding_complete?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          onboarding_complete?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      candidate_workplace_preferences: {
        Row: {
          created_at: string;
          user_id: string;
          workplace_type: string;
        };
        Insert: {
          created_at?: string;
          user_id: string;
          workplace_type: string;
        };
        Update: {
          created_at?: string;
          user_id?: string;
          workplace_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "candidate_workplace_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "candidate_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      career_areas: {
        Row: {
          created_at: string;
          description: string | null;
          display_order: number;
          id: number;
          is_active: boolean;
          slug: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: never;
          is_active?: boolean;
          slug: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: never;
          is_active?: boolean;
          slug?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          availability_status: string;
          capability_taxonomy_generated_at: string | null;
          capability_taxonomy_policy_version: string | null;
          capability_taxonomy_source_hash: string | null;
          created_at: string;
          display_order: number;
          id: number;
          image_alt: string | null;
          image_url: string | null;
          is_active: boolean;
          is_filter_visible: boolean;
          is_job_search_excluded: boolean;
          learnworlds_course_id: string;
          learnworlds_synced_at: string | null;
          matching_notes: string;
          provenance: string;
          public_url: string;
          reviewed_at: string;
          short_title: string;
          slug: string;
          summary: string;
          theme_colour: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          availability_status?: string;
          capability_taxonomy_generated_at?: string | null;
          capability_taxonomy_policy_version?: string | null;
          capability_taxonomy_source_hash?: string | null;
          created_at?: string;
          display_order?: number;
          id?: never;
          image_alt?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          is_filter_visible?: boolean;
          is_job_search_excluded?: boolean;
          learnworlds_course_id: string;
          learnworlds_synced_at?: string | null;
          matching_notes?: string;
          provenance: string;
          public_url: string;
          reviewed_at: string;
          short_title: string;
          slug: string;
          summary: string;
          theme_colour?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          availability_status?: string;
          capability_taxonomy_generated_at?: string | null;
          capability_taxonomy_policy_version?: string | null;
          capability_taxonomy_source_hash?: string | null;
          created_at?: string;
          display_order?: number;
          id?: never;
          image_alt?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          is_filter_visible?: boolean;
          is_job_search_excluded?: boolean;
          learnworlds_course_id?: string;
          learnworlds_synced_at?: string | null;
          matching_notes?: string;
          provenance?: string;
          public_url?: string;
          reviewed_at?: string;
          short_title?: string;
          slug?: string;
          summary?: string;
          theme_colour?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      directory_sources: {
        Row: {
          id: number;
          name: string;
          feed_url: string;
          enabled: boolean;
          removed_at: string | null;
          next_feed_at: string;
          last_feed_at: string | null;
          last_error: string | null;
          last_seen_count: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          feed_url: string;
          enabled?: boolean;
          removed_at?: string | null;
          next_feed_at?: string;
          last_feed_at?: string | null;
          last_error?: string | null;
          last_seen_count?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          feed_url?: string;
          enabled?: boolean;
          removed_at?: string | null;
          next_feed_at?: string;
          last_feed_at?: string | null;
          last_error?: string | null;
          last_seen_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      directory_source_jobs: {
        Row: {
          source_id: number;
          external_id: string;
          job_id: number;
          content_hash: string;
          payload: Json;
          is_present: boolean;
          last_seen_at: string;
        };
        Insert: {
          source_id: number;
          external_id: string;
          job_id: number;
          content_hash: string;
          payload: Json;
          is_present?: boolean;
          last_seen_at?: string;
        };
        Update: {
          source_id?: number;
          external_id?: string;
          job_id?: number;
          content_hash?: string;
          payload?: Json;
          is_present?: boolean;
          last_seen_at?: string;
        };
        Relationships: [];
      };
      directory_jobs: {
        Row: {
          primary_source_id: number | null;
          primary_external_id: string | null;
          source_name: string;
          canonical_url: string | null;
          identity_key: string | null;
          merged_into: number | null;

          closes_at: string | null;
          contract_type: string | null;
          country_code: string | null;
          course_slugs: string[];
          engagement_type: string | null;
          feed_hash: string;
          feed_id: string;
          feed_text: string;
          first_seen_at: string;
          hours_type: string | null;
          id: number;
          is_active: boolean;
          last_seen_at: string;
          locality: string | null;
          location_text: string;
          organisation_name: string;
          posted_at: string;
          processed_hash: string | null;
          region: string | null;
          salary_min: number | null;
          salary_text: string;
          sector_slugs: string[];
          slug: string;
          source_url: string;
          summary: string;
          summary_source: string;
          title: string;
          updated_at: string;
          workplace: string;
        };
        Insert: {
          primary_source_id?: number | null;
          primary_external_id?: string | null;
          source_name?: string;
          canonical_url?: string | null;
          identity_key?: string | null;
          merged_into?: number | null;

          closes_at?: string | null;
          contract_type?: string | null;
          country_code?: string | null;
          course_slugs?: string[];
          engagement_type?: string | null;
          feed_hash: string;
          feed_id: string;
          feed_text: string;
          first_seen_at?: string;
          hours_type?: string | null;
          id?: never;
          is_active?: boolean;
          last_seen_at?: string;
          locality?: string | null;
          location_text: string;
          organisation_name: string;
          posted_at: string;
          processed_hash?: string | null;
          region?: string | null;
          salary_min?: number | null;
          salary_text: string;
          sector_slugs?: string[];
          slug: string;
          source_url: string;
          summary: string;
          summary_source?: string;
          title: string;
          updated_at?: string;
          workplace?: string;
        };
        Update: {
          primary_source_id?: number | null;
          primary_external_id?: string | null;
          source_name?: string;
          canonical_url?: string | null;
          identity_key?: string | null;
          merged_into?: number | null;

          closes_at?: string | null;
          contract_type?: string | null;
          country_code?: string | null;
          course_slugs?: string[];
          engagement_type?: string | null;
          feed_hash?: string;
          feed_id?: string;
          feed_text?: string;
          first_seen_at?: string;
          hours_type?: string | null;
          id?: never;
          is_active?: boolean;
          last_seen_at?: string;
          locality?: string | null;
          location_text?: string;
          organisation_name?: string;
          posted_at?: string;
          processed_hash?: string | null;
          region?: string | null;
          salary_min?: number | null;
          salary_text?: string;
          sector_slugs?: string[];
          slug?: string;
          source_url?: string;
          summary?: string;
          summary_source?: string;
          title?: string;
          updated_at?: string;
          workplace?: string;
        };
        Relationships: [];
      };
      directory_organisations: {
        Row: {
          logo_url: string | null;
          name: string;
        };
        Insert: {
          logo_url?: string | null;
          name: string;
        };
        Update: {
          logo_url?: string | null;
          name?: string;
        };
        Relationships: [];
      };
      directory_runs: {
        Row: {
          ai_completed: number;
          changed: number;
          error: string | null;
          estimated_cost_usd: number;
          feed_seen: number;
          finished_at: string | null;
          id: number;
          input_tokens: number;
          output_tokens: number;
          started_at: string;
          status: string;
        };
        Insert: {
          ai_completed?: number;
          changed?: number;
          error?: string | null;
          estimated_cost_usd?: number;
          feed_seen?: number;
          finished_at?: string | null;
          id?: never;
          input_tokens?: number;
          output_tokens?: number;
          started_at?: string;
          status?: string;
        };
        Update: {
          ai_completed?: number;
          changed?: number;
          error?: string | null;
          estimated_cost_usd?: number;
          feed_seen?: number;
          finished_at?: string | null;
          id?: never;
          input_tokens?: number;
          output_tokens?: number;
          started_at?: string;
          status?: string;
        };
        Relationships: [];
      };
      directory_saved_jobs: {
        Row: {
          job_id: number;
          saved_at: string;
          user_id: string;
        };
        Insert: {
          job_id: number;
          saved_at?: string;
          user_id: string;
        };
        Update: {
          job_id?: number;
          saved_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "directory_saved_jobs_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "directory_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "directory_saved_jobs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "candidate_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      directory_settings: {
        Row: {
          enabled: boolean;
          id: boolean;
          last_error: string | null;
          last_feed_at: string | null;
          next_feed_at: string;
          running_until: string | null;
        };
        Insert: {
          enabled?: boolean;
          id?: boolean;
          last_error?: string | null;
          last_feed_at?: string | null;
          next_feed_at?: string;
          running_until?: string | null;
        };
        Update: {
          enabled?: boolean;
          id?: boolean;
          last_error?: string | null;
          last_feed_at?: string | null;
          next_feed_at?: string;
          running_until?: string | null;
        };
        Relationships: [];
      };
      staff_members: {
        Row: {
          created_at: string;
          is_active: boolean;
          role: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          is_active?: boolean;
          role: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          is_active?: boolean;
          role?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      directory_card_counts: { Args: Record<PropertyKey, never>; Returns: Json };
      finish_directory_run: {
        Args: { p_run_id: number; p_stats: Json; p_error?: string | null };
        Returns: undefined;
      };
      import_directory_feed: {
        Args: { p_source_id: number; p_feed_url: string; p_items: Json };
        Returns: Json;
      };
      apply_directory_job: {
        Args: { p_job_id: number; p_feed_hash: string; p_fields: Json; p_ai?: boolean };
        Returns: Json;
      };
      manage_directory_source: {
        Args: { p_action: string; p_id?: number | null; p_url?: string | null; p_name?: string | null };
        Returns: number;
      };
      directory_pending_jobs: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Tables"]["directory_jobs"]["Row"][];
      };

      claim_directory_run: { Args: { p_force?: boolean }; Returns: boolean };
      replace_candidate_preferences: {
        Args: {
          p_career_area_ids: number[];
          p_contract_types: string[];
          p_experience_level: string;
          p_hours_types: string[];
          p_preferred_location: string;
          p_workplace_types: string[];
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
