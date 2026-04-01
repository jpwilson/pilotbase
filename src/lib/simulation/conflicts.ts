import { parseISO, differenceInDays, differenceInMinutes } from "date-fns";
import type { SimState, SimConflict, ConflictType } from "./types";

let _conflictCounter = 0;
function nextConflictId(): string {
  return `conflict-${++_conflictCounter}`;
}

export function detectConflicts(state: SimState, clock: string): SimConflict[] {
  const conflicts: SimConflict[] = [];
  const existingIds = new Set(state.conflicts.map((c) => c.id));

  // 1. Double bookings — same aircraft or same instructor overlapping scheduled bookings
  const scheduled = state.bookings.filter((b) => b.status === "scheduled");

  for (let i = 0; i < scheduled.length; i++) {
    for (let j = i + 1; j < scheduled.length; j++) {
      const a = scheduled[i];
      const b = scheduled[j];

      const aStart = parseISO(a.start).getTime();
      const aEnd = parseISO(a.end).getTime();
      const bStart = parseISO(b.start).getTime();
      const bEnd = parseISO(b.end).getTime();

      const overlaps = aStart < bEnd && bStart < aEnd;
      if (!overlaps) continue;

      // Aircraft double-booking
      if (a.aircraftId === b.aircraftId) {
        const conflictKey = `double_booking_ac_${[a.id, b.id].sort().join("_")}`;
        const alreadyExists = state.conflicts.some(
          (c) =>
            c.type === "double_booking" &&
            c.description.includes(a.id) &&
            c.description.includes(b.id)
        );
        if (!alreadyExists) {
          const aircraft = state.aircraft.find((ac) => ac.id === a.aircraftId);
          conflicts.push({
            id: `${conflictKey}_${nextConflictId()}`,
            type: "double_booking" as ConflictType,
            severity: "error",
            detectedAt: clock,
            description: `Aircraft ${aircraft?.registration ?? a.aircraftId} double-booked: bookings ${a.id} and ${b.id} overlap`,
            affectedAircraftId: a.aircraftId,
            autoResolved: false,
          });
        }
      }

      // Instructor double-booking
      if (
        a.instructorId &&
        b.instructorId &&
        a.instructorId === b.instructorId
      ) {
        const conflictKey = `double_booking_ins_${[a.id, b.id].sort().join("_")}`;
        const alreadyExists = state.conflicts.some(
          (c) =>
            c.type === "double_booking" &&
            c.description.includes(a.id) &&
            c.description.includes(b.id) &&
            c.description.includes("instructor")
        );
        if (!alreadyExists) {
          const instructor = state.instructors.find((ins) => ins.id === a.instructorId);
          conflicts.push({
            id: `${conflictKey}_${nextConflictId()}`,
            type: "double_booking" as ConflictType,
            severity: "error",
            detectedAt: clock,
            description: `Instructor ${instructor?.name ?? a.instructorId} double-booked: bookings ${a.id} and ${b.id} overlap`,
            affectedInstructorId: a.instructorId,
            autoResolved: false,
          });
        }
      }
    }
  }

  // 2. Proficiency gaps — student hasn't flown in >7 days and no booking in next 7 days
  const clockTime = parseISO(clock).getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  for (const student of state.students) {
    const daysSinceLastFlight = differenceInDays(parseISO(clock), parseISO(student.lastFlightAt));

    if (daysSinceLastFlight > 7) {
      // Check if there's an upcoming booking within the next 7 days
      const hasUpcomingBooking = state.bookings.some(
        (b) =>
          b.studentId === student.id &&
          b.status === "scheduled" &&
          parseISO(b.start).getTime() > clockTime &&
          parseISO(b.start).getTime() < clockTime + sevenDaysMs
      );

      if (!hasUpcomingBooking) {
        const alreadyExists = state.conflicts.some(
          (c) =>
            c.type === "proficiency_gap" &&
            c.affectedStudentId === student.id &&
            !c.autoResolved
        );

        if (!alreadyExists) {
          conflicts.push({
            id: `proficiency_gap_${student.id}_${nextConflictId()}`,
            type: "proficiency_gap" as ConflictType,
            severity: "warning",
            detectedAt: clock,
            description: `${student.name} has not flown in ${daysSinceLastFlight} days and has no upcoming booking within 7 days`,
            affectedStudentId: student.id,
            autoResolved: false,
          });
        }
      }
    }
  }

  // 3. Instructor overload — instructor has >maxHoursPerDay scheduled on a single day
  const instructorDayMap: Record<string, Record<string, number>> = {};

  for (const booking of scheduled) {
    if (!booking.instructorId) continue;
    const dayKey = parseISO(booking.start).toISOString().slice(0, 10);
    if (!instructorDayMap[booking.instructorId]) {
      instructorDayMap[booking.instructorId] = {};
    }
    const durationHours =
      differenceInMinutes(parseISO(booking.end), parseISO(booking.start)) / 60;
    instructorDayMap[booking.instructorId][dayKey] =
      (instructorDayMap[booking.instructorId][dayKey] ?? 0) + durationHours;
  }

  for (const [instructorId, dayMap] of Object.entries(instructorDayMap)) {
    const instructor = state.instructors.find((ins) => ins.id === instructorId);
    if (!instructor) continue;

    for (const [dayKey, hours] of Object.entries(dayMap)) {
      if (hours > instructor.maxHoursPerDay) {
        const alreadyExists = state.conflicts.some(
          (c) =>
            c.type === "instructor_overload" &&
            c.affectedInstructorId === instructorId &&
            c.description.includes(dayKey)
        );

        if (!alreadyExists) {
          conflicts.push({
            id: `instructor_overload_${instructorId}_${dayKey}_${nextConflictId()}`,
            type: "instructor_overload" as ConflictType,
            severity: "warning",
            detectedAt: clock,
            description: `${instructor.name} scheduled for ${hours.toFixed(1)}h on ${dayKey} (max ${instructor.maxHoursPerDay}h/day)`,
            affectedInstructorId: instructorId,
            autoResolved: false,
          });
        }
      }
    }
  }

  // 4. Aircraft overutilized — aircraft scheduled >availableHoursPerDay on a single day
  const aircraftDayMap: Record<string, Record<string, number>> = {};

  for (const booking of scheduled) {
    const dayKey = parseISO(booking.start).toISOString().slice(0, 10);
    if (!aircraftDayMap[booking.aircraftId]) {
      aircraftDayMap[booking.aircraftId] = {};
    }
    const durationHours =
      differenceInMinutes(parseISO(booking.end), parseISO(booking.start)) / 60;
    aircraftDayMap[booking.aircraftId][dayKey] =
      (aircraftDayMap[booking.aircraftId][dayKey] ?? 0) + durationHours;
  }

  for (const [aircraftId, dayMap] of Object.entries(aircraftDayMap)) {
    const aircraft = state.aircraft.find((ac) => ac.id === aircraftId);
    if (!aircraft) continue;

    for (const [dayKey, hours] of Object.entries(dayMap)) {
      if (hours > aircraft.availableHoursPerDay) {
        const alreadyExists = state.conflicts.some(
          (c) =>
            c.type === "aircraft_overutilized" &&
            c.affectedAircraftId === aircraftId &&
            c.description.includes(dayKey)
        );

        if (!alreadyExists) {
          conflicts.push({
            id: `aircraft_overutilized_${aircraftId}_${dayKey}_${nextConflictId()}`,
            type: "aircraft_overutilized" as ConflictType,
            severity: "warning",
            detectedAt: clock,
            description: `Aircraft ${aircraft.registration} scheduled for ${hours.toFixed(1)}h on ${dayKey} (max ${aircraft.availableHoursPerDay}h/day)`,
            affectedAircraftId: aircraftId,
            autoResolved: false,
          });
        }
      }
    }
  }

  return conflicts;
}
