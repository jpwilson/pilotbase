import { FSPClient } from "./client";
import { FSPScheduleService } from "./schedule";
import { FSPReservationsService } from "./reservations";
import { FSPResourcesService } from "./resources";
import { FSPAvailabilityService } from "./availability";
import { FSPTrainingService } from "./training";
import { FSPWeatherService } from "./weather";

export class FSP {
  public readonly client: FSPClient;
  public readonly schedule: FSPScheduleService;
  public readonly reservations: FSPReservationsService;
  public readonly resources: FSPResourcesService;
  public readonly availability: FSPAvailabilityService;
  public readonly training: FSPTrainingService;
  public readonly weather: FSPWeatherService;

  constructor(config: { baseUrl: string; operatorId: string; token?: string }) {
    this.client = new FSPClient(config);
    this.schedule = new FSPScheduleService(this.client);
    this.reservations = new FSPReservationsService(this.client);
    this.resources = new FSPResourcesService(this.client);
    this.availability = new FSPAvailabilityService(this.client);
    this.training = new FSPTrainingService(this.client);
    this.weather = new FSPWeatherService(this.client);
  }

  setToken(token: string) {
    this.client.setToken(token);
  }

  setCredentials(email: string, password: string) {
    this.client.setCredentials({ email, password });
  }
}

export { FSPClient, FSPApiError } from "./client";
export type * from "./types";
