import { logger } from "@/lib/utils/logger";
import type { FSPCredentials, FSPSession } from "./types";

export class FSPClient {
  private baseUrl: string;
  private token: string | null = null;
  private operatorId: string;
  private tokenExpiresAt: number = 0;
  private credentials: FSPCredentials | null = null;

  constructor(config: { baseUrl: string; operatorId: string; token?: string }) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.operatorId = config.operatorId;
    this.token = config.token ?? null;
  }

  setCredentials(credentials: FSPCredentials) {
    this.credentials = credentials;
  }

  setToken(token: string) {
    this.token = token;
    this.tokenExpiresAt = Date.now() + 55 * 60 * 1000; // assume ~1hr tokens, refresh at 55min
  }

  getOperatorId(): string {
    return this.operatorId;
  }

  private async ensureToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    if (!this.credentials) {
      if (this.token) return this.token;
      throw new Error("FSP client has no token or credentials configured");
    }

    const session = await this.authenticate(this.credentials);
    this.setToken(session.token);
    return session.token;
  }

  private async authenticate(credentials: FSPCredentials): Promise<FSPSession> {
    const response = await fetch(`${this.baseUrl}/common/v1.0/sessions/credentials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new FSPApiError("Authentication failed", response.status);
    }

    return response.json();
  }

  async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      params?: Record<string, string>;
    }
  ): Promise<T> {
    const token = await this.ensureToken();

    const url = new URL(`${this.baseUrl}${path}`);
    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        url.searchParams.set(key, value);
      }
    }

    logger.debug("FSP API request", { method, path });

    const response = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      logger.error("FSP API error", {
        method,
        path,
        status: response.status,
        body: errorBody,
      });
      throw new FSPApiError(
        `FSP API error: ${response.status} ${path}`,
        response.status,
        errorBody
      );
    }

    const text = await response.text();
    if (!text) return undefined as T;

    return JSON.parse(text) as T;
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>("GET", path, { params });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, { body });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, { body });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }
}

export class FSPApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody?: string
  ) {
    super(message);
    this.name = "FSPApiError";
  }
}
