import type { Database, Json } from "./supabase/database.types";

type Table<Row, Insert> = { Row: Row; Insert: Insert; Update: Partial<Insert>; Relationships: [] };
export type GuideRevision = {
  id: number;
  guide_slug: string;
  input_hash: string;
  content: Json;
  evidence: Json;
  status: string;
  created_at: string;
  reviewed_at: string | null;
};
export type DatabaseWithGuides = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
    Tables: Database["public"]["Tables"] & {
      directory_jobs: {
        Row: Database["public"]["Tables"]["directory_jobs"]["Row"] & {
          salary_full_time_evidence: boolean;
          salary_evidence_hash: string | null;
        };
        Insert: Database["public"]["Tables"]["directory_jobs"]["Insert"] & {
          salary_full_time_evidence?: boolean;
          salary_evidence_hash?: string | null;
        };
        Update: Database["public"]["Tables"]["directory_jobs"]["Update"] & {
          salary_full_time_evidence?: boolean;
          salary_evidence_hash?: string | null;
        };
        Relationships: Database["public"]["Tables"]["directory_jobs"]["Relationships"];
      };
      directory_role_aliases: Table<
        { normalized_title: string; role_slug: string | null; updated_at: string },
        { normalized_title: string; role_slug: string | null; updated_at?: string }
      >;
      directory_guide_evidence: Table<
        {
          job_id: number;
          feed_hash: string;
          source_url: string;
          source_kind: string;
          source_text: string;
          is_detailed: boolean;
          captured_at: string;
        },
        {
          job_id: number;
          feed_hash: string;
          source_url: string;
          source_kind: string;
          source_text: string;
          captured_at?: string;
        }
      >;
      career_guide_revisions: Table<
        GuideRevision,
        Omit<GuideRevision, "id" | "created_at" | "reviewed_at" | "status"> & {
          id?: never;
          status?: string;
          created_at?: string;
          reviewed_at?: string | null;
        }
      >;
    };
    Functions: Database["public"]["Functions"] & {
      publish_career_guide: { Args: { p_id: number; p_input_hash: string }; Returns: boolean };
    };
  };
};
