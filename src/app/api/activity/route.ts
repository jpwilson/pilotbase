import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { AuditService } from "@/lib/engine/audit";

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const service = new AuditService(user.operatorId);

    const limit = request.nextUrl.searchParams.get("limit")
      ? parseInt(request.nextUrl.searchParams.get("limit")!)
      : 50;

    const events = await service.getRecent(limit);

    return NextResponse.json({ data: events });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
