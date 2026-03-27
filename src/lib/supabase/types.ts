// Database types — matches the schema in supabase/migrations/001_initial_schema.sql
// In production, generate with: npx supabase gen types typescript

export type SuggestionType = "waitlist" | "reschedule" | "discovery" | "next_lesson";
export type SuggestionStatus =
  | "pending"
  | "approved"
  | "declined"
  | "expired"
  | "executed"
  | "failed";

export interface Database {
  public: {
    Tables: {
      suggestions: {
        Row: {
          id: string;
          operator_id: string;
          type: SuggestionType;
          status: SuggestionStatus;
          priority: number;
          student_id: string | null;
          student_name: string | null;
          instructor_id: string | null;
          instructor_name: string | null;
          aircraft_id: string | null;
          aircraft_name: string | null;
          location_id: string | null;
          activity_type_id: string | null;
          proposed_start: string | null;
          proposed_end: string | null;
          alternatives: AlternativeSlot[];
          rationale: string;
          context: Record<string, unknown>;
          trigger_event: Record<string, unknown>;
          reviewed_by: string | null;
          reviewed_at: string | null;
          executed_at: string | null;
          reservation_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["suggestions"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["suggestions"]["Insert"]>;
      };
      audit_log: {
        Row: {
          id: string;
          operator_id: string;
          event_type: string;
          entity_type: string | null;
          entity_id: string | null;
          actor_id: string | null;
          actor_type: "system" | "scheduler" | "student" | "instructor" | null;
          payload: Record<string, unknown>;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["audit_log"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Insert"]>;
      };
      operator_config: {
        Row: {
          id: string;
          operator_id: string;
          priority_weights: PriorityWeights;
          search_window_days: number;
          max_alternatives: number;
          notification_prefs: NotificationPrefs;
          templates: Record<string, NotificationTemplate>;
          feature_flags: FeatureFlags;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["operator_config"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["operator_config"]["Insert"]>;
      };
      notification_log: {
        Row: {
          id: string;
          operator_id: string;
          suggestion_id: string | null;
          recipient_id: string;
          recipient_type: "student" | "instructor" | "prospect";
          channel: "email" | "sms";
          template_key: string | null;
          content: string | null;
          status: "pending" | "sent" | "failed";
          sent_at: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["notification_log"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notification_log"]["Insert"]>;
      };
      discovery_requests: {
        Row: {
          id: string;
          operator_id: string;
          prospect_name: string;
          prospect_email: string | null;
          prospect_phone: string | null;
          preferred_dates: string[];
          notes: string | null;
          status: "pending" | "scheduled" | "cancelled";
          suggestion_id: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["discovery_requests"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["discovery_requests"]["Insert"]>;
      };
    };
  };
}

// --- Shared types ---
export interface AlternativeSlot {
  instructorId: string;
  instructorName: string;
  aircraftId: string;
  aircraftName: string;
  start: string;
  end: string;
  score: number;
  rationale: string;
}

export interface PriorityWeights {
  timeSinceLastFlight: number;
  timeUntilNextFlight: number;
  totalFlightHours: number;
  enrollmentProgress: number;
  waitlistPosition: number;
  [key: string]: number; // Operator-defined custom weights
}

export interface NotificationPrefs {
  email: boolean;
  sms: boolean;
}

export interface NotificationTemplate {
  subject?: string;
  body: string;
  channel: "email" | "sms";
}

export interface FeatureFlags {
  waitlist: boolean;
  reschedule: boolean;
  discovery: boolean;
  nextLesson: boolean;
  [key: string]: boolean;
}
