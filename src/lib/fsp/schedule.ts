import type { FSPClient } from "./client";
import type {
  FSPScheduleRequest,
  FSPScheduleResponse,
  FSPAutoScheduleRequest,
  FSPAutoScheduleResult,
  FSPAutoScheduleSettings,
} from "./types";

export class FSPScheduleService {
  constructor(private client: FSPClient) {}

  private get opId() {
    return this.client.getOperatorId();
  }

  async getSchedule(request: FSPScheduleRequest): Promise<FSPScheduleResponse> {
    return this.client.post("/api/v2/schedule", request);
  }

  async getAutoScheduleSettings(): Promise<FSPAutoScheduleSettings> {
    return this.client.get(`/schedulinghub/v1.0/operators/${this.opId}/settings/autoSchedule`);
  }

  async updateAutoScheduleSettings(settings: FSPAutoScheduleSettings): Promise<void> {
    return this.client.put(
      `/schedulinghub/v1.0/operators/${this.opId}/settings/autoSchedule`,
      settings
    );
  }

  async executeAutoSchedule(request: FSPAutoScheduleRequest): Promise<FSPAutoScheduleResult> {
    return this.client.post(`/schedulinghub/v1.0/operators/${this.opId}/autoSchedule`, request);
  }

  async submitAutoScheduleFeedback(feedback: unknown): Promise<void> {
    return this.client.post(
      `/schedulinghub/v1.0/operators/${this.opId}/autoSchedule/feedback`,
      feedback
    );
  }

  // Find-a-Time
  async getAvailableTimeSlots(request: {
    activityTypeId?: string;
    instructorIds?: string[];
    aircraftIds?: string[];
    schedulingGroupIds?: string[];
    customerId?: string;
    startDate: string;
    endDate: string;
    duration?: number;
  }): Promise<unknown> {
    return this.client.post(
      `/schedulinghub/v1.0/operators/${this.opId}/scheduleMatch/availability`,
      request
    );
  }

  async getScheduleDisplayHours(): Promise<unknown> {
    return this.client.get(`/v2/operator/${this.opId}/operators/scheduleDisplayHours`);
  }

  async getScheduleFilters(): Promise<unknown> {
    return this.client.get(`/scheduling/v1.0/operators/${this.opId}/scheduleFilters`);
  }
}
