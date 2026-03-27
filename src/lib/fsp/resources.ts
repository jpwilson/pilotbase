import type { FSPClient } from "./client";
import type {
  FSPAircraft,
  FSPInstructor,
  FSPLocation,
  FSPActivityType,
  FSPSchedulingGroup,
  FSPUser,
  FSPCancellationReason,
} from "./types";

export class FSPResourcesService {
  constructor(private client: FSPClient) {}

  private get opId() {
    return this.client.getOperatorId();
  }

  async listLocations(): Promise<FSPLocation[]> {
    return this.client.get(`/common/v1.0/operators/${this.opId}/locations`);
  }

  async getLocation(locationId: string): Promise<FSPLocation> {
    return this.client.get(`/common/v1.0/operators/${this.opId}/locations/location/${locationId}`);
  }

  async listAircraft(): Promise<FSPAircraft[]> {
    return this.client.get(`/core/v1.0/operators/${this.opId}/aircraft`);
  }

  async listInstructors(): Promise<FSPInstructor[]> {
    return this.client.get(`/core/v1.0/operators/${this.opId}/instructors`);
  }

  async listActivityTypes(): Promise<FSPActivityType[]> {
    return this.client.get(`/api/v1/operator/${this.opId}/activitytypes`);
  }

  async listSchedulingGroups(): Promise<FSPSchedulingGroup[]> {
    return this.client.get(`/common/v1.0/operators/${this.opId}/schedulinggroups`);
  }

  async listUsers(limit = 1000): Promise<FSPUser[]> {
    return this.client.get(`/core/v1.0/operators/${this.opId}/users`, {
      limit: String(limit),
    });
  }

  async getUser(userId: string): Promise<FSPUser> {
    return this.client.get(`/core/v1.0/operators/${this.opId}/users/${userId}`);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    return this.client.get(`/core/v1.0/operators/${this.opId}/users/${userId}/permissions`);
  }

  async getCancellationReasons(): Promise<FSPCancellationReason[]> {
    return this.client.get(`/scheduling/v1.0/operators/${this.opId}/cancellationReasons`);
  }
}
