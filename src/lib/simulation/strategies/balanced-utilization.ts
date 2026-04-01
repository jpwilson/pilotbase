import { parseISO, differenceInMinutes } from "date-fns";
import type { SimStrategy, SimBooking, SimState, SimStudent, SimAircraft, SimInstructor } from "../types";
import {
  getInstructorHoursOnDay,
  getAircraftHoursOnDay,
  nextBookingId,
} from "./slot-finder";

/**
 * Score a slot candidate by how evenly it distributes utilization.
 * Lower variance in remaining capacity = better balance.
 * We want to pick the aircraft/instructor that is MOST utilized (closest to full)
 * so we fill resources evenly.
 */
function utilizationScore(
  aircraft: SimAircraft,
  instructor: SimInstructor | null,
  dayKey: string,
  durationMinutes: number,
  state: SimState
): number {
  const durationHours = durationMinutes / 60;

  const acUsed = getAircraftHoursOnDay(aircraft.id, dayKey, state);
  const acRemaining = aircraft.availableHoursPerDay - acUsed - durationHours;
  const acPct = 1 - acRemaining / aircraft.availableHoursPerDay;

  let score = acPct;

  if (instructor) {
    const insUsed = getInstructorHoursOnDay(instructor.id, dayKey, state);
    const insRemaining = instructor.maxHoursPerDay - insUsed - durationHours;
    const insPct = 1 - insRemaining / instructor.maxHoursPerDay;
    score = (acPct + insPct) / 2;
  }

  return score;
}

