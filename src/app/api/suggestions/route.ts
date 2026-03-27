import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { SuggestionService } from "@/lib/engine/suggestions";
import type { SuggestionStatus, SuggestionType } from "@/lib/supabase/types";

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const service = new SuggestionService(user.operatorId);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as SuggestionStatus | null;
    const type = searchParams.get("type") as SuggestionType | null;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;

    const suggestions = status === "pending"
      ? await service.listPending({ type: type ?? undefined, limit })
      : await service.listAll({ status: status ?? undefined, type: type ?? undefined, limit });

    return NextResponse.json({ data: suggestions });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
