import { parseISO } from "date-fns";
import type { SimStrategy, SimBooking, SimState, SimStudent } from "../types";
import { findAvailableInstructor, findAvailableAircraft, nextBookingId } from "./slot-finder";

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

export const fifoStrategy: SimStrategy = {
  id: "fifo",
  name: "First In, First Out",
  description:
    "Schedules students strictly by their waitlist position. The lowest position number is served first.",
  keyMetric: "Fairness — strict queue order maintained",

  onCancellation(cancelledBooking, state, _rng) {
    const sorted = [...state.students]
      .filter((s) => s.lessonQueue.length > 0)
      .sort((a, b) => a.waitlistPosition - b.waitlistPosition);

    for (const student of sorted) {
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
    const sorted = [...state.students]
      .filter((s) => s.lessonQueue.length > 0)
      .sort((a, b) => a.waitlistPosition - b.waitlistPosition);

    for (const student of sorted) {
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
