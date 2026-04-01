import { addDays, addHours, parseISO, isBefore, formatISO, differenceInDays } from "date-fns";
import type {
  SimScenario,
  SimStrategy,
  SimResult,
  SimState,
  SimEvent,
  SimBooking,
  SimStudent,
  SimInstructor,
  SimConflict,
} from "./types";
import { makeRng } from "./prng";
import { detectConflicts } from "./conflicts";
import { computeStats } from "./stats";

let _id = 0;
function nextId(): string {
  return `sim-${++_id}`;
}

interface InternalEvent {
  id: string;
  timestamp: number; // ms epoch for ordering
  timestampISO: string;
  type: string;
  payload: Record<string, unknown>;
}

function makeInternalEvent(
  timestampISO: string,
  type: string,
  payload: Record<string, unknown>
): InternalEvent {
  return {
    id: nextId(),
    timestamp: parseISO(timestampISO).getTime(),
    timestampISO,
    type,
    payload,
  };
}

function cloneState(scenario: SimScenario): SimState {
  return {
    clock: scenario.startDate,
    students: scenario.students.map((s) => ({
      ...s,
      lessonQueue: s.lessonQueue.map((l) => ({ ...l })),
    })),
    instructors: scenario.instructors.map((i) => ({ ...i })),
    aircraft: scenario.aircraft.map((a) => ({ ...a })),
    bookings: scenario.initialBookings.map((b) => ({ ...b })),
    events: [],
    conflicts: [],
    weatherGrounded: false,
  };
}

function formatDay(isoDate: string, startDate: string): string {
  const days = differenceInDays(parseISO(isoDate), parseISO(startDate));
  const d = parseISO(isoDate);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `Day ${days}, ${hh}:${mm}`;
}

function pushSimEvent(
  state: SimState,
  type: SimEvent["type"],
  severity: SimEvent["severity"],
  headline: string,
  extra: Partial<SimEvent> = {}
): SimEvent {
  const ev: SimEvent = {
    id: nextId(),
    timestamp: state.clock,
    type,
    severity,
    headline,
    ...extra,
  };
  state.events.push(ev);
  return ev;
}

