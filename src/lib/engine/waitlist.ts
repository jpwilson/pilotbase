import type { FSP } from "@/lib/fsp";
import type { EngineConfig, CreateSuggestionInput, OpeningTrigger, CancellationTrigger } from "./types";
import { rankCandidates } from "./ranker";

import { generateRationale } from "./explainer";
import { SuggestionService } from "./suggestions";
import { logger } from "@/lib/utils/logger";
import type { StudentCandidate } from "./types";
import { addDays } from "date-fns";

/**
 * Use Case A: Waitlist Automation
 *
 * Trigger: Schedule opening (cancellation, schedule shift, or periodic detection)
 * Behavior: Rank eligible candidates, propose booking to scheduler
 */
export class WaitlistEngine {
  private suggestions: SuggestionService;

  constructor(
    private fsp: FSP,
    private config: EngineConfig
  ) {
    this.suggestions = new SuggestionService(config.operatorId);
  }

  async processOpening(trigger: OpeningTrigger | CancellationTrigger): Promise<void> {
    logger.info("Processing waitlist for opening", { trigger: trigger.type });

    // 1. Get pending training events (the waitlist)
    const now = new Date();
    const windowEnd = addDays(now, this.config.searchWindowDays);

    const schedulableEvents = await this.fsp.training.getSchedulableEvents({
      startDate: now.toISOString(),
      endDate: windowEnd.toISOString(),
      locationId: this.config.locationId,
    });

    if (schedulableEvents.length === 0) {
      logger.info("No schedulable events found for waitlist");
      return;
    }

    // 2. Get availability for all candidate students
    const studentIds = [...new Set(schedulableEvents.map((e) => e.studentId))];
    const availabilities = await this.fsp.availability.getForUsers(
      studentIds,
      now.toISOString(),
      windowEnd.toISOString()
    );
    const availabilityMap = new Map(availabilities.map((a) => [a.userGuidId, a]));

    // 3. Get civil twilight for daylight constraints
    const civilTwilight = await this.fsp.weather.getCivilTwilight(
      String(this.config.locationId)
    );

    // 4. Build candidate list with scoring data
    const candidates: StudentCandidate[] = schedulableEvents.map((event, index) => ({
      studentId: event.studentId,
      studentName: `${event.studentFirstName} ${event.studentLastName}`,
      daysSinceLastFlight: 0, // Would be computed from reservation history
      daysUntilNextFlight: null,
      totalFlightHours: 0, // Would be computed from FSP data
      enrollmentProgress: 0,
      waitlistPosition: index + 1,
      schedulableEvent: event,
    }));

    // 5. Rank candidates
    const ranked = rankCandidates(candidates, this.config.priorityWeights);

    // 6. For each top candidate, find compatible slots and create suggestions
    const maxSuggestions = Math.min(ranked.length, this.config.maxAlternatives);

    for (let i = 0; i < maxSuggestions; i++) {
      const candidate = ranked[i];
      const event = candidate.schedulableEvent;
      const availability = availabilityMap.get(candidate.studentId);

      // Find available time slots using Find-a-Time
      const slots = await this.fsp.schedule.getAvailableTimeSlots({
        activityTypeId: event.activityTypeId,
        instructorIds: event.instructorIds.length > 0 ? event.instructorIds : undefined,
        aircraftIds: event.aircraftIds.length > 0 ? event.aircraftIds : undefined,
        schedulingGroupIds:
          event.schedulingGroupIds.length > 0 ? event.schedulingGroupIds : undefined,
        customerId: candidate.studentId,
        startDate: now.toISOString(),
        endDate: windowEnd.toISOString(),
        duration: event.durationTotal,
      });

      // Check constraints on the best slot
      const constraintsChecked: string[] = [];
      if (availability) constraintsChecked.push("student availability");
      if (civilTwilight) constraintsChecked.push("daylight hours");
      constraintsChecked.push("aircraft compatibility", "instructor compatibility");

      const rationale = generateRationale({
        type: "waitlist",
        trigger,
        candidate,
        constraintsChecked,
      });

      const input: CreateSuggestionInput = {
        operatorId: this.config.operatorId,
        type: "waitlist",
        priority: Math.round(candidate.score * 100),
        studentId: candidate.studentId,
        studentName: candidate.studentName,
        locationId: String(this.config.locationId),
        activityTypeId: event.activityTypeId,
        rationale,
        context: {
          schedulableEvent: event,
          score: candidate.score,
          scoreBreakdown: candidate.scoreBreakdown,
          availableSlots: slots,
        },
        triggerEvent: trigger,
      };

      await this.suggestions.create(input);
      logger.info("Waitlist suggestion created", {
        studentId: candidate.studentId,
        score: candidate.score,
      });
    }
  }
}
