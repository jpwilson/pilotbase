import { NextRequest, NextResponse } from "next/server";
import { checkCompletions } from "@/lib/jobs/completion-checker";
import { logger } from "@/lib/utils/logger";

/**
 * Cron endpoint: Check for completed lessons and generate next-lesson suggestions.
 * Expected to run every 15 minutes.
 *
 * Security: Requires CRON_SECRET header.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { operatorId, locationId } = body;

    if (!operatorId || !locationId) {
      return NextResponse.json(
        { error: "operatorId and locationId are required" },
        { status: 400 }
      );
    }

    const result = await checkCompletions(operatorId, locationId);

    return NextResponse.json({
      data: {
        suggestionsCreated: result.suggestionsCreated,
      },
    });
  } catch (error) {
    logger.error("Completion checker cron failed", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
