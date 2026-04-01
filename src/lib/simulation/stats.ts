import { differenceInHours, parseISO } from "date-fns";
import type { SimState, SimStats } from "./types";

export function computeStats(state: SimState, durationDays: number): SimStats {
  const completedLessons = state.bookings.filter((b) => b.status === "completed").length;
  const cancelledLessons = state.bookings.filter((b) => b.status === "cancelled").length;
  const totalBookings = state.bookings.length;
  const conflictsTotal = state.conflicts.length;
  const conflictsAutoResolved = state.conflicts.filter((c) => c.autoResolved).length;
  const proficiencyGapViolations = state.conflicts.filter(
    (c) => c.type === "proficiency_gap"
  ).length;

  // Average wait hours between consecutive completed lessons per student
  let totalWaitHours = 0;
  let waitSampleCount = 0;

  for (const student of state.students) {
    const studentCompleted = state.bookings
      .filter((b) => b.studentId === student.id && b.status === "completed")
      .sort((a, b) => parseISO(a.end).getTime() - parseISO(b.end).getTime());

    for (let i = 1; i < studentCompleted.length; i++) {
      const wait = differenceInHours(
        parseISO(studentCompleted[i].start),
        parseISO(studentCompleted[i - 1].end)
      );
      totalWaitHours += wait;
      waitSampleCount++;
    }
  }

  const avgWaitHoursBetweenLessons =
    waitSampleCount > 0 ? Math.round((totalWaitHours / waitSampleCount) * 10) / 10 : 0;

  // Aircraft utilization: sum of all scheduled/completed booking hours / (total capacity * days)
  let totalAircraftScheduledHours = 0;
  let totalAircraftCapacityHours = 0;

  for (const aircraft of state.aircraft) {
    totalAircraftCapacityHours += aircraft.availableHoursPerDay * durationDays;
    for (const booking of state.bookings) {
      if (
        booking.aircraftId === aircraft.id &&
        (booking.status === "scheduled" || booking.status === "completed")
      ) {
        totalAircraftScheduledHours += differenceInHours(
          parseISO(booking.end),
          parseISO(booking.start)
        );
      }
    }
  }

  const aircraftUtilizationPct =
    totalAircraftCapacityHours > 0
      ? Math.round((totalAircraftScheduledHours / totalAircraftCapacityHours) * 10000) / 100
      : 0;

  // Instructor utilization: sum of all scheduled/completed booking hours / (total capacity * days)
  let totalInstructorScheduledHours = 0;
  let totalInstructorCapacityHours = 0;

  for (const instructor of state.instructors) {
    totalInstructorCapacityHours += instructor.maxHoursPerDay * durationDays;
    for (const booking of state.bookings) {
      if (
        booking.instructorId === instructor.id &&
        (booking.status === "scheduled" || booking.status === "completed")
      ) {
        totalInstructorScheduledHours += differenceInHours(
          parseISO(booking.end),
          parseISO(booking.start)
        );
      }
    }
  }

  const instructorUtilizationPct =
    totalInstructorCapacityHours > 0
      ? Math.round((totalInstructorScheduledHours / totalInstructorCapacityHours) * 10000) / 100
      : 0;

  return {
    totalBookings,
    completedLessons,
    cancelledLessons,
    conflictsTotal,
    conflictsAutoResolved,
    avgWaitHoursBetweenLessons,
    aircraftUtilizationPct,
    instructorUtilizationPct,
    proficiencyGapViolations,
  };
}
