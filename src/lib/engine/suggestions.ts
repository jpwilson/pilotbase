import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { CreateSuggestionInput } from "./types";
import type { SuggestionType, SuggestionStatus } from "@/lib/supabase/types";

export interface SuggestionRow {
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
  alternatives: unknown[];
  rationale: string;
  context: Record<string, unknown>;
  trigger_event: Record<string, unknown>;
  reviewed_by: string | null;
  reviewed_at: string | null;
  executed_at: string | null;
  reservation_id: string | null;
  created_at: string;
  updated_at: string;
}

export class SuggestionService {
  constructor(private operatorId: string) {}

  private get db() {
    return getSupabaseServerClient(this.operatorId);
  }

  async create(input: CreateSuggestionInput): Promise<SuggestionRow> {
    const { data, error } = await this.db
      .from("suggestions")
      .insert({
        operator_id: input.operatorId,
        type: input.type,
        status: "pending",
        priority: input.priority,
        student_id: input.studentId ?? null,
        student_name: input.studentName ?? null,
        instructor_id: input.instructorId ?? null,
        instructor_name: input.instructorName ?? null,
        aircraft_id: input.aircraftId ?? null,
        aircraft_name: input.aircraftName ?? null,
        location_id: input.locationId ?? null,
        activity_type_id: input.activityTypeId ?? null,
        proposed_start: input.proposedStart ?? null,
        proposed_end: input.proposedEnd ?? null,
        alternatives: input.alternatives ?? [],
        rationale: input.rationale,
        context: input.context ?? {},
        trigger_event: input.triggerEvent as unknown as Record<string, unknown>,
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to create suggestion", { error: error.message });
      throw error;
    }

    const row = data as SuggestionRow;

    await this.logAudit("suggestion_created", "suggestion", row.id, {
      type: input.type,
      studentId: input.studentId,
      trigger: input.triggerEvent.type,
    });

    logger.info("Suggestion created", { id: row.id, type: input.type });
    return row;
  }

  async approve(suggestionId: string, reviewerId: string): Promise<SuggestionRow> {
    const { data, error } = await this.db
      .from("suggestions")
      .update({
        status: "approved",
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", suggestionId)
      .eq("operator_id", this.operatorId)
      .select()
      .single();

    if (error) throw error;

    await this.logAudit("suggestion_approved", "suggestion", suggestionId, { reviewerId });

    return data as SuggestionRow;
  }

  async decline(suggestionId: string, reviewerId: string): Promise<SuggestionRow> {
    const { data, error } = await this.db
      .from("suggestions")
      .update({
        status: "declined",
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", suggestionId)
      .eq("operator_id", this.operatorId)
      .select()
      .single();

    if (error) throw error;

    await this.logAudit("suggestion_declined", "suggestion", suggestionId, { reviewerId });

    return data as SuggestionRow;
  }

  async markExecuted(suggestionId: string, reservationId: string): Promise<SuggestionRow> {
    const { data, error } = await this.db
      .from("suggestions")
      .update({
        status: "executed",
        executed_at: new Date().toISOString(),
        reservation_id: reservationId,
      })
      .eq("id", suggestionId)
      .eq("operator_id", this.operatorId)
      .select()
      .single();

    if (error) throw error;

    await this.logAudit("reservation_created", "suggestion", suggestionId, { reservationId });

    return data as SuggestionRow;
  }

  async markFailed(suggestionId: string, errorMsg: string): Promise<void> {
    await this.db
      .from("suggestions")
      .update({
        status: "failed",
        context: { error: errorMsg },
      })
      .eq("id", suggestionId)
      .eq("operator_id", this.operatorId);
  }

  async listPending(options?: {
    type?: SuggestionType;
    limit?: number;
    offset?: number;
  }): Promise<SuggestionRow[]> {
    let query = this.db
      .from("suggestions")
      .select("*")
      .eq("operator_id", this.operatorId)
      .eq("status", "pending")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (options?.type) query = query.eq("type", options.type);
    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as SuggestionRow[];
  }

  async listAll(options?: {
    status?: SuggestionStatus;
    type?: SuggestionType;
    limit?: number;
  }): Promise<SuggestionRow[]> {
    let query = this.db
      .from("suggestions")
      .select("*")
      .eq("operator_id", this.operatorId)
      .order("created_at", { ascending: false });

    if (options?.status) query = query.eq("status", options.status);
    if (options?.type) query = query.eq("type", options.type);
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as SuggestionRow[];
  }

  async getById(id: string): Promise<SuggestionRow | null> {
    const { data, error } = await this.db
      .from("suggestions")
      .select("*")
      .eq("id", id)
      .eq("operator_id", this.operatorId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as SuggestionRow;
  }

  private async logAudit(
    eventType: string,
    entityType: string,
    entityId: string,
    payload: Record<string, unknown>
  ) {
    await this.db.from("audit_log").insert({
      operator_id: this.operatorId,
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      actor_type: "system",
      payload,
    });
  }
}
