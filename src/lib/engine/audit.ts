import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

export interface AuditLogRow {
  id: string;
  operator_id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  actor_id: string | null;
  actor_type: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export class AuditService {
  constructor(private operatorId: string) {}

  private get db() {
    return getSupabaseServerClient(this.operatorId);
  }

  async log(params: {
    eventType: string;
    entityType?: string;
    entityId?: string;
    actorId?: string;
    actorType?: "system" | "scheduler" | "student" | "instructor";
    payload?: Record<string, unknown>;
  }): Promise<void> {
    const { error } = await this.db.from("audit_log").insert({
      operator_id: this.operatorId,
      event_type: params.eventType,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      actor_id: params.actorId ?? null,
      actor_type: params.actorType ?? "system",
      payload: params.payload ?? {},
    });

    if (error) {
      logger.error("Failed to write audit log", { error: error.message });
    }
  }

  async getRecent(limit = 50): Promise<AuditLogRow[]> {
    const { data, error } = await this.db
      .from("audit_log")
      .select("*")
      .eq("operator_id", this.operatorId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as AuditLogRow[];
  }

  async getForEntity(entityType: string, entityId: string): Promise<AuditLogRow[]> {
    const { data, error } = await this.db
      .from("audit_log")
      .select("*")
      .eq("operator_id", this.operatorId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as AuditLogRow[];
  }
}