function scheduleNextLesson(
  student: SimStudent,
  state: SimState,
  afterTime: string
): SimBooking | null {
  if (student.lessonQueue.length === 0) return null;
  const lesson = student.lessonQueue[0];
  const needsInstructor = lesson.requiresInstructor;
  const isCPL = student.program === "CPL" || student.program === "CFI";

  const afterDate = parseISO(afterTime);
  const maxSearch = new Date(afterDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  let cursor = new Date(afterDate);

  const dayStart08 = new Date(cursor.toISOString().slice(0, 10) + "T08:00:00.000Z");
  if (cursor < dayStart08) cursor = dayStart08;

  while (cursor < maxSearch) {
    const slotDate = cursor.toISOString().slice(0, 10);
    const dayEnd = new Date(slotDate + "T18:00:00.000Z").getTime();
    const durationMs = lesson.durationMinutes * 60 * 1000;

    if (cursor.getTime() + durationMs > dayEnd) {
      const nextDay = new Date(cursor);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      cursor = new Date(nextDay.toISOString().slice(0, 10) + "T08:00:00.000Z");
      continue;
    }

    const slotEnd = new Date(cursor.getTime() + durationMs);
    const dayKey = slotDate;

    // Check student availability
    const studentBusy = state.bookings.some((b) => {
      if (b.status !== "scheduled") return false;
      if (b.studentId !== student.id) return false;
      const bStart = parseISO(b.start).getTime();
      const bEnd = parseISO(b.end).getTime();
      return cursor.getTime() < bEnd && bStart < slotEnd.getTime();
    });

    if (studentBusy) {
      cursor = new Date(cursor.getTime() + 60 * 60 * 1000);
      continue;
    }

    // Find all available instructors and aircraft, pick by best utilization score
    const availableInstructors = needsInstructor
      ? state.instructors.filter((ins) => {
          if (ins.isSick) return false;
          const usedHours = getInstructorHoursOnDay(ins.id, dayKey, state);
          if (usedHours + lesson.durationMinutes / 60 > ins.maxHoursPerDay) return false;
          const startMs = cursor.getTime();
          const endMs = slotEnd.getTime();
          return !state.bookings.some((b) => {
            if (b.status !== "scheduled" || b.instructorId !== ins.id) return false;
            const bStart = parseISO(b.start).getTime();
            const bEnd = parseISO(b.end).getTime();
            return startMs < bEnd && bStart < endMs;
          });
        })
      : [];

    if (needsInstructor && availableInstructors.length === 0) {
      cursor = new Date(cursor.getTime() + 60 * 60 * 1000);
      continue;
    }

    const availableAircraft = state.aircraft.filter((ac) => {
      if (ac.inMaintenance) return false;
      if (isCPL && !ac.cplOnly) return false;
      if (!isCPL && ac.cplOnly) return false;
      const usedHours = getAircraftHoursOnDay(ac.id, dayKey, state);
      if (usedHours + lesson.durationMinutes / 60 > ac.availableHoursPerDay) return false;
      const startMs = cursor.getTime();
      const endMs = slotEnd.getTime();
      return !state.bookings.some((b) => {
        if (b.status !== "scheduled" || b.aircraftId !== ac.id) return false;
        const bStart = parseISO(b.start).getTime();
        const bEnd = parseISO(b.end).getTime();
        return startMs < bEnd && bStart < endMs;
      });
    });

    if (availableAircraft.length === 0) {
      cursor = new Date(cursor.getTime() + 60 * 60 * 1000);
      continue;
    }

    // Pick best utilization combination
    let bestScore = -1;
    let bestAircraft: SimAircraft | null = null;
    let bestInstructor: SimInstructor | null = null;

    if (needsInstructor) {
      for (const ac of availableAircraft) {
        for (const ins of availableInstructors) {
          const score = utilizationScore(ac, ins, dayKey, lesson.durationMinutes, state);
          if (score > bestScore) {
            bestScore = score;
            bestAircraft = ac;
            bestInstructor = ins;
          }
        }
      }
    } else {
      for (const ac of availableAircraft) {
        const score = utilizationScore(ac, null, dayKey, lesson.durationMinutes, state);
        if (score > bestScore) {
          bestScore = score;
          bestAircraft = ac;
        }
      }
    }

    if (!bestAircraft) {
      cursor = new Date(cursor.getTime() + 60 * 60 * 1000);
      continue;
    }

    return {
      id: nextBookingId(),
      studentId: student.id,
      instructorId: bestInstructor?.id ?? null,
      aircraftId: bestAircraft.id,
      lessonId: lesson.id,
      lessonName: lesson.name,
      start: cursor.toISOString(),
      end: slotEnd.toISOString(),
      status: "scheduled",
    };
  }

  return null;
}

export const balancedUtilizationStrategy: SimStrategy = {
  id: "balanced-utilization",
  name: "Balanced Utilization",
  description:
    "Selects instructor and aircraft combinations that maximize utilization evenness across the fleet and instructor pool.",
  keyMetric: "Maximizes resource utilization balance",

  onCancellation(cancelledBooking, state, _rng) {
    // Pick student by highest utilization gap
    const students = state.students
      .filter((s) => s.lessonQueue.length > 0)
      .sort((a, b) => a.enrollmentProgress - b.enrollmentProgress);

    for (const student of students) {
      const booking = scheduleNextLesson(student, state, cancelledBooking.start);
      if (booking) return booking;
    }
    return null;
  },

  onNextLesson(student, state, _rng) {
    return scheduleNextLesson(student, state, state.clock);
  },

  onDailyPass(date, state, _rng) {
    const newBookings: SimBooking[] = [];
    const students = state.students
      .filter((s) => s.lessonQueue.length > 0)
      .sort((a, b) => a.enrollmentProgress - b.enrollmentProgress);

    for (const student of students) {
      const hasUpcoming = state.bookings.some(
        (b) =>
          b.studentId === student.id &&
          b.status === "scheduled" &&
          parseISO(b.start) > parseISO(state.clock)
      );
      if (hasUpcoming) continue;

      const booking = scheduleNextLesson(student, state, date);
      if (booking) {
        state.bookings.push(booking);
        newBookings.push(booking);
      }
    }

    return newBookings;
  },
};
