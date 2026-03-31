import type {
  FSPUserAvailability,
  FSPSchedulableEvent,
  FSPCivilTwilight,
  TimeOfDay,
} from "@/lib/fsp/types";
import { isWithinDaylightHours } from "@/lib/utils/dates";

export interface ConstraintResult {
  satisfied: boolean;
  violations: string[];
}

/**
 * Check if a proposed time slot satisfies all scheduling constraints.
 */
export function checkSlotConstraints(params: {
  start: string;
  end: string;
  studentAvailability?: FSPUserAvailability;
  instructorAvailability?: FSPUserAvailability;
  civilTwilight?: FSPCivilTwilight;
  timeOfDay?: TimeOfDay;
  event?: FSPSchedulableEvent;
}): ConstraintResult {
  const violations: string[] = [];

  // Daylight constraint
  if (params.timeOfDay === 1 && params.civilTwilight) {
    // Day flights must be within civil twilight
    if (
      !isWithinDaylightHours(
        params.start,
        params.end,
        params.civilTwilight.startDate,
        params.civilTwilight.endDate
      )
    ) {
      violations.push("Proposed time is outside daylight hours (civil twilight)");
    }
  }

  // Student availability
  if (params.studentAvailability) {
    if (!isWithinAvailability(params.start, params.end, params.studentAvailability)) {
      violations.push("Student is not available during proposed time");
    }
  }

  // Instructor availability
  if (params.instructorAvailability) {
    if (!isWithinAvailability(params.start, params.end, params.instructorAvailability)) {
      violations.push("Instructor is not available during proposed time");
    }
  }

  return {
    satisfied: violations.length === 0,
    violations,
  };
}

/**
 * Check if a time range falls within a user's availability windows.
 */
function isWithinAvailability(
  start: string,
  end: string,
  availability: FSPUserAvailability
): boolean {
  const startDate = new Date(start);
  const dayOfWeek = startDate.getUTCDay();

  // Check for unavailability overrides first
  for (const override of availability.availabilityOverrides) {
    if (override.isUnavailable) {
      const overrideStart = new Date(override.startTime);
      const overrideEnd = new Date(override.endTime);
      const eventStart = new Date(start);
      const eventEnd = new Date(end);

      // If the event overlaps with an unavailability override, it's not available
      if (eventStart < overrideEnd && eventEnd > overrideStart) {
        return false;
      }
    }
  }

  // Check recurring availability for the day of week
  const dayAvailability = availability.availabilities.filter((a) => a.dayOfWeek === dayOfWeek);

  if (dayAvailability.length === 0) {
    return false; // No availability set for this day
  }

  // Check if the proposed time falls within any availability window
  const startTime = formatTimeOnly(start);
  const endTime = formatTimeOnly(end);

  return dayAvailability.some((window) => {
    return startTime >= window.startAtTimeUtc && endTime <= window.endAtTimeUtc;
  });
}

function formatTimeOnly(isoDate: string): string {
  const date = new Date(isoDate);
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

/**
 * Check if an aircraft is compatible with a schedulable event.
 */
export function isAircraftCompatible(aircraftId: string, event: FSPSchedulableEvent): boolean {
  // If event specifies aircraft, check direct match
  if (event.aircraftIds.length > 0) {
    return event.aircraftIds.includes(aircraftId);
  }
  // If no specific aircraft required, it's compatible (scheduling group will handle it)
  return true;
}

/**
 * Check if an instructor is compatible with a schedulable event.
 */
export function isInstructorCompatible(instructorId: string, event: FSPSchedulableEvent): boolean {
  if (!event.instructorRequired) return true;
  if (event.instructorIds.length === 0) return true; // Any instructor
  return event.instructorIds.includes(instructorId);
}
