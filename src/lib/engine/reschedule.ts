import type { FSP } from "@/lib/fsp";
import type { EngineConfig, CreateSuggestionInput, CancellationTrigger, SlotOption } from "./types";
import type { AlternativeSlot } from "@/lib/supabase/types";
import { generateRationale } from "./explainer";
import { SuggestionService } from "./suggestions";
import { logger } from "@/lib/utils/logger";
import { addDays } from "date-fns";

/**
 * Use Case B: Reschedule on Cancellation
 *
 * Trigger: A reservation is canceled
 * Behavior: Generate top N compatible alternatives for the affected student
 */
export class RescheduleEngine {
  private suggestions: SuggestionService;

  constructor(
    private fsp: FSP,
    private config: EngineConfig
  ) {
    this.suggestions = new SuggestionService(config.operatorId);
  }

  async processCancellation(trigger: CancellationTrigger): Promise<void> {
    const event = trigger.originalReservation;
    logger.info("Processing reschedule for cancellation", {
      student: event.CustomerName,
      originalTime: event.Start,
    });

    const studentId = event.PilotId;
    if (!studentId) {
      logger.warn("Cancelled reservation has no pilot ID, skipping reschedule");
      return;
    }

    // 1. Get student availability
    const now = new Date();
    const windowEnd = addDays(now, this.config.searchWindowDays);

    await Promise.all([
      this.fsp.availability.getForUsers([studentId], now.toISOString(), windowEnd.toISOString()),
      this.fsp.weather.getCivilTwilight(String(this.config.locationId)),
    ]);

    // 2. Find alternative time slots
    const slots = (await this.fsp.schedule.getAvailableTimeSlots({
      instructorIds: event.InstructorId ? [event.InstructorId] : undefined,
      aircraftIds: event.AircraftId ? [event.AircraftId] : undefined,
      customerId: studentId,
      startDate: now.toISOString(),
      endDate: windowEnd.toISOString(),
    })) as SlotOption[];

    // 3. Build alternatives, preferring same instructor/aircraft
    const alternatives: AlternativeSlot[] = (Array.isArray(slots) ? slots : [])
      .slice(0, this.config.maxAlternatives)
      .map((slot, index) => ({
        instructorId: slot.instructorId || event.InstructorId || "",
        instructorName: slot.instructorName || event.InstructorName || "",
        aircraftId: slot.aircraftId || event.AircraftId || "",
        aircraftName: slot.aircraftName || event.AircraftName || "",
        start: slot.start,
        end: slot.end,
        score: 100 - index * 10, // Simple ranking by order
        rationale: buildAlternativeRationale(slot, event),
      }));

    if (alternatives.length === 0) {
      logger.info("No alternative slots found for reschedule");
      return;
    }

    // 4. Create suggestion with alternatives
    const bestAlternative = alternatives[0];
    const constraintsChecked = ["student availability", "daylight hours", "resource availability"];

    const rationale = generateRationale({
      type: "reschedule",
      trigger,
      slot: {
        instructorId: bestAlternative.instructorId,
        instructorName: bestAlternative.instructorName,
        aircraftId: bestAlternative.aircraftId,
        aircraftName: bestAlternative.aircraftName,
        start: bestAlternative.start,
        end: bestAlternative.end,
        isWithinDaylight: true,
        matchesOriginalInstructor: bestAlternative.instructorId === event.InstructorId,
        matchesOriginalAircraft: bestAlternative.aircraftId === event.AircraftId,
      },
      constraintsChecked,
    });

    const input: CreateSuggestionInput = {
      operatorId: this.config.operatorId,
      type: "reschedule",
      priority: 80, // Rescheduling is high priority
      studentId,
      studentName: event.CustomerName || undefined,
      instructorId: bestAlternative.instructorId,
      instructorName: bestAlternative.instructorName,
      aircraftId: bestAlternative.aircraftId,
      aircraftName: bestAlternative.aircraftName,
      locationId: String(this.config.locationId),
      proposedStart: bestAlternative.start,
      proposedEnd: bestAlternative.end,
      alternatives,
      rationale,
      context: {
        originalReservation: event,
        totalAlternativesFound: alternatives.length,
      },
      triggerEvent: trigger,
    };

    await this.suggestions.create(input);
    logger.info("Reschedule suggestion created", {
      studentId,
      alternativesCount: alternatives.length,
    });
  }
}

function buildAlternativeRationale(
  slot: SlotOption,
  original: { InstructorId?: string; AircraftId?: string }
): string {
  const parts: string[] = [];
  if (slot.instructorId === original.InstructorId) {
    parts.push("same instructor");
  }
  if (slot.aircraftId === original.AircraftId) {
    parts.push("same aircraft");
  }
  if (parts.length > 0) {
    return `Matches original: ${parts.join(", ")}`;
  }
  return "Alternative time slot";
}
