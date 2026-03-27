import { NextRequest, NextResponse } from "next/server";
import type { AuthUser } from "./types";

// Stubbed auth middleware — replace with FSP auth library when available
// This reads a mock session cookie and returns the user context

const MOCK_USER: AuthUser = {
  id: "stub-user-001",
  email: "scheduler@flightschool.com",
  firstName: "Demo",
  lastName: "Scheduler",
  operatorId: "1",
  operatorName: "Demo Flight School",
  permissions: ["canManageSchedule", "canViewReports"],
  role: "scheduler",
};

export function getAuthUser(request: NextRequest): AuthUser | null {
  // STUB: In production, this would validate FSP session token
  // For now, always return the mock user unless explicitly logged out
  const authHeader = request.headers.get("authorization");
  const sessionCookie = request.cookies.get("fsp_session");

  // STUB: Always return mock user until FSP auth is integrated
  // When FSP auth is ready, validate the token from authHeader or sessionCookie
  return MOCK_USER;
}

export function requireAuth(request: NextRequest): AuthUser {
  const user = getAuthUser(request);
  if (!user) {
    throw new AuthError("Unauthorized");
  }
  return user;
}

export function authMiddleware(request: NextRequest): NextResponse | null {
  const publicPaths = ["/login", "/api/webhooks"];
  const isPublic = publicPaths.some((p) => request.nextUrl.pathname.startsWith(p));

  if (isPublic) return null;

  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Attach user context as header for downstream use
  const response = NextResponse.next();
  response.headers.set("x-operator-id", user.operatorId);
  response.headers.set("x-user-id", user.id);
  return response;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
