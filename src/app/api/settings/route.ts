import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { OperatorConfigService } from "@/lib/engine/config";

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const service = new OperatorConfigService(user.operatorId);
    const config = await service.get();
    return NextResponse.json({ data: config });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const body = await request.json();
    const service = new OperatorConfigService(user.operatorId);
    const config = await service.update(body);
    return NextResponse.json({ data: config });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
