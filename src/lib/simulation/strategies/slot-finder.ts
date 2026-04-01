import { parseISO, addMinutes, addHours, differenceInMinutes } from "date-fns";
import type { SimState, SimBooking, SimStudent, SimInstructor, SimAircraft } from "../types";

let _bookingCounter = 0;

export function nextBookingId(): string {
  return `sim-gen-bk-${++_bookingCounter}`;
}

/**
 * Check whether a [start, end) slot is free for the given student/instructor/aircraft.
 * Returns true if no scheduled booking overlaps.
 */
function slotIsFree(
  start: Date,
  end: Date,
  studentId: string,
  instructorId: string | null,
  aircraftId: string,
  state: SimState
): boolean {
  const startMs = start.getTime();
  const endMs = end.getTime();

  for (const b of state.bookings) {
    if (b.status !== "scheduled") continue;
    const bStart = parseISO(b.start).getTime();
    const bEnd = parseISO(b.end).getTime();
    const overlaps = startMs < bEnd && bStart < endMs;
    if (!overlaps) continue;

    if (b.studentId === studentId) return false;
    if (instructorId && b.instructorId === instructorId) return false;
    if (b.aircraftId === aircraftId) return false;
  }
  return true;
}

/**
 * Find the first available slot for a student/instructor/aircraft combination
 * scanning from `afterTime` in 1-hour increments during 08:00-18:00 UTC.
 * Returns [startISO, endISO] or null.
 */
export function findSlot(
  studentId: string,
  instructorId: string | null,
  aircraftId: string,
  durationMinutes: number,
  afterTime: string,
  state: SimState,
  maxDaysAhead = 7
): { start: string; end: string } | null {
  const durationMs = durationMinutes * 60 * 1000;
  const afterDate = parseISO(afterTime);
  // Start from the beginning of the same day or afterTime, whichever is later
  const searchStart = new Date(
    Math.max(afterDate.getTime(), new Date(afterDate.toISOString().slice(0, 10) + "T08:00:00.000Z").getTime())
  );
  const maxSearch = addHours(afterDate, maxDaysAhead * 24);

  // Scan in 1-hour increments
  let cursor = new Date(searchStart);

  // Snap cursor to 08:00 UTC on its day if before that
  const dayStart = new Date(cursor.toISOString().slice(0, 10) + "T08:00:00.000Z");
  if (cursor < dayStart) cursor = dayStart;

  while (cursor < maxSearch) {
    const slotDate = cursor.toISOString().slice(0, 10);
    const dayEndTime = new Date(slotDate + "T18:00:00.000Z").getTime();

    // Skip if slot would extend past 18:00
    if (cursor.getTime() + durationMs > dayEndTime) {
      // Move to next day 08:00
      const nextDay = new Date(cursor);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      cursor = new Date(nextDay.toISOString().slice(0, 10) + "T08:00:00.000Z");
      continue;
    }

    const slotEnd = new Date(cursor.getTime() + durationMs);

    if (slotIsFree(cursor, slotEnd, studentId, instructorId, aircraftId, state)) {
      return { start: cursor.toISOString(), end: slotEnd.toISOString() };
    }

    // Advance by 1 hour
    cursor = addHours(cursor, 1);
  }

  return null;
}

/**
 * Get scheduled hours for an instructor on a given date (YYYY-MM-DD UTC).
 */
export function getInstructorHoursOnDay(instructorId: string, dayKey: string, state: SimState): number {
  let total = 0;
  for (const b of state.bookings) {
    if (b.status !== "scheduled") continue;
    if (b.instructorId !== instructorId) continue;
    if (b.start.slice(0, 10) !== dayKey) continue;
    total += differenceInMinutes(parseISO(b.end), parseISO(b.start)) / 60;
  }
  return total;
}

/**
 * Get scheduled hours for an aircraft on a given date (YYYY-MM-DD UTC).
 */
export function getAircraftHoursOnDay(aircraftId: string, dayKey: string, state: SimState): number {
  let total = 0;
  for (const b of state.bookings) {
    if (b.status !== "scheduled") continue;
    if (b.aircraftId !== aircraftId) continue;
    if (b.start.slice(0, 10) !== dayKey) continue;
    total += differenceInMinutes(parseISO(b.end), parseISO(b.start)) / 60;
  }
  return total;
}

/**
 * Find available instructor for the given slot.
 */
export function findAvailableInstructor(
  start: Date,
  end: Date,
  state: SimState
): SimInstructor | null {
  for (const instructor of state.instructors) {
    if (instructor.isSick) continue;
    const dayKey = start.toISOString().slice(0, 10);
    const existingHours = getInstructorHoursOnDay(instructor.id, dayKey, state);
    const slotHours = differenceInMinutes(end, start) / 60;
    if (existingHours + slotHours > instructor.maxHoursPerDay) continue;

    // Check no overlap
    const startMs = start.getTime();
    const endMs = end.getTime();
    const hasOverlap = state.bookings.some((b) => {
      if (b.status !== "scheduled") return false;
      if (b.instructorId !== instructor.id) return false;
      const bStart = parseISO(b.start).getTime();
      const bEnd = parseISO(b.end).getTime();
      return startMs < bEnd && bStart < endMs;
    });

    if (!hasOverlap) return instructor;
  }
  return null;
}

/**
 * Find available aircraft for the given slot (respecting cplOnly).
 */
export function findAvailableAircraft(
  start: Date,
  end: Date,
  state: SimState,
  cplOnly: boolean
): SimAircraft | null {
  const candidates = state.aircraft.filter(
    (ac) => !ac.inMaintenance && (cplOnly ? ac.cplOnly : true)
  );
  if (!cplOnly) {
    // Also allow non-cplOnly aircraft
    for (const ac of state.aircraft) {
      if (!ac.inMaintenance && !candidates.includes(ac)) candidates.push(ac);
    }
  }

  for (const ac of candidates) {
    if (ac.inMaintenance) continue;
    if (cplOnly && !ac.cplOnly) continue;

    const dayKey = start.toISOString().slice(0, 10);
    const existingHours = getAircraftHoursOnDay(ac.id, dayKey, state);
    const slotHours = differenceInMinutes(end, start) / 60;
    if (existingHours + slotHours > ac.availableHoursPerDay) continue;

    const startMs = start.getTime();
    const endMs = end.getTime();
    const hasOverlap = state.bookings.some((b) => {
      if (b.status !== "scheduled") return false;
      if (b.aircraftId !== ac.id) return false;
      const bStart = parseISO(b.start).getTime();
      const bEnd = parseISO(b.end).getTime();
      return startMs < bEnd && bStart < endMs;
    });

    if (!hasOverlap) return ac;
  }
  return null;
}
