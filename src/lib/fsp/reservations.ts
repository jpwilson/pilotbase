import type { FSPClient } from "./client";
import type {
  FSPReservationRequest,
  FSPReservationResponse,
  FSPReservationListRequest,
  FSPReservationListItem,
} from "./types";

export class FSPReservationsService {
  constructor(private client: FSPClient) {}

  private get opId() {
    return this.client.getOperatorId();
  }

  async validate(
    reservation: Omit<FSPReservationRequest, "validateOnly">
  ): Promise<FSPReservationResponse> {
    return this.client.post("/api/V2/Reservation", {
      ...reservation,
      validateOnly: true,
    });
  }

  async create(
    reservation: Omit<FSPReservationRequest, "validateOnly">
  ): Promise<FSPReservationResponse> {
    return this.client.post("/api/V2/Reservation", {
      ...reservation,
      validateOnly: false,
    });
  }

  async validateAndCreate(
    reservation: Omit<FSPReservationRequest, "validateOnly">
  ): Promise<FSPReservationResponse> {
    // Step 1: Validate
    const validation = await this.validate(reservation);
    if (validation.errors && validation.errors.length > 0) {
      return validation;
    }

    // Step 2: Create
    return this.create(reservation);
  }

  async get(reservationId: string): Promise<unknown> {
    return this.client.get(`/api/V2/Reservation/${reservationId}`, { operatorId: this.opId });
  }

  async getForPerson(userId: string): Promise<unknown> {
    return this.client.get("/V2/Reservation", {
      personId: userId,
      operatorId: this.opId,
    });
  }

  async update(reservation: FSPReservationRequest): Promise<FSPReservationResponse> {
    return this.client.put("/api/V2/Reservation", reservation);
  }

  async delete(reservationId: string): Promise<void> {
    return this.client.delete(
      `/scheduling/v1.0/operators/${this.opId}/reservations/${reservationId}`
    );
  }

  async list(
    request: FSPReservationListRequest
  ): Promise<{ total: number; results: FSPReservationListItem[] }> {
    return this.client.post(`/api/V1/operator/${this.opId}/operatorReservations/list`, request);
  }

  // Batch operations
  async publishBatch(reservations: unknown[]): Promise<{ batchId: string }> {
    return this.client.post(
      `/schedulinghub/v1.0/operators/${this.opId}/batchReservations`,
      reservations
    );
  }

  async getBatchStatus(batchId: string): Promise<unknown> {
    return this.client.get(
      `/schedulinghub/v1.0/operators/${this.opId}/batchReservations/status/${batchId}`
    );
  }
}
