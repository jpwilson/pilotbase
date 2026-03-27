import type { SuggestionType } from "@/lib/supabase/types";
import type { RankedCandidate, SlotOption, TriggerEvent } from "./types";

/**
 * Generate human-readable rationale for a scheduling suggestion.
 * All suggestions include an explanation of inputs, constraints, and policies matched.
 */
export function generateRationale(params: {
  type: SuggestionType;
  trigger: TriggerEvent;
  candidate?: RankedCandidate;
  slot?: SlotOption;
  constraintsChecked: string[];
  additionalContext?: string;
}): string {
  const parts: string[] = [];

  // Trigger explanation
  parts.push(describeTrigger(params.trigger));

  // Candidate ranking explanation (for waitlist)
  if (params.candidate) {
    parts.push(describeRanking(params.candidate));
  }

  // Slot selection explanation
  if (params.slot) {
    parts.push(describeSlot(params.slot, params.type));
  }

  // Constraints evaluated
  if (params.constraintsChecked.length > 0) {
    parts.push(`Constraints verified: ${params.constraintsChecked.join(", ")}.`);
  }

  if (params.additionalContext) {
    parts.push(params.additionalContext);
  }

  return parts.join(" ");
}

function describeTrigger(trigger: TriggerEvent): string {
  switch (trigger.type) {
    case "cancellation":
      return `A reservation for ${trigger.originalReservation.CustomerName || "a student"} was cancelled (${trigger.originalReservation.Start}).`;
    case "opening":
      return `An open slot was detected from ${trigger.openSlot.start} to ${trigger.openSlot.end}.`;
    case "completion":
      return `A training lesson was completed for student ${trigger.studentId}.`;
    case "discovery_request":
      return `Discovery flight requested by ${trigger.prospectName}.`;
  }
}

function describeRanking(candidate: RankedCandidate): string {
  const factors: string[] = [];

  if (candidate.daysSinceLastFlight > 0) {
    factors.push(`${candidate.daysSinceLastFlight} days since last flight`);
  }
  if (candidate.daysUntilNextFlight !== null) {
    factors.push(`${candidate.daysUntilNextFlight} days until next scheduled flight`);
  }
  if (candidate.totalFlightHours > 0) {
    factors.push(`${candidate.totalFlightHours} total flight hours`);
  }
  if (candidate.enrollmentProgress > 0) {
    factors.push(`${candidate.enrollmentProgress}% enrollment progress`);
  }

  return `${candidate.studentName} ranked #${candidate.waitlistPosition} (score: ${candidate.score}). Factors: ${factors.join("; ")}.`;
}

function describeSlot(slot: SlotOption, type: SuggestionType): string {
  const parts: string[] = [];
  parts.push(`Proposed slot: ${slot.start} to ${slot.end}`);
  parts.push(`with ${slot.instructorName} in ${slot.aircraftName}`);

  if (type === "reschedule") {
    if (slot.matchesOriginalInstructor) parts.push("(same instructor as original)");
    if (slot.matchesOriginalAircraft) parts.push("(same aircraft as original)");
  }

  if (slot.isWithinDaylight) {
    parts.push("(within daylight hours)");
  }

  return parts.join(" ") + ".";
}
