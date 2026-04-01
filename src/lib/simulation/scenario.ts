import { addDays, parseISO, startOfWeek } from "date-fns";
import type { SimScenario, SimStudent, SimInstructor, SimAircraft, SimBooking } from "./types";

function getMondayISO(): string {
  // Use a fixed reference for the current week's Monday (week of 2026-03-30)
  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  monday.setHours(8, 0, 0, 0);
  return monday.toISOString();
}

function dayAt(startDate: string, dayOffset: number, hour: number, minute = 0): string {
  const base = parseISO(startDate);
  const d = addDays(base, dayOffset);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

const START_DATE = getMondayISO();

const students: SimStudent[] = [
  {
    id: "sim-stu-1",
    name: "Marcus Chen",
    program: "PPL",
    totalFlightHours: 32.5,
    enrollmentProgress: 65,
    lastFlightAt: addDays(parseISO(START_DATE), -2).toISOString(),
    waitlistPosition: 1,
    lessonQueue: [
      {
        id: "lesson-1a",
        name: "Cross-Country Dual",
        durationMinutes: 120,
        requiresInstructor: true,
        flightType: "dual",
        deadlineOffsetDays: 5,
      },
      {
        id: "lesson-1b",
        name: "Solo Nav",
        durationMinutes: 90,
        requiresInstructor: false,
        flightType: "solo",
        deadlineOffsetDays: null,
      },
    ],
  },
  {
    id: "sim-stu-2",
    name: "Elena Rodriguez",
    program: "IR",
    totalFlightHours: 48.0,
    enrollmentProgress: 88,
    lastFlightAt: addDays(parseISO(START_DATE), -1).toISOString(),
    waitlistPosition: 2,
    lessonQueue: [
      {
        id: "lesson-2a",
        name: "ILS Approach",
        durationMinutes: 120,
        requiresInstructor: true,
        flightType: "dual",
        deadlineOffsetDays: 3,
      },
      {
        id: "lesson-2b",
        name: "Missed Approach",
        durationMinutes: 90,
        requiresInstructor: true,
        flightType: "dual",
        deadlineOffsetDays: null,
      },
    ],
  },
  {
    id: "sim-stu-3",
    name: "David Vance",
    program: "CPL",
    totalFlightHours: 5.5,
    enrollmentProgress: 15,
    lastFlightAt: addDays(parseISO(START_DATE), -14).toISOString(),
    waitlistPosition: 3,
    lessonQueue: [
      {
        id: "lesson-3a",
        name: "Intro Dual",
        durationMinutes: 120,
        requiresInstructor: true,
        flightType: "dual",
        deadlineOffsetDays: 2,
      },
    ],
  },
  {
    id: "sim-stu-4",
    name: "Sophie Laurent",
    program: "PPL",
    totalFlightHours: 18.2,
    enrollmentProgress: 42,
    lastFlightAt: addDays(parseISO(START_DATE), -3).toISOString(),
    waitlistPosition: 4,
    lessonQueue: [
      {
        id: "lesson-4a",
        name: "Solo Pattern",
        durationMinutes: 90,
        requiresInstructor: false,
        flightType: "solo",
        deadlineOffsetDays: null,
      },
    ],
  },
  {
    id: "sim-stu-5",
    name: "Julian Banks",
    program: "CFI",
    totalFlightHours: 240.5,
    enrollmentProgress: 92,
    lastFlightAt: addDays(parseISO(START_DATE), 0).toISOString(),
    waitlistPosition: 5,
    lessonQueue: [
      {
        id: "lesson-5a",
        name: "CFI Demo Flight",
        durationMinutes: 180,
        requiresInstructor: true,
        flightType: "dual",
        deadlineOffsetDays: 7,
      },
    ],
  },
  {
    id: "sim-stu-6",
    name: "Alicia Moreno",
    program: "IR",
    totalFlightHours: 62.0,
    enrollmentProgress: 55,
    lastFlightAt: addDays(parseISO(START_DATE), -5).toISOString(),
    waitlistPosition: 6,
    lessonQueue: [
      {
        id: "lesson-6a",
        name: "VOR Tracking",
        durationMinutes: 120,
        requiresInstructor: true,
        flightType: "dual",
        deadlineOffsetDays: null,
      },
      {
        id: "lesson-6b",
        name: "Holding Patterns",
        durationMinutes: 90,
        requiresInstructor: true,
        flightType: "dual",
        deadlineOffsetDays: null,
      },
    ],
  },
  {
    id: "sim-stu-7",
    name: "David Kim",
    program: "CPL",
    totalFlightHours: 95.0,
    enrollmentProgress: 70,
    lastFlightAt: addDays(parseISO(START_DATE), -1).toISOString(),
    waitlistPosition: 7,
    lessonQueue: [
      {
        id: "lesson-7a",
        name: "XC Dual",
        durationMinutes: 180,
        requiresInstructor: true,
        flightType: "dual",
        deadlineOffsetDays: null,
      },
    ],
  },
  {
    id: "sim-stu-8",
    name: "Jamie Torres",
    program: "PPL",
    totalFlightHours: 10.0,
    enrollmentProgress: 20,
    lastFlightAt: addDays(parseISO(START_DATE), -8).toISOString(),
    waitlistPosition: 8,
    lessonQueue: [
      {
        id: "lesson-8a",
        name: "First Solo Prep",
        durationMinutes: 90,
        requiresInstructor: true,
        flightType: "dual",
        deadlineOffsetDays: 4,
      },
    ],
  },
  {
    id: "sim-stu-9",
    name: "Priya Nair",
    program: "PPL",
    totalFlightHours: 22.0,
    enrollmentProgress: 48,
    lastFlightAt: addDays(parseISO(START_DATE), -2).toISOString(),
    waitlistPosition: 9,
    lessonQueue: [
      {
        id: "lesson-9a",
        name: "Night Flight",
        durationMinutes: 120,
        requiresInstructor: true,
        flightType: "dual",
        deadlineOffsetDays: null,
      },
      {
        id: "lesson-9b",
        name: "Short Field Landing",
        durationMinutes: 90,
        requiresInstructor: true,
        flightType: "dual",
        deadlineOffsetDays: null,
      },
    ],
  },
  {
    id: "sim-stu-10",
    name: "Liam Okafor",
    program: "IR",
    totalFlightHours: 38.5,
    enrollmentProgress: 72,
    lastFlightAt: addDays(parseISO(START_DATE), -3).toISOString(),
    waitlistPosition: 10,
    lessonQueue: [
      {
        id: "lesson-10a",
        name: "Partial Panel",
        durationMinutes: 120,
        requiresInstructor: true,
        flightType: "dual",
        deadlineOffsetDays: 6,
      },
      {
        id: "lesson-10b",
        name: "GPS Approach",
        durationMinutes: 90,
        requiresInstructor: true,
        flightType: "dual",
        deadlineOffsetDays: null,
      },
    ],
  },
];

const instructors: SimInstructor[] = [
  { id: "sim-ins-1", name: "Sarah Jenkins", maxHoursPerDay: 8, isSick: false },
  { id: "sim-ins-2", name: "Capt. Miller", maxHoursPerDay: 7, isSick: false },
  { id: "sim-ins-3", name: "Lt. Torres", maxHoursPerDay: 6, isSick: false },
];

const aircraft: SimAircraft[] = [
  {
    id: "sim-ac-1",
    registration: "N422PB",
    makeModel: "Cessna 172S",
    availableHoursPerDay: 8,
    inMaintenance: false,
    cplOnly: false,
  },
  {
    id: "sim-ac-2",
    registration: "N811TS",
    makeModel: "Piper Archer",
    availableHoursPerDay: 7,
    inMaintenance: false,
    cplOnly: false,
  },
  {
    id: "sim-ac-3",
    registration: "N558PB",
    makeModel: "Cessna 172SP",
    availableHoursPerDay: 8,
    inMaintenance: false,
    cplOnly: false,
  },
  {
    id: "sim-ac-4",
    registration: "N204TF",
    makeModel: "Piper Seminole",
    availableHoursPerDay: 6,
    inMaintenance: false,
    cplOnly: true,
  },
];

// Day 0 = Monday of current week
const initialBookings: SimBooking[] = [
  // Day 0 bookings
  {
    id: "sim-bk-1",
    studentId: "sim-stu-1",
    instructorId: "sim-ins-1",
    aircraftId: "sim-ac-1",
    lessonId: "lesson-1a",
    lessonName: "Cross-Country Dual",
    start: dayAt(START_DATE, 0, 9, 0),
    end: dayAt(START_DATE, 0, 11, 0),
    status: "scheduled",
  },
  {
    id: "sim-bk-2",
    studentId: "sim-stu-2",
    instructorId: "sim-ins-2",
    aircraftId: "sim-ac-2",
    lessonId: "lesson-2a",
    lessonName: "ILS Approach",
    start: dayAt(START_DATE, 0, 9, 0),
    end: dayAt(START_DATE, 0, 11, 0),
    status: "scheduled",
  },
  {
    id: "sim-bk-3",
    studentId: "sim-stu-4",
    instructorId: "sim-ins-1",
    aircraftId: "sim-ac-3",
    lessonId: "lesson-4a",
    lessonName: "Solo Pattern",
    start: dayAt(START_DATE, 0, 11, 30),
    end: dayAt(START_DATE, 0, 13, 0),
    status: "scheduled",
  },
  {
    id: "sim-bk-4",
    studentId: "sim-stu-6",
    instructorId: "sim-ins-3",
    aircraftId: "sim-ac-2",
    lessonId: "lesson-6a",
    lessonName: "VOR Tracking",
    start: dayAt(START_DATE, 0, 11, 30),
    end: dayAt(START_DATE, 0, 13, 30),
    status: "scheduled",
  },
  // Day 1 bookings
  {
    id: "sim-bk-5",
    studentId: "sim-stu-7",
    instructorId: "sim-ins-2",
    aircraftId: "sim-ac-4",
    lessonId: "lesson-7a",
    lessonName: "XC Dual",
    start: dayAt(START_DATE, 1, 9, 0),
    end: dayAt(START_DATE, 1, 12, 0),
    status: "scheduled",
  },
  {
    id: "sim-bk-6",
    studentId: "sim-stu-9",
    instructorId: "sim-ins-1",
    aircraftId: "sim-ac-1",
    lessonId: "lesson-9a",
    lessonName: "Night Flight",
    start: dayAt(START_DATE, 1, 9, 0),
    end: dayAt(START_DATE, 1, 11, 0),
    status: "scheduled",
  },
  {
    id: "sim-bk-7",
    studentId: "sim-stu-10",
    instructorId: "sim-ins-3",
    aircraftId: "sim-ac-2",
    lessonId: "lesson-10a",
    lessonName: "Partial Panel",
    start: dayAt(START_DATE, 1, 9, 0),
    end: dayAt(START_DATE, 1, 11, 0),
    status: "scheduled",
  },
  {
    id: "sim-bk-8",
    studentId: "sim-stu-5",
    instructorId: "sim-ins-2",
    aircraftId: "sim-ac-3",
    lessonId: "lesson-5a",
    lessonName: "CFI Demo Flight",
    start: dayAt(START_DATE, 1, 13, 0),
    end: dayAt(START_DATE, 1, 16, 0),
    status: "scheduled",
  },
];

export const ACADEMY_SCENARIO: SimScenario = {
  id: "academy-spring-cohort",
  name: "Central Valley Flight Academy — Spring Cohort",
  description:
    "10 students across PPL/IR/CPL/CFI programs with 3 instructors and 4 aircraft over a dynamic scheduling period. Includes pre-seeded proficiency gap violations for David Vance (14 days) and Jamie Torres (8 days).",
  startDate: START_DATE,
  seed: 42,
  students,
  instructors,
  aircraft,
  initialBookings,
  cancellationRatePerDay: 0.08,
  weatherGroundStopRatePerDay: 0.05,
  instructorSickRatePerDay: 0.04,
};
