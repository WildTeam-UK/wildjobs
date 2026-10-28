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
      capabilities: {
        Row: {
          created_at: string;
          description: string;
          id: number;
          is_active: boolean;
          slug: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: never;
          is_active?: boolean;
          slug: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: never;
          is_active?: boolean;
          slug?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
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
      course_capabilities: {
        Row: {
          capability_id: number;
          course_id: number;
          created_at: string;
          is_primary: boolean;
          reviewed_at: string;
        };
        Insert: {
          capability_id: number;
          course_id: number;
          created_at?: string;
          is_primary?: boolean;
          reviewed_at: string;
        };
        Update: {
          capability_id?: number;
          course_id?: number;
          created_at?: string;
          is_primary?: boolean;
          reviewed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "course_capabilities_capability_id_fkey";
            columns: ["capability_id"];
            isOneToOne: false;
            referencedRelation: "capabilities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_capabilities_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      courses: {
        Row: {
          availability_status: string;
          created_at: string;
          id: number;
          is_active: boolean;
          learnworlds_course_id: string;
          provenance: string;
          public_url: string;
          reviewed_at: string;
          short_title: string;
          slug: string;
          summary: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          availability_status?: string;
          created_at?: string;
          id?: never;
          is_active?: boolean;
          learnworlds_course_id: string;
          provenance: string;
          public_url: string;
          reviewed_at: string;
          short_title: string;
          slug: string;
          summary: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          availability_status?: string;
          created_at?: string;
          id?: never;
          is_active?: boolean;
          learnworlds_course_id?: string;
          provenance?: string;
          public_url?: string;
          reviewed_at?: string;
          short_title?: string;
          slug?: string;
          summary?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      employer_submissions: {
        Row: {
          application_url: string;
          authority_confirmed_at: string;
          closing_date: string;
          completeness_score: number;
          contact_email: string;
          contact_name: string;
          created_at: string;
          id: number;
          invite_id: number;
          location_text: string;
          matched_employer_id: number | null;
          organisation_name: string;
          received_at: string;
          resolved_at: string | null;
          resulting_job_id: number | null;
          role_summary: string;
          role_title: string;
          salary_text: string;
          status: string;
          updated_at: string;
          workplace_type: string;
        };
        Insert: {
          application_url: string;
          authority_confirmed_at: string;
          closing_date: string;
          completeness_score?: number;
          contact_email: string;
          contact_name: string;
          created_at?: string;
          id?: never;
          invite_id: number;
          location_text: string;
          matched_employer_id?: number | null;
          organisation_name: string;
          received_at?: string;
          resolved_at?: string | null;
          resulting_job_id?: number | null;
          role_summary: string;
          role_title: string;
          salary_text: string;
          status?: string;
          updated_at?: string;
          workplace_type: string;
        };
        Update: {
          application_url?: string;
          authority_confirmed_at?: string;
          closing_date?: string;
          completeness_score?: number;
          contact_email?: string;
          contact_name?: string;
          created_at?: string;
          id?: never;
          invite_id?: number;
          location_text?: string;
          matched_employer_id?: number | null;
          organisation_name?: string;
          received_at?: string;
          resolved_at?: string | null;
          resulting_job_id?: number | null;
          role_summary?: string;
          role_title?: string;
          salary_text?: string;
          status?: string;
          updated_at?: string;
          workplace_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employer_submissions_invite_id_fkey";
            columns: ["invite_id"];
            isOneToOne: true;
            referencedRelation: "submission_invites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employer_submissions_matched_employer_id_fkey";
            columns: ["matched_employer_id"];
            isOneToOne: false;
            referencedRelation: "employers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employer_submissions_resulting_job_id_fkey";
            columns: ["resulting_job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      employers: {
        Row: {
          benefits: string[];
          created_at: string;
          culture: string | null;
          focus: string | null;
          id: number;
          locations: string[];
          mission: string | null;
          name: string;
          overview: string | null;
          published_at: string | null;
          reviewed_at: string | null;
          search_vector: unknown;
          short_name: string | null;
          slug: string;
          status: string;
          updated_at: string;
          website_domain: string | null;
          website_url: string | null;
        };
        Insert: {
          benefits?: string[];
          created_at?: string;
          culture?: string | null;
          focus?: string | null;
          id?: never;
          locations?: string[];
          mission?: string | null;
          name: string;
          overview?: string | null;
          published_at?: string | null;
          reviewed_at?: string | null;
          search_vector?: unknown;
          short_name?: string | null;
          slug: string;
          status?: string;
          updated_at?: string;
          website_domain?: string | null;
          website_url?: string | null;
        };
        Update: {
          benefits?: string[];
          created_at?: string;
          culture?: string | null;
          focus?: string | null;
          id?: never;
          locations?: string[];
          mission?: string | null;
          name?: string;
          overview?: string | null;
          published_at?: string | null;
          reviewed_at?: string | null;
          search_vector?: unknown;
          short_name?: string | null;
          slug?: string;
          status?: string;
          updated_at?: string;
          website_domain?: string | null;
          website_url?: string | null;
        };
        Relationships: [];
      };
      import_runs: {
        Row: {
          created_at: string;
          error_summary: string | null;
          finished_at: string | null;
          id: number;
          records_created: number;
          records_flagged: number;
          records_seen: number;
          records_updated: number;
          source_id: number;
          started_at: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          error_summary?: string | null;
          finished_at?: string | null;
          id?: never;
          records_created?: number;
          records_flagged?: number;
          records_seen?: number;
          records_updated?: number;
          source_id: number;
          started_at?: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          error_summary?: string | null;
          finished_at?: string | null;
          id?: never;
          records_created?: number;
          records_flagged?: number;
          records_seen?: number;
          records_updated?: number;
          source_id?: number;
          started_at?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "import_runs_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "job_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      job_capabilities: {
        Row: {
          capability_id: number;
          created_at: string;
          importance: string;
          job_id: number;
        };
        Insert: {
          capability_id: number;
          created_at?: string;
          importance?: string;
          job_id: number;
        };
        Update: {
          capability_id?: number;
          created_at?: string;
          importance?: string;
          job_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "job_capabilities_capability_id_fkey";
            columns: ["capability_id"];
            isOneToOne: false;
            referencedRelation: "capabilities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_capabilities_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      job_career_areas: {
        Row: {
          career_area_id: number;
          created_at: string;
          is_primary: boolean;
          job_id: number;
        };
        Insert: {
          career_area_id: number;
          created_at?: string;
          is_primary?: boolean;
          job_id: number;
        };
        Update: {
          career_area_id?: number;
          created_at?: string;
          is_primary?: boolean;
          job_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "job_career_areas_career_area_id_fkey";
            columns: ["career_area_id"];
            isOneToOne: false;
            referencedRelation: "career_areas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_career_areas_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      job_source_records: {
        Row: {
          canonical_url: string | null;
          content_hash: string | null;
          created_at: string;
          external_id: string | null;
          first_seen_at: string;
          id: number;
          job_id: number | null;
          last_seen_at: string;
          mapping_status: string;
          source_id: number;
          source_updated_at: string | null;
          updated_at: string;
          verified_at: string | null;
        };
        Insert: {
          canonical_url?: string | null;
          content_hash?: string | null;
          created_at?: string;
          external_id?: string | null;
          first_seen_at?: string;
          id?: never;
          job_id?: number | null;
          last_seen_at?: string;
          mapping_status?: string;
          source_id: number;
          source_updated_at?: string | null;
          updated_at?: string;
          verified_at?: string | null;
        };
        Update: {
          canonical_url?: string | null;
          content_hash?: string | null;
          created_at?: string;
          external_id?: string | null;
          first_seen_at?: string;
          id?: never;
          job_id?: number | null;
          last_seen_at?: string;
          mapping_status?: string;
          source_id?: number;
          source_updated_at?: string | null;
          updated_at?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "job_source_records_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_source_records_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "job_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      job_sources: {
        Row: {
          authoritative_base_url: string | null;
          created_at: string;
          id: number;
          is_active: boolean;
          name: string;
          source_type: string;
          updated_at: string;
        };
        Insert: {
          authoritative_base_url?: string | null;
          created_at?: string;
          id?: never;
          is_active?: boolean;
          name: string;
          source_type: string;
          updated_at?: string;
        };
        Update: {
          authoritative_base_url?: string | null;
          created_at?: string;
          id?: never;
          is_active?: boolean;
          name?: string;
          source_type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          application_notes: string | null;
          application_url: string | null;
          closes_at: string | null;
          contract_type: string | null;
          country_code: string | null;
          created_at: string;
          description: string | null;
          employer_id: number;
          experience_level: string | null;
          hours_type: string | null;
          id: number;
          is_field_based: boolean;
          location_text: string | null;
          posted_at: string | null;
          published_at: string | null;
          region: string | null;
          requirements: string | null;
          responsibilities: string | null;
          salary_currency: string | null;
          salary_max: number | null;
          salary_min: number | null;
          salary_period: string | null;
          salary_text: string | null;
          search_vector: unknown;
          slug: string;
          status: string;
          summary: string | null;
          title: string;
          updated_at: string;
          withdrawn_at: string | null;
          workplace_type: string | null;
        };
        Insert: {
          application_notes?: string | null;
          application_url?: string | null;
          closes_at?: string | null;
          contract_type?: string | null;
          country_code?: string | null;
          created_at?: string;
          description?: string | null;
          employer_id: number;
          experience_level?: string | null;
          hours_type?: string | null;
          id?: never;
          is_field_based?: boolean;
          location_text?: string | null;
          posted_at?: string | null;
          published_at?: string | null;
          region?: string | null;
          requirements?: string | null;
          responsibilities?: string | null;
          salary_currency?: string | null;
          salary_max?: number | null;
          salary_min?: number | null;
          salary_period?: string | null;
          salary_text?: string | null;
          search_vector?: unknown;
          slug: string;
          status?: string;
          summary?: string | null;
          title: string;
          updated_at?: string;
          withdrawn_at?: string | null;
          workplace_type?: string | null;
        };
        Update: {
          application_notes?: string | null;
          application_url?: string | null;
          closes_at?: string | null;
          contract_type?: string | null;
          country_code?: string | null;
          created_at?: string;
          description?: string | null;
          employer_id?: number;
          experience_level?: string | null;
          hours_type?: string | null;
          id?: never;
          is_field_based?: boolean;
          location_text?: string | null;
          posted_at?: string | null;
          published_at?: string | null;
          region?: string | null;
          requirements?: string | null;
          responsibilities?: string | null;
          salary_currency?: string | null;
          salary_max?: number | null;
          salary_min?: number | null;
          salary_period?: string | null;
          salary_text?: string | null;
          search_vector?: unknown;
          slug?: string;
          status?: string;
          summary?: string | null;
          title?: string;
          updated_at?: string;
          withdrawn_at?: string | null;
          workplace_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_employer_id_fkey";
            columns: ["employer_id"];
            isOneToOne: false;
            referencedRelation: "employers";
            referencedColumns: ["id"];
          },
        ];
      };
      moderation_events: {
        Row: {
          action: string;
          actor_user_id: string;
          created_at: string;
          employer_submission_id: number | null;
          id: number;
          job_id: number | null;
          next_status: string | null;
          previous_status: string | null;
          review_note: string | null;
        };
        Insert: {
          action: string;
          actor_user_id: string;
          created_at?: string;
          employer_submission_id?: number | null;
          id?: never;
          job_id?: number | null;
          next_status?: string | null;
          previous_status?: string | null;
          review_note?: string | null;
        };
        Update: {
          action?: string;
          actor_user_id?: string;
          created_at?: string;
          employer_submission_id?: number | null;
          id?: never;
          job_id?: number | null;
          next_status?: string | null;
          previous_status?: string | null;
          review_note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "moderation_events_actor_user_id_fkey";
            columns: ["actor_user_id"];
            isOneToOne: false;
            referencedRelation: "staff_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "moderation_events_employer_submission_id_fkey";
            columns: ["employer_submission_id"];
            isOneToOne: false;
            referencedRelation: "employer_submissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "moderation_events_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_jobs: {
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
            foreignKeyName: "saved_jobs_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_jobs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "candidate_profiles";
            referencedColumns: ["user_id"];
          },
        ];
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
      submission_invites: {
        Row: {
          created_at: string;
          created_by_staff_user_id: string;
          employer_id: number | null;
          expires_at: string;
          id: number;
          invitee_email: string;
          revoked_at: string | null;
          token_hash: string;
          used_at: string | null;
        };
        Insert: {
          created_at?: string;
          created_by_staff_user_id: string;
          employer_id?: number | null;
          expires_at: string;
          id?: never;
          invitee_email: string;
          revoked_at?: string | null;
          token_hash: string;
          used_at?: string | null;
        };
        Update: {
          created_at?: string;
          created_by_staff_user_id?: string;
          employer_id?: number | null;
          expires_at?: string;
          id?: never;
          invitee_email?: string;
          revoked_at?: string | null;
          token_hash?: string;
          used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "submission_invites_created_by_staff_user_id_fkey";
            columns: ["created_by_staff_user_id"];
            isOneToOne: false;
            referencedRelation: "staff_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "submission_invites_employer_id_fkey";
            columns: ["employer_id"];
            isOneToOne: false;
            referencedRelation: "employers";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_manual_job_draft: {
        Args: {
          p_application_url: string;
          p_canonical_url: string;
          p_closes_at: string;
          p_contract_type: string;
          p_country_code: string;
          p_description: string;
          p_employer_name: string;
          p_employer_slug: string;
          p_employer_website_url: string | null;
          p_experience_level: string;
          p_hours_type: string;
          p_job_slug: string;
          p_location_text: string;
          p_posted_at: string | null;
          p_requirements: string;
          p_responsibilities: string;
          p_salary_text: string;
          p_source_id: number;
          p_summary: string;
          p_title: string;
          p_workplace_type: string;
        };
        Returns: number;
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
