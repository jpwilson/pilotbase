import type { FSP } from "@/lib/fsp";
import type { EngineConfig, CreateSuggestionInput, DiscoveryTrigger, SlotOption } from "./types";
import type { AlternativeSlot } from "@/lib/supabase/types";
import { generateRationale } from "./explainer";
import { SuggestionService } from "./suggestions";
import { logger } from "@/lib/utils/logger";
import { addDays } from "date-fns";

/**
 * Use Case C: Discovery Flight Booking
 *
 * Trigger: A prospect requests a discovery flight
 * Behavior: Generate available options respecting daylight constraints
 */
export class DiscoveryEngine {
  private suggestions: SuggestionService;

  constructor(
    private fsp: FSP,
    private config: EngineConfig
  ) {
    this.suggestions = new SuggestionService(config.operatorId);
  }

  async processRequest(
    trigger: DiscoveryTrigger,
    request: {
      prospectName: string;
      prospectEmail?: string;
      preferredDates?: string[];
    }
  ): Promise<void> {
    logger.info("Processing discovery flight request", {
      prospect: request.prospectName,
    });

    // 1. Find the discovery flight activity type
    const activityTypes = await this.fsp.resources.listActivityTypes();
    const discoveryActivity = activityTypes.find(
      (a) => a.isActive && a.name.toLowerCase().includes("discovery")
    );

    if (!discoveryActivity) {
      logger.warn("No discovery flight activity type found for operator");
      return;
    }

    // 2. Get eligible instructors and aircraft
    await Promise.all([
      this.fsp.resources.listInstructors(),
      this.fsp.resources.listAircraft(),
      this.fsp.weather.getCivilTwilight(String(this.config.locationId)),
    ]);

    // 3. Find available slots within search window
    const now = new Date();
    const windowEnd = addDays(now, this.config.searchWindowDays);

    const slots = (await this.fsp.schedule.getAvailableTimeSlots({
      activityTypeId: discoveryActivity.id,
      startDate: now.toISOString(),
      endDate: windowEnd.toISOString(),
    })) as SlotOption[];

    // 4. Filter to daylight-only slots
    // Discovery flights are always during daylight hours
    const daylightSlots = Array.isArray(slots) ? slots.filter((s) => s.isWithinDaylight !== false) : [];

    if (daylightSlots.length === 0) {
      logger.info("No daylight slots found for discovery flight");
      return;
    }

    // 5. Build alternatives
    const alternatives: AlternativeSlot[] = daylightSlots
      .slice(0, this.config.maxAlternatives)
      .map((slot, index) => ({
        instructorId: slot.instructorId,
        instructorName: slot.instructorName,
        aircraftId: slot.aircraftId,
        aircraftName: slot.aircraftName,
        start: slot.start,
        end: slot.end,
        score: 100 - index * 10,
        rationale: "Available during daylight hours",
      }));

    // 6. Create suggestion
    const bestSlot = alternatives[0];
    const constraintsChecked = ["daylight hours", "instructor availability", "aircraft availability"];

    const rationale = generateRationale({
      type: "discovery",
      trigger,
      slot: {
        ...bestSlot,
        isWithinDaylight: true,
        matchesOriginalInstructor: false,
        matchesOriginalAircraft: false,
      },
      constraintsChecked,
      additionalContext: `${alternatives.length} daylight slots available for ${request.prospectName}.`,
    });

    const input: CreateSuggestionInput = {
      operatorId: this.config.operatorId,
      type: "discovery",
      priority: 50,
      studentName: request.prospectName,
      instructorId: bestSlot.instructorId,
      instructorName: bestSlot.instructorName,
      aircraftId: bestSlot.aircraftId,
      aircraftName: bestSlot.aircraftName,
      locationId: String(this.config.locationId),
      activityTypeId: discoveryActivity.id,
      proposedStart: bestSlot.start,
      proposedEnd: bestSlot.end,
      alternatives,
      rationale,
      context: {
        prospectEmail: request.prospectEmail,
        preferredDates: request.preferredDates,
        discoveryActivityId: discoveryActivity.id,
        totalSlotsFound: daylightSlots.length,
      },
      triggerEvent: trigger,
    };

    await this.suggestions.create(input);
    logger.info("Discovery flight suggestion created", {
      prospect: request.prospectName,
      slotsFound: alternatives.length,
    });
  }
}
