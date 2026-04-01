export type SimProgram = "PPL" | "IR" | "CPL" | "CFI";
export type SimEventType =
  | "lesson_completed"
  | "lesson_cancelled"
  | "lesson_scheduled"
  | "proficiency_gap_warning"
  | "conflict_detected"
  | "weather_ground_stop"
  | "weather_clear"
  | "instructor_sick"
  | "instructor_recovered"
  | "aircraft_unserviceable"
  | "aircraft_returned"
  | "next_lesson_triggered"
  | "discovery_request";

export type ConflictType =
  | "double_booking"
  | "proficiency_gap"
  | "instructor_overload"
  | "aircraft_overutilized"
  | "no_slot_available";

export type ConflictSeverity = "error" | "warning" | "info";

export interface SimLesson {
  id: string;
  name: string;
  durationMinutes: number;
  requiresInstructor: boolean;
  flightType: "dual" | "solo";
  deadlineOffsetDays: number | null; // days from sim start, null = no deadline
}

export interface SimStudent {
  id: string;
  name: string;
  program: SimProgram;
  totalFlightHours: number;
  enrollmentProgress: number; // 0-100
  lastFlightAt: string; // ISO — relative to scenario startDate
  waitlistPosition: number;
  lessonQueue: SimLesson[];
}

export interface SimInstructor {
  id: string;
  name: string;
  maxHoursPerDay: number;
  isSick: boolean;
}

export interface SimAircraft {
  id: string;
  registration: string;
  makeModel: string;
  availableHoursPerDay: number;
  inMaintenance: boolean;
  cplOnly: boolean;
}

export interface SimBooking {
  id: string;
  studentId: string;
  instructorId: string | null;
  aircraftId: string;
  lessonId: string;
  lessonName: string;
  start: string; // ISO
  end: string; // ISO
  status: "scheduled" | "completed" | "cancelled";
  cancelReason?: string;
}

export interface SimEvent {
  id: string;
  timestamp: string; // ISO — used for ordering
  type: SimEventType;
  severity: ConflictSeverity;
  studentId?: string;
  studentName?: string;
  instructorId?: string;
  aircraftId?: string;
  bookingId?: string;
  headline: string;
  detail?: string;
  conflictId?: string;
}

export interface SimConflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  detectedAt: string; // ISO
  description: string;
  affectedStudentId?: string;
  affectedInstructorId?: string;
  affectedAircraftId?: string;
  autoResolved: boolean;
  resolution?: string;
}

export interface SimState {
  clock: string; // ISO current sim time
  students: SimStudent[];
  instructors: SimInstructor[];
  aircraft: SimAircraft[];
  bookings: SimBooking[];
  events: SimEvent[];
  conflicts: SimConflict[];
  weatherGrounded: boolean;
}

export interface SimStats {
  totalBookings: number;
  completedLessons: number;
  cancelledLessons: number;
  conflictsTotal: number;
  conflictsAutoResolved: number;
  avgWaitHoursBetweenLessons: number;
  aircraftUtilizationPct: number;
  instructorUtilizationPct: number;
  proficiencyGapViolations: number;
}

export interface SimResult {
  strategyId: string;
  strategyName: string;
  durationDays: number;
  events: SimEvent[];
  conflicts: SimConflict[];
  stats: SimStats;
  finalState: SimState;
}

export interface SimScenario {
  id: string;
  name: string;
  description: string;
  startDate: string; // ISO Monday
  seed: number;
  students: SimStudent[];
  instructors: SimInstructor[];
  aircraft: SimAircraft[];
  initialBookings: SimBooking[];
  cancellationRatePerDay: number;
  weatherGroundStopRatePerDay: number;
  instructorSickRatePerDay: number;
}

export interface SimStrategy {
  id: string;
  name: string;
  description: string;
  keyMetric: string;
  onCancellation(cancelledBooking: SimBooking, state: SimState, rng: () => number): SimBooking | null;
  onNextLesson(student: SimStudent, state: SimState, rng: () => number): SimBooking | null;
  onDailyPass(date: string, state: SimState, rng: () => number): SimBooking[];
}