export function runSimulation(
  scenario: SimScenario,
  strategy: SimStrategy,
  durationDays: 7 | 14 | 30
): SimResult {
  // Reset ID counter per run for determinism
  _id = 0;

  const rng = makeRng(scenario.seed);
  const state = cloneState(scenario);
  const startDate = scenario.startDate;
  const endDate = addDays(parseISO(startDate), durationDays).toISOString();

  // --- Build initial event queue ---
  const queue: InternalEvent[] = [];

  // Events for initial bookings
  for (const booking of state.bookings) {
    // lesson_scheduled at booking start
    queue.push(
      makeInternalEvent(booking.start, "lesson_scheduled", { bookingId: booking.id })
    );
    // lesson completion check at booking end
    queue.push(
      makeInternalEvent(booking.end, "lesson_end_check", { bookingId: booking.id })
    );
  }

  // Daily disruption check events at 06:00 each day
  for (let d = 0; d < durationDays; d++) {
    const checkTime = addDays(parseISO(startDate), d);
    checkTime.setUTCHours(6, 0, 0, 0);
    queue.push(
      makeInternalEvent(checkTime.toISOString(), "daily_disruption_check", { dayOffset: d })
    );

    // Daily scheduling pass at 07:00
    const passTime = new Date(checkTime);
    passTime.setUTCHours(7, 0, 0, 0);
    queue.push(
      makeInternalEvent(passTime.toISOString(), "daily_scheduling_pass", { dayOffset: d })
    );
  }

  // Sort queue by timestamp
  queue.sort((a, b) => a.timestamp - b.timestamp);

  // Track processed booking IDs to avoid double-processing
  const processedBookingEnds = new Set<string>();

  // --- Event loop ---
  while (queue.length > 0) {
    const ev = queue.shift()!;
    if (ev.timestamp > parseISO(endDate).getTime()) break;

    state.clock = ev.timestampISO;

    switch (ev.type) {
      case "lesson_scheduled": {
        const bookingId = ev.payload.bookingId as string;
        const booking = state.bookings.find((b) => b.id === bookingId);
        if (!booking || booking.status !== "scheduled") break;

        const student = state.students.find((s) => s.id === booking.studentId);
        pushSimEvent(state, "lesson_scheduled", "info", `Lesson scheduled: ${booking.lessonName}`, {
          studentId: booking.studentId,
          studentName: student?.name,
          instructorId: booking.instructorId ?? undefined,
          aircraftId: booking.aircraftId,
          bookingId,
          detail: `${formatDay(booking.start, startDate)} — ${formatDay(booking.end, startDate)}`,
        });
        break;
      }

      case "lesson_end_check": {
        const bookingId = ev.payload.bookingId as string;
        if (processedBookingEnds.has(bookingId)) break;
        processedBookingEnds.add(bookingId);

        const booking = state.bookings.find((b) => b.id === bookingId);
        if (!booking || booking.status !== "scheduled") break;

        // 85% completion rate (rng() > 0.15 = complete)
        if (rng() > 0.15) {
          booking.status = "completed";
          const student = state.students.find((s) => s.id === booking.studentId);
          if (student) {
            student.lastFlightAt = booking.end;
            student.totalFlightHours +=
              (parseISO(booking.end).getTime() - parseISO(booking.start).getTime()) /
              (1000 * 60 * 60);
            student.enrollmentProgress = Math.min(
              100,
              student.enrollmentProgress + Math.floor(rng() * 5) + 3
            );
            // Remove completed lesson from queue
            if (
              student.lessonQueue.length > 0 &&
              student.lessonQueue[0].id === booking.lessonId
            ) {
              student.lessonQueue.shift();
            }
          }

          pushSimEvent(
            state,
            "lesson_completed",
            "info",
            `Lesson completed: ${booking.lessonName}`,
            {
              studentId: booking.studentId,
              studentName: student?.name,
              instructorId: booking.instructorId ?? undefined,
              aircraftId: booking.aircraftId,
              bookingId,
            }
          );

          // Trigger next lesson via strategy
          if (student && student.lessonQueue.length > 0) {
            const nextBooking = strategy.onNextLesson(student, state, rng);
            if (nextBooking) {
              state.bookings.push(nextBooking);
              queue.push(
                makeInternalEvent(nextBooking.start, "lesson_scheduled", {
                  bookingId: nextBooking.id,
                })
              );
              queue.push(
                makeInternalEvent(nextBooking.end, "lesson_end_check", {
                  bookingId: nextBooking.id,
                })
              );
              queue.sort((a, b) => a.timestamp - b.timestamp);

              pushSimEvent(
                state,
                "next_lesson_triggered",
                "info",
                `Next lesson triggered: ${nextBooking.lessonName} for ${student.name}`,
                {
                  studentId: student.id,
                  studentName: student.name,
                  bookingId: nextBooking.id,
                }
              );
            }
          }
        } else {
          // Random in-flight cancellation (engine issue, etc.)
          booking.status = "cancelled";
          booking.cancelReason = "In-flight issue — lesson incomplete";
          const student = state.students.find((s) => s.id === booking.studentId);

          pushSimEvent(
            state,
            "lesson_cancelled",
            "warning",
            `Lesson incomplete: ${booking.lessonName}`,
            {
              studentId: booking.studentId,
              studentName: student?.name,
              bookingId,
              detail: "Random equipment or weather issue during flight",
            }
          );

          // Strategy response
          const replacement = strategy.onCancellation(booking, state, rng);
          if (replacement) {
            state.bookings.push(replacement);
            queue.push(
              makeInternalEvent(replacement.start, "lesson_scheduled", {
                bookingId: replacement.id,
              })
            );
            queue.push(
              makeInternalEvent(replacement.end, "lesson_end_check", {
                bookingId: replacement.id,
              })
            );
            queue.sort((a, b) => a.timestamp - b.timestamp);
          }
        }
        break;
      }

      case "daily_disruption_check": {
        const dayOffset = ev.payload.dayOffset as number;
        const todayBase = addDays(parseISO(startDate), dayOffset);
        todayBase.setUTCHours(0, 0, 0, 0);
        const tomorrowBase = new Date(todayBase.getTime() + 24 * 60 * 60 * 1000);

        const todayScheduled = state.bookings.filter((b) => {
          if (b.status !== "scheduled") return false;
          const bStart = parseISO(b.start).getTime();
          return bStart >= todayBase.getTime() && bStart < tomorrowBase.getTime();
        });

        // 1. Random cancellation
        if (rng() < scenario.cancellationRatePerDay && todayScheduled.length > 0) {
          const idx = Math.floor(rng() * todayScheduled.length);
          const target = todayScheduled[idx];
          target.status = "cancelled";
          target.cancelReason = "Random disruption";
          const student = state.students.find((s) => s.id === target.studentId);

          pushSimEvent(
            state,
            "lesson_cancelled",
            "warning",
            `Disruption: ${target.lessonName} cancelled`,
            {
              studentId: target.studentId,
              studentName: student?.name,
              bookingId: target.id,
              detail: "Random operational disruption",
            }
          );

          const replacement = strategy.onCancellation(target, state, rng);
          if (replacement) {
            state.bookings.push(replacement);
            queue.push(
              makeInternalEvent(replacement.start, "lesson_scheduled", {
                bookingId: replacement.id,
              })
            );
            queue.push(
              makeInternalEvent(replacement.end, "lesson_end_check", {
                bookingId: replacement.id,
              })
            );
            queue.sort((a, b) => a.timestamp - b.timestamp);
          }
        }

        // 2. Weather ground stop
        if (rng() < scenario.weatherGroundStopRatePerDay) {
          state.weatherGrounded = true;
          const groundStopTime = addDays(parseISO(startDate), dayOffset);
          groundStopTime.setUTCHours(8, 0, 0, 0);
          const clearTime = addHours(groundStopTime, 4);

          pushSimEvent(state, "weather_ground_stop", "error", "Weather ground stop in effect", {
            detail: `Ground stop from ${formatDay(groundStopTime.toISOString(), startDate)} for ~4h`,
          });

          // Cancel all bookings in the 4-hour window
          for (const b of state.bookings) {
            if (b.status !== "scheduled") continue;
            const bStart = parseISO(b.start).getTime();
            if (
              bStart >= groundStopTime.getTime() &&
              bStart < clearTime.getTime()
            ) {
              b.status = "cancelled";
              b.cancelReason = "Weather ground stop";
            }
          }

          // Schedule clear event
          queue.push(
            makeInternalEvent(clearTime.toISOString(), "weather_clear_check", {})
          );
          queue.sort((a, b) => a.timestamp - b.timestamp);
        }

        // 3. Instructor sick
        if (rng() < scenario.instructorSickRatePerDay) {
          const available = state.instructors.filter((i) => !i.isSick);
          if (available.length > 0) {
            const idx = Math.floor(rng() * available.length);
            const instructor = available[idx];
            instructor.isSick = true;

            pushSimEvent(
              state,
              "instructor_sick",
              "warning",
              `Instructor sick: ${instructor.name}`,
              {
                instructorId: instructor.id,
                detail: `${instructor.name} is unavailable for the day`,
              }
            );

            // Cancel their bookings today
            for (const b of todayScheduled) {
              if (b.instructorId === instructor.id) {
                b.status = "cancelled";
                b.cancelReason = `Instructor sick: ${instructor.name}`;
                const student = state.students.find((s) => s.id === b.studentId);

                pushSimEvent(
                  state,
                  "lesson_cancelled",
                  "warning",
                  `Lesson cancelled: ${b.lessonName} (instructor sick)`,
                  {
                    studentId: b.studentId,
                    studentName: student?.name,
                    instructorId: instructor.id,
                    bookingId: b.id,
                  }
                );

                const replacement = strategy.onCancellation(b, state, rng);
                if (replacement) {
                  state.bookings.push(replacement);
                  queue.push(
                    makeInternalEvent(replacement.start, "lesson_scheduled", {
                      bookingId: replacement.id,
                    })
                  );
                  queue.push(
                    makeInternalEvent(replacement.end, "lesson_end_check", {
                      bookingId: replacement.id,
                    })
                  );
                }
              }
            }

            // Recover the instructor next day
            const recoverTime = addDays(todayBase, 1);
            recoverTime.setUTCHours(6, 0, 0, 0);
            queue.push(
              makeInternalEvent(recoverTime.toISOString(), "instructor_recover", {
                instructorId: instructor.id,
              })
            );
            queue.sort((a, b) => a.timestamp - b.timestamp);
          }
        }

        // Check for proficiency gap warnings
        for (const student of state.students) {
          const daysSince = differenceInDays(
            parseISO(state.clock),
            parseISO(student.lastFlightAt)
          );
          if (daysSince > 7) {
            const hasUpcoming = state.bookings.some(
              (b) =>
                b.studentId === student.id &&
                b.status === "scheduled" &&
                parseISO(b.start) > parseISO(state.clock)
            );
            if (!hasUpcoming) {
              pushSimEvent(
                state,
                "proficiency_gap_warning",
                "warning",
                `Proficiency gap: ${student.name} has not flown in ${daysSince} days`,
                {
                  studentId: student.id,
                  studentName: student.name,
                  detail: `${daysSince} days since last flight, no upcoming booking`,
                }
              );
            }
          }
        }

        break;
      }

      case "daily_scheduling_pass": {
        const newBookings = strategy.onDailyPass(ev.timestampISO, state, rng);
        for (const booking of newBookings) {
          // Add completion check events
          queue.push(
            makeInternalEvent(booking.start, "lesson_scheduled", {
              bookingId: booking.id,
            })
          );
          queue.push(
            makeInternalEvent(booking.end, "lesson_end_check", {
              bookingId: booking.id,
            })
          );
        }
        if (newBookings.length > 0) {
          queue.sort((a, b) => a.timestamp - b.timestamp);
        }
        break;
      }

      case "weather_clear_check": {
        state.weatherGrounded = false;
        pushSimEvent(state, "weather_clear", "info", "Weather cleared — operations resumed");
        break;
      }

      case "instructor_recover": {
        const instructorId = ev.payload.instructorId as string;
        const instructor = state.instructors.find((i) => i.id === instructorId);
        if (instructor) {
          instructor.isSick = false;
          pushSimEvent(
            state,
            "instructor_recovered",
            "info",
            `Instructor recovered: ${instructor.name}`,
            { instructorId }
          );
        }
        break;
      }
    }

    // Detect and record new conflicts after each event
    const newConflicts = detectConflicts(state, state.clock);
    for (const conflict of newConflicts) {
      state.conflicts.push(conflict);

      // Emit conflict_detected event
      pushSimEvent(
        state,
        "conflict_detected",
        conflict.severity,
        `Conflict detected: ${conflict.type.replace(/_/g, " ")}`,
        {
          conflictId: conflict.id,
          detail: conflict.description,
        }
      );
    }
  }

  return {
    strategyId: strategy.id,
    strategyName: strategy.name,
    durationDays,
    events: state.events,
    conflicts: state.conflicts,
    stats: computeStats(state, durationDays),
    finalState: state,
  };
}
