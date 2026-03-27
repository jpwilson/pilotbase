import type { FSPClient } from "./client";
import type { FSPUserAvailability } from "./types";

export class FSPAvailabilityService {
  constructor(private client: FSPClient) {}

  private get opId() {
    return this.client.getOperatorId();
  }

  async getForUser(userGuidId: string): Promise<unknown> {
    return this.client.get(
      `/schedulinghub/v1.0/operators/${this.opId}/users/${userGuidId}/availability`
    );
  }

  async getForUsers(
    userGuidIds: string[],
    startAtUtc: string,
    endAtUtc: string
  ): Promise<FSPUserAvailability[]> {
    return this.client.post(
      `/schedulinghub/v1.0/operators/${this.opId}/users/availabilityAndOverrides`,
      { userGuidIds, startAtUtc, endAtUtc }
    );
  }

  async checkReservationAvailability(request: {
    aircraftId?: string;
    instructorId?: string;
    start: string;
    end: string;
  }): Promise<unknown> {
    return this.client.post(
      `/schedulinghub/v1.0/operators/${this.opId}/availability/reservationAvailability`,
      request
    );
  }

  async getOverrides(userGuidId: string): Promise<unknown> {
    return this.client.get(
      `/schedulinghub/v1.0/operators/${this.opId}/users/${userGuidId}/availabilityOverride`
    );
  }

  async addOverride(
    userGuidId: string,
    override: { date: string; startTime: string; endTime: string; isUnavailable: boolean }
  ): Promise<unknown> {
    return this.client.post(
      `/schedulinghub/v1.0/operators/${this.opId}/users/${userGuidId}/availabilityOverride`,
      override
    );
  }
}
