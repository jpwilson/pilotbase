import type { SuggestionType, AlternativeSlot, PriorityWeights } from "@/lib/supabase/types";
import type { FSPSchedulableEvent, FSPScheduleEvent } from "@/lib/fsp/types";

// --- Candidate for waitlist ranking ---
export interface StudentCandidate {
  studentId: string;
  studentName: string;
  daysSinceLastFlight: number;
  daysUntilNextFlight: number | null; // null = no upcoming flight
  totalFlightHours: number;
  enrollmentProgress: number; // 0-100 percentage
  waitlistPosition: number; // order in queue
  schedulableEvent: FSPSchedulableEvent;
}

export interface RankedCandidate extends StudentCandidate {
  score: number;
  scoreBreakdown: Record<string, number>;
}

// --- Slot option for rescheduling / discovery ---
export interface SlotOption {
  instructorId: string;
  instructorName: string;
  aircraftId: string;
  aircraftName: string;
  start: string; // ISO datetime
  end: string;
  isWithinDaylight: boolean;
  matchesOriginalInstructor: boolean;
  matchesOriginalAircraft: boolean;
}

// --- Trigger events ---
export interface CancellationTrigger {
  type: "cancellation";
  originalReservation: FSPScheduleEvent;
  detectedAt: string;
}

export interface OpeningTrigger {
  type: "opening";
  openSlot: { start: string; end: string; resourceId: string };
  detectedAt: string;
}

export interface CompletionTrigger {
  type: "completion";
  studentId: string;
  enrollmentId: string;
  completedLessonId: string;
  detectedAt: string;
}

export interface DiscoveryTrigger {
  type: "discovery_request";
  requestId: string;
  prospectName: string;
  detectedAt: string;
}

export type TriggerEvent =
  | CancellationTrigger
  | OpeningTrigger
  | CompletionTrigger
  | DiscoveryTrigger;

// --- Suggestion creation input ---
export interface CreateSuggestionInput {
  operatorId: string;
  type: SuggestionType;
  priority: number;
  studentId?: string;
  studentName?: string;
  instructorId?: string;
  instructorName?: string;
  aircraftId?: string;
  aircraftName?: string;
  locationId?: string;
  activityTypeId?: string;
  proposedStart?: string;
  proposedEnd?: string;
  alternatives?: AlternativeSlot[];
  rationale: string;
  context?: Record<string, unknown>;
  triggerEvent: TriggerEvent;
}

// --- Engine configuration ---
export interface EngineConfig {
  operatorId: string;
  locationId: number;
  searchWindowDays: number;
  maxAlternatives: number;
  priorityWeights: PriorityWeights;
}

// --- Schedule snapshot for change detection ---
export interface ScheduleSnapshot {
  operatorId: string;
  locationId: number;
  capturedAt: string;
  events: FSPScheduleEvent[];
}

export interface ScheduleChange {
  type: "cancellation" | "new_booking" | "modification";
  event: FSPScheduleEvent;
  previousEvent?: FSPScheduleEvent;
}
