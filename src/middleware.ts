import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth/middleware";

export function middleware(request: NextRequest): NextResponse | undefined {
  const result = authMiddleware(request);
  return result ?? undefined;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
