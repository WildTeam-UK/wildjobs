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
      directory_jobs: {
        Row: {
          canonical_url: string | null;
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
          identity_key: string | null;
          is_active: boolean;
          last_seen_at: string;
          locality: string | null;
          location_text: string;
          merged_into: number | null;
          organisation_name: string;
          posted_at: string;
          primary_external_id: string | null;
          primary_source_id: number | null;
          processed_hash: string | null;
          region: string | null;
          salary_min: number | null;
          salary_text: string;
          sector_slugs: string[];
          slug: string;
          source_name: string;
          source_url: string;
          summary: string;
          summary_source: string;
          title: string;
          updated_at: string;
          workplace: string;
        };
        Insert: {
          canonical_url?: string | null;
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
          identity_key?: string | null;
          is_active?: boolean;
          last_seen_at?: string;
          locality?: string | null;
          location_text: string;
          merged_into?: number | null;
          organisation_name: string;
          posted_at: string;
          primary_external_id?: string | null;
          primary_source_id?: number | null;
          processed_hash?: string | null;
          region?: string | null;
          salary_min?: number | null;
          salary_text: string;
          sector_slugs?: string[];
          slug: string;
          source_name?: string;
          source_url: string;
          summary: string;
          summary_source?: string;
          title: string;
          updated_at?: string;
          workplace?: string;
        };
        Update: {
          canonical_url?: string | null;
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
          identity_key?: string | null;
          is_active?: boolean;
          last_seen_at?: string;
          locality?: string | null;
          location_text?: string;
          merged_into?: number | null;
          organisation_name?: string;
          posted_at?: string;
          primary_external_id?: string | null;
          primary_source_id?: number | null;
          processed_hash?: string | null;
          region?: string | null;
          salary_min?: number | null;
          salary_text?: string;
          sector_slugs?: string[];
          slug?: string;
          source_name?: string;
          source_url?: string;
          summary?: string;
          summary_source?: string;
          title?: string;
          updated_at?: string;
          workplace?: string;
        };
        Relationships: [
          {
            foreignKeyName: "directory_jobs_merged_into_fkey";
            columns: ["merged_into"];
            isOneToOne: false;
            referencedRelation: "directory_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "directory_jobs_primary_source_id_fkey";
            columns: ["primary_source_id"];
            isOneToOne: false;
            referencedRelation: "directory_sources";
            referencedColumns: ["id"];
          },
        ];
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
      directory_source_jobs: {
        Row: {
          content_hash: string;
          external_id: string;
          is_present: boolean;
          job_id: number;
          last_seen_at: string;
          payload: Json;
          source_id: number;
        };
        Insert: {
          content_hash: string;
          external_id: string;
          is_present?: boolean;
          job_id: number;
          last_seen_at?: string;
          payload: Json;
          source_id: number;
        };
        Update: {
          content_hash?: string;
          external_id?: string;
          is_present?: boolean;
          job_id?: number;
          last_seen_at?: string;
          payload?: Json;
          source_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "directory_source_jobs_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "directory_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "directory_source_jobs_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "directory_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      directory_sources: {
        Row: {
          created_at: string;
          enabled: boolean;
          feed_url: string;
          id: number;
          last_error: string | null;
          last_feed_at: string | null;
          last_seen_count: number;
          name: string;
          next_feed_at: string;
          removed_at: string | null;
        };
        Insert: {
          created_at?: string;
          enabled?: boolean;
          feed_url: string;
          id?: never;
          last_error?: string | null;
          last_feed_at?: string | null;
          last_seen_count?: number;
          name: string;
          next_feed_at?: string;
          removed_at?: string | null;
        };
        Update: {
          created_at?: string;
          enabled?: boolean;
          feed_url?: string;
          id?: never;
          last_error?: string | null;
          last_feed_at?: string | null;
          last_seen_count?: number;
          name?: string;
          next_feed_at?: string;
          removed_at?: string | null;
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
      apply_directory_job: {
        Args: {
          p_ai?: boolean;
          p_feed_hash: string;
          p_fields: Json;
          p_job_id: number;
        };
        Returns: Json;
      };
      claim_directory_run: { Args: { p_force?: boolean }; Returns: boolean };
      directory_card_counts: { Args: never; Returns: Json };
      directory_pending_jobs: {
        Args: never;
        Returns: {
          canonical_url: string | null;
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
          identity_key: string | null;
          is_active: boolean;
          last_seen_at: string;
          locality: string | null;
          location_text: string;
          merged_into: number | null;
          organisation_name: string;
          posted_at: string;
          primary_external_id: string | null;
          primary_source_id: number | null;
          processed_hash: string | null;
          region: string | null;
          salary_min: number | null;
          salary_text: string;
          sector_slugs: string[];
          slug: string;
          source_name: string;
          source_url: string;
          summary: string;
          summary_source: string;
          title: string;
          updated_at: string;
          workplace: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "directory_jobs";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      finish_directory_run: {
        Args: { p_error?: string; p_run_id: number; p_stats: Json };
        Returns: undefined;
      };
      import_directory_feed: {
        Args: { p_feed_url: string; p_items: Json; p_source_id: number };
        Returns: Json;
      };
      manage_directory_source: {
        Args: {
          p_action: string;
          p_id?: number;
          p_name?: string;
          p_url?: string;
        };
        Returns: number;
      };
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
