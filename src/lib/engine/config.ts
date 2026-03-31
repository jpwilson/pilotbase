import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { PriorityWeights, FeatureFlags } from "@/lib/supabase/types";
import type { EngineConfig } from "./types";

export interface OperatorConfigRow {
  id: string;
  operator_id: string;
  priority_weights: PriorityWeights;
  search_window_days: number;
  max_alternatives: number;
  notification_prefs: { email: boolean; sms: boolean };
  templates: Record<string, unknown>;
  feature_flags: FeatureFlags;
  created_at: string;
  updated_at: string;
}

export class OperatorConfigService {
  constructor(private operatorId: string) {}

  private get db() {
    return getSupabaseServerClient(this.operatorId);
  }

  async get(): Promise<OperatorConfigRow> {
    const { data, error } = await this.db
      .from("operator_config")
      .select("*")
      .eq("operator_id", this.operatorId)
      .single();

    if (error && error.code === "PGRST116") {
      return this.createDefault();
    }
    if (error) throw error;
    return data as OperatorConfigRow;
  }

  async update(
    updates: Partial<{
      priority_weights: PriorityWeights;
      search_window_days: number;
      max_alternatives: number;
      notification_prefs: { email: boolean; sms: boolean };
      templates: Record<string, unknown>;
      feature_flags: FeatureFlags;
    }>
  ): Promise<OperatorConfigRow> {
    const { data, error } = await this.db
      .from("operator_config")
      .update(updates)
      .eq("operator_id", this.operatorId)
      .select("*")
      .single();

    if (error) throw error;
    return data as OperatorConfigRow;
  }

  async getEngineConfig(locationId: number): Promise<EngineConfig> {
    const config = await this.get();
    return {
      operatorId: this.operatorId,
      locationId,
      searchWindowDays: config.search_window_days,
      maxAlternatives: config.max_alternatives,
      priorityWeights: config.priority_weights,
    };
  }

  private async createDefault(): Promise<OperatorConfigRow> {
    const { data, error } = await this.db
      .from("operator_config")
      .insert({
        operator_id: this.operatorId,
        priority_weights: {
          timeSinceLastFlight: 0.3,
          timeUntilNextFlight: 0.2,
          totalFlightHours: 0.1,
          enrollmentProgress: 0.2,
          waitlistPosition: 0.2,
        },
        search_window_days: 7,
        max_alternatives: 5,
        notification_prefs: { email: true, sms: false },
        templates: {},
        feature_flags: { waitlist: true, reschedule: true, discovery: true, nextLesson: true },
      })
      .select("*")
      .single();

    if (error) throw error;
    return data as OperatorConfigRow;
  }
}
