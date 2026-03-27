import type { FSPClient } from "./client";
import type { FSPCivilTwilight } from "./types";

export class FSPWeatherService {
  constructor(private client: FSPClient) {}

  private get opId() {
    return this.client.getOperatorId();
  }

  async getMetar(): Promise<unknown> {
    return this.client.get("/common/v1.0/weather/metar");
  }

  async getTaf(): Promise<unknown> {
    return this.client.get("/common/v1.0/weather/taf");
  }

  async getCivilTwilight(locationId: string): Promise<FSPCivilTwilight> {
    return this.client.get(
      `/common/v1.0/operators/${this.opId}/locations/${locationId}/civilTwilight`
    );
  }
}
