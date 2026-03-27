import type { FSPClient } from "./client";
import type { FSPSchedulableEvent, FSPEnrollment, FSPEnrollmentProgress } from "./types";

export class FSPTrainingService {
  constructor(private client: FSPClient) {}

  private get opId() {
    return this.client.getOperatorId();
  }

  async getSchedulableEvents(request: {
    startDate: string;
    endDate: string;
    locationId: number;
    listType?: number;
    filters?: unknown[];
    priorities?: unknown[];
    useAllInstructors?: boolean;
  }): Promise<FSPSchedulableEvent[]> {
    return this.client.post(
      `/traininghub/v1.0/operators/${this.opId}/schedulableEvents`,
      {
        listType: 1,
        filters: [],
        priorities: [],
        useAllInstructors: false,
        ...request,
      }
    );
  }

  async getStudentEnrollments(studentId: string): Promise<FSPEnrollment[]> {
    return this.client.get(
      `/traininghub/v1.0/operators/${this.opId}/enrollments/list/${studentId}`
    );
  }

  async getEnrollmentDetails(enrollmentId: string): Promise<FSPEnrollment> {
    return this.client.get(
      `/traininghub/v1.0/operators/${this.opId}/enrollments/${enrollmentId}`
    );
  }

  async getEnrollmentProgress(enrollmentId: string): Promise<FSPEnrollmentProgress> {
    return this.client.get(
      `/traininghub/v1.0/operators/${this.opId}/enrollments/${enrollmentId}/progress`
    );
  }

  async searchStudents(query: unknown): Promise<unknown> {
    return this.client.post(`/traininghub/v1.0/operators/${this.opId}/students/search`, query);
  }

  async listStudents(): Promise<unknown> {
    return this.client.get(`/traininghub/v1.0/operators/${this.opId}/students`);
  }

  async getTrainingAlerts(): Promise<unknown> {
    return this.client.get(`/traininghub/v1.0/operators/${this.opId}/alerts`);
  }

  async getTrainingSessions(params: {
    enrollmentId: string;
    studentId: string;
  }): Promise<unknown> {
    return this.client.get("/api/v1/trainingsessions", {
      enrollmentId: params.enrollmentId,
      operatorId: this.opId,
      studentId: params.studentId,
    });
  }
}
