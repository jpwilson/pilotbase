import { NextRequest, NextResponse } from "next/server";
import { monitorSchedule } from "@/lib/jobs/schedule-monitor";
import { logger } from "@/lib/utils/logger";

/**
 * Cron endpoint: Monitor schedule for changes (cancellations, openings).
 * Expected to run every 5 minutes.
 *
 * Security: Requires CRON_SECRET header to prevent unauthorized access.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
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

    const result = await monitorSchedule(operatorId, locationId);

    return NextResponse.json({
      data: {
        changesDetected: result.changes.length,
        suggestionsCreated: result.suggestionsCreated,
      },
    });
  } catch (error) {
    logger.error("Schedule monitor cron failed", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
