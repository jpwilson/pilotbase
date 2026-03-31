import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { SuggestionService } from "@/lib/engine/suggestions";
import { FSP } from "@/lib/fsp";
import { logger } from "@/lib/utils/logger";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    const service = new SuggestionService(user.operatorId);

    // 1. Approve the suggestion
    const suggestion = await service.approve(id, user.id);

    // 2. Execute the booking in FSP
    try {
      const fsp = new FSP({
        baseUrl: process.env.FSP_API_BASE_URL!,
        operatorId: user.operatorId,
      });

      if (suggestion.proposed_start && suggestion.proposed_end) {
        // Validate first, then create
        const result = await fsp.reservations.validateAndCreate({
          aircraftId: suggestion.aircraft_id || "",
          application: 2,
          client: "V4",
          comments: `Auto-scheduled by PilotBase (${suggestion.type})`,
          end: suggestion.proposed_end,
          equipmentIds: [],
          estimatedFlightHours: "1.00",
          flightRoute: "",
          flightRules: 1,
          flightType: 0,
          instructorId: suggestion.instructor_id || "",
          instructorPostFlightMinutes: 15,
          instructorPreFlightMinutes: 15,
          internalComments: `Suggestion ID: ${suggestion.id}`,
          locationId: parseInt(suggestion.location_id || "0"),
          operatorId: parseInt(user.operatorId),
          overrideExceptions: false,
          pilotId: suggestion.student_id || "",
          recurring: false,
          reservationTypeId: "",
          schedulingGroupId: null,
          schedulingGroupSlotId: null,
          sendEmailNotification: true,
          start: suggestion.proposed_start,
          trainingSessions: [],
        });

        if (result.errors && result.errors.length > 0) {
          await service.markFailed(id, result.errors.map((e) => e.message).join("; "));
          return NextResponse.json(
            { error: "FSP validation failed", details: result.errors },
            { status: 422 }
          );
        }

        if (result.id) {
          await service.markExecuted(id, result.id);
        }
      }

      return NextResponse.json({ data: suggestion });
    } catch (fspError) {
      logger.error("Failed to execute approved suggestion in FSP", {
        suggestionId: id,
        error: String(fspError),
      });
      await service.markFailed(id, String(fspError));
      return NextResponse.json({ error: "Failed to create reservation in FSP" }, { status: 502 });
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
