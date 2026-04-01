import { parseISO, differenceInDays, addMinutes } from "date-fns";
import { rankCandidates } from "@/lib/engine/ranker";
import type { StudentCandidate } from "@/lib/engine/types";
import type { SimStrategy, SimBooking, SimState, SimStudent } from "../types";
import {
  findSlot,
  findAvailableInstructor,
  findAvailableAircraft,
  nextBookingId,
} from "./slot-finder";

const defaultWeights = {
  timeSinceLastFlight: 0.3,
  timeUntilNextFlight: 0.2,
  totalFlightHours: 0.1,
  enrollmentProgress: 0.2,
  waitlistPosition: 0.2,
};

function scheduleNextLesson(
  student: SimStudent,
  state: SimState,
  afterTime: string
): SimBooking | null {
  if (student.lessonQueue.length === 0) return null;
  const lesson = student.lessonQueue[0];
  const needsInstructor = lesson.requiresInstructor;
  const isCPL = student.program === "CPL" || student.program === "CFI";

  // Try to find a slot with an instructor (if needed) and an available aircraft
  // We'll iterate over possible start times and check both instructor + aircraft availability
  const afterDate = parseISO(afterTime);
  const maxSearch = new Date(afterDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  let cursor = new Date(afterDate);

  // Snap to 08:00 UTC
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

    const instructor = needsInstructor
      ? findAvailableInstructor(cursor, slotEnd, state)
      : null;

    if (needsInstructor && !instructor) {
      cursor = new Date(cursor.getTime() + 60 * 60 * 1000);
      continue;
    }

    const aircraft = findAvailableAircraft(cursor, slotEnd, state, isCPL);
    if (!aircraft) {
      cursor = new Date(cursor.getTime() + 60 * 60 * 1000);
      continue;
    }

    // Check student is free
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

    return {
      id: nextBookingId(),
      studentId: student.id,
      instructorId: instructor?.id ?? null,
      aircraftId: aircraft.id,
      lessonId: lesson.id,
      lessonName: lesson.name,
      start: cursor.toISOString(),
      end: slotEnd.toISOString(),
      status: "scheduled",
    };
  }

  return null;
}

function buildCandidates(state: SimState, clock: string): StudentCandidate[] {
  const clockDate = parseISO(clock);

  return state.students
    .filter((s) => s.lessonQueue.length > 0)
    .map((s) => {
      const daysSinceLastFlight = differenceInDays(clockDate, parseISO(s.lastFlightAt));
      const nextBooking = state.bookings
        .filter((b) => b.studentId === s.id && b.status === "scheduled")
        .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime())[0];
      const daysUntilNextFlight = nextBooking
        ? differenceInDays(parseISO(nextBooking.start), clockDate)
        : null;

      return {
        studentId: s.id,
        studentName: s.name,
        daysSinceLastFlight,
        daysUntilNextFlight,
        totalFlightHours: s.totalFlightHours,
        enrollmentProgress: s.enrollmentProgress,
        waitlistPosition: s.waitlistPosition,
        // schedulableEvent is required by type but not used in ranking logic
        schedulableEvent: {} as never,
      };
    });
}

export const weightedPriorityStrategy: SimStrategy = {
  id: "weighted-priority",
  name: "Weighted Priority",
  description:
    "Ranks students using a configurable multi-factor score: days since last flight, enrollment progress, waitlist position, and total hours.",
  keyMetric: "Prioritizes students most at-risk of proficiency gap",

  onCancellation(cancelledBooking, state, _rng) {
    const candidates = buildCandidates(state, state.clock);
    const ranked = rankCandidates(candidates, defaultWeights);
    if (ranked.length === 0) return null;

    const topStudent = state.students.find((s) => s.id === ranked[0].studentId);
    if (!topStudent) return null;

    return scheduleNextLesson(topStudent, state, cancelledBooking.start);
  },

  onNextLesson(student, state, _rng) {
    return scheduleNextLesson(student, state, state.clock);
  },

  onDailyPass(date, state, _rng) {
    const newBookings: SimBooking[] = [];
    const candidates = buildCandidates(state, state.clock);
    const ranked = rankCandidates(candidates, defaultWeights);

    for (const candidate of ranked) {
      const student = state.students.find((s) => s.id === candidate.studentId);
      if (!student) continue;

      // Check if student has no upcoming booking
      const hasUpcoming = state.bookings.some(
        (b) =>
          b.studentId === student.id &&
          b.status === "scheduled" &&
          parseISO(b.start) > parseISO(state.clock)
      );
      if (hasUpcoming) continue;

      const booking = scheduleNextLesson(student, state, date);
      if (booking) {
        // Add to state bookings so slot is taken for subsequent iterations
        state.bookings.push(booking);
        newBookings.push(booking);
      }
    }

    return newBookings;
  },
};
