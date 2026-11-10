import type { DatabaseWithGuides } from "./guide-database.types";
import type { Json } from "./supabase/database.types";

type SourceFields = {
  configuration: Json;
  configuration_revision: number;
  check_result: Json | null;
  checked_at: string | null;
  reviewed_at: string | null;
  notes: string;
};
type OldSource = DatabaseWithGuides["public"]["Tables"]["directory_sources"];
type SourceEvent = {
  id: number;
  source_id: number;
  created_at: string;
  actor_id: string | null;
  action: string;
  detail: Json;
};
export type DatabaseWithSources = Omit<DatabaseWithGuides, "public"> & {
  public: Omit<DatabaseWithGuides["public"], "Tables" | "Functions"> & {
    Tables: Omit<DatabaseWithGuides["public"]["Tables"], "directory_sources"> & {
      directory_sources: {
        Row: OldSource["Row"] & SourceFields;
        Insert: OldSource["Insert"] & Partial<SourceFields>;
        Update: OldSource["Update"] & Partial<SourceFields>;
        Relationships: [];
      };
      directory_source_events: {
        Row: SourceEvent;
        Insert: Omit<SourceEvent, "id" | "created_at"> & { id?: never; created_at?: string };
        Update: Partial<Omit<SourceEvent, "id">>;
        Relationships: [];
      };
    };
    Functions: DatabaseWithGuides["public"]["Functions"] & {
      directory_pending_source_jobs: { Args: never; Returns: Json };
      save_directory_source: {
        Args: {
          p_url: string;
          p_name: string;
          p_configuration: Json;
          p_notes?: string;
          p_id?: number;
          p_actor?: string;
        };
        Returns: number;
      };
      record_directory_source_check: {
        Args: { p_source_id: number; p_revision: number; p_result: Json; p_actor?: string };
        Returns: boolean;
      };
      change_directory_source: {
        Args: { p_source_id: number; p_action: string; p_actor?: string; p_reviewed?: boolean };
        Returns: number;
      };
      import_directory_source: {
        Args: { p_source_id: number; p_revision: number; p_items: Json; p_check: Json };
        Returns: Json;
      };
    };
  };
};
