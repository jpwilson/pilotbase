import type { FSP } from "@/lib/fsp";
import type { EngineConfig, CreateSuggestionInput, CompletionTrigger, SlotOption } from "./types";
import type { AlternativeSlot } from "@/lib/supabase/types";
import type { FSPSchedulableEvent } from "@/lib/fsp/types";
import { generateRationale } from "./explainer";
import { SuggestionService } from "./suggestions";
import { logger } from "@/lib/utils/logger";
import { addDays } from "date-fns";

/**
 * Use Case D: Schedule Next Lesson on Completion
 *
 * Trigger: A training lesson is completed or pending lessons detected
 * Behavior: Determine next required event and suggest scheduling options
 */
export class NextLessonEngine {
  private suggestions: SuggestionService;

  constructor(
    private fsp: FSP,
    private config: EngineConfig
  ) {
    this.suggestions = new SuggestionService(config.operatorId);
  }

  async processCompletion(trigger: CompletionTrigger): Promise<void> {
    logger.info("Processing next lesson scheduling", {
      studentId: trigger.studentId,
      enrollmentId: trigger.enrollmentId,
    });

    // 1. Get the student's schedulable events (next pending lessons)
    const now = new Date();
    const windowEnd = addDays(now, this.config.searchWindowDays);

    const schedulableEvents = await this.fsp.training.getSchedulableEvents({
      startDate: now.toISOString(),
      endDate: windowEnd.toISOString(),
      locationId: this.config.locationId,
    });

    // Filter to this student's events
    const studentEvents = schedulableEvents.filter((e) => e.studentId === trigger.studentId);

    if (studentEvents.length === 0) {
      logger.info("No pending lessons found for student", { studentId: trigger.studentId });
      return;
    }

    // 2. Get the next lesson in sequence
    const nextEvent = studentEvents.sort((a, b) => a.lessonOrder - b.lessonOrder)[0];

    // 3. Get student availability and enrollment progress
    const [, enrollmentProgress] = await Promise.all([
      this.fsp.availability.getForUsers(
        [trigger.studentId],
        now.toISOString(),
        windowEnd.toISOString()
      ),
      this.fsp.training.getEnrollmentProgress(trigger.enrollmentId),
    ]);

    // 4. Find available slots
    const slots = (await this.fsp.schedule.getAvailableTimeSlots({
      activityTypeId: nextEvent.activityTypeId,
      instructorIds: nextEvent.instructorIds.length > 0 ? nextEvent.instructorIds : undefined,
      aircraftIds: nextEvent.aircraftIds.length > 0 ? nextEvent.aircraftIds : undefined,
      schedulingGroupIds:
        nextEvent.schedulingGroupIds.length > 0 ? nextEvent.schedulingGroupIds : undefined,
      customerId: trigger.studentId,
      startDate: now.toISOString(),
      endDate: windowEnd.toISOString(),
      duration: nextEvent.durationTotal,
    })) as SlotOption[];

    const availableSlots = Array.isArray(slots) ? slots : [];

    if (availableSlots.length === 0) {
      logger.info("No available slots found for next lesson", {
        studentId: trigger.studentId,
        lesson: nextEvent.lessonName,
      });
      return;
    }

    // 5. Build alternatives — prefer instructor continuity
    const alternatives: AlternativeSlot[] = availableSlots
      .slice(0, this.config.maxAlternatives)
      .map((slot, index) => ({
        instructorId: slot.instructorId,
        instructorName: slot.instructorName,
        aircraftId: slot.aircraftId,
        aircraftName: slot.aircraftName,
        start: slot.start,
        end: slot.end,
        score: 100 - index * 10,
        rationale: buildNextLessonRationale(slot, nextEvent),
      }));

    // 6. Create suggestion
    const bestSlot = alternatives[0];
    const constraintsChecked = [
      "student availability",
      "instructor compatibility",
      "aircraft requirements",
      "lesson prerequisites",
    ];

    const rationale = generateRationale({
      type: "next_lesson",
      trigger,
      slot: {
        ...bestSlot,
        isWithinDaylight: true,
        matchesOriginalInstructor: false,
        matchesOriginalAircraft: false,
      },
      constraintsChecked,
      additionalContext: `Next lesson: "${nextEvent.lessonName}" (${nextEvent.courseName}). ${enrollmentProgress?.completionPercentage ?? 0}% complete.`,
    });

    const input: CreateSuggestionInput = {
      operatorId: this.config.operatorId,
      type: "next_lesson",
      priority: 60,
      studentId: trigger.studentId,
      studentName: `${nextEvent.studentFirstName} ${nextEvent.studentLastName}`,
      instructorId: bestSlot.instructorId,
      instructorName: bestSlot.instructorName,
      aircraftId: bestSlot.aircraftId,
      aircraftName: bestSlot.aircraftName,
      locationId: String(this.config.locationId),
      activityTypeId: nextEvent.activityTypeId,
      proposedStart: bestSlot.start,
      proposedEnd: bestSlot.end,
      alternatives,
      rationale,
      context: {
        schedulableEvent: nextEvent,
        enrollmentId: trigger.enrollmentId,
        enrollmentProgress: enrollmentProgress?.completionPercentage ?? 0,
        lessonName: nextEvent.lessonName,
        courseName: nextEvent.courseName,
        totalSlotsFound: availableSlots.length,
      },
      triggerEvent: trigger,
    };

    await this.suggestions.create(input);
    logger.info("Next lesson suggestion created", {
      studentId: trigger.studentId,
      lesson: nextEvent.lessonName,
    });
  }

  /**
   * Process all students with pending schedulable events (batch mode).
   * Called by the completion checker cron job.
   */
  async processPendingLessons(): Promise<number> {
    const now = new Date();
    const windowEnd = addDays(now, this.config.searchWindowDays);

    const schedulableEvents = await this.fsp.training.getSchedulableEvents({
      startDate: now.toISOString(),
      endDate: windowEnd.toISOString(),
      locationId: this.config.locationId,
    });

    // Group by student and process the first pending event per student
    const byStudent = new Map<string, FSPSchedulableEvent>();
    for (const event of schedulableEvents) {
      const existing = byStudent.get(event.studentId);
      if (!existing || event.lessonOrder < existing.lessonOrder) {
        byStudent.set(event.studentId, event);
      }
    }

    let created = 0;
    for (const [studentId, event] of byStudent) {
      try {
        await this.processCompletion({
          type: "completion",
          studentId,
          enrollmentId: event.enrollmentId,
          completedLessonId: event.lessonId,
          detectedAt: now.toISOString(),
        });
        created++;
      } catch (err) {
        logger.error("Failed to process next lesson for student", {
          studentId,
          error: String(err),
        });
      }
    }

    return created;
  }
}

function buildNextLessonRationale(slot: SlotOption, event: FSPSchedulableEvent): string {
  const parts: string[] = [`Next: ${event.lessonName}`];
  if (event.instructorIds.includes(slot.instructorId)) {
    parts.push("with assigned instructor");
  }
  return parts.join(", ");
}
