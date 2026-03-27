import type { PriorityWeights } from "@/lib/supabase/types";
import type { StudentCandidate, RankedCandidate } from "./types";

const DEFAULT_WEIGHTS: PriorityWeights = {
  timeSinceLastFlight: 0.3,
  timeUntilNextFlight: 0.2,
  totalFlightHours: 0.1,
  enrollmentProgress: 0.2,
  waitlistPosition: 0.2,
};

/**
 * Normalize a value to 0-1 range using min-max scaling.
 * Higher raw values produce higher normalized values.
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Rank candidates using the configurable priority weight system.
 *
 * Each signal is normalized to 0-1, multiplied by its weight, then summed.
 * Higher scores = higher priority for scheduling.
 */
export function rankCandidates(
  candidates: StudentCandidate[],
  weights?: Partial<PriorityWeights>
): RankedCandidate[] {
  if (candidates.length === 0) return [];

  const effectiveWeights = { ...DEFAULT_WEIGHTS, ...weights };

  // Compute ranges for normalization
  const daysSinceLast = candidates.map((c) => c.daysSinceLastFlight);
  const daysUntilNext = candidates
    .map((c) => c.daysUntilNextFlight)
    .filter((d): d is number => d !== null);
  const hours = candidates.map((c) => c.totalFlightHours);
  const progress = candidates.map((c) => c.enrollmentProgress);
  const positions = candidates.map((c) => c.waitlistPosition);

  const ranges = {
    daysSinceLast: { min: Math.min(...daysSinceLast), max: Math.max(...daysSinceLast) },
    daysUntilNext: {
      min: daysUntilNext.length ? Math.min(...daysUntilNext) : 0,
      max: daysUntilNext.length ? Math.max(...daysUntilNext) : 30,
    },
    hours: { min: Math.min(...hours), max: Math.max(...hours) },
    progress: { min: Math.min(...progress), max: Math.max(...progress) },
    positions: { min: Math.min(...positions), max: Math.max(...positions) },
  };

  const ranked: RankedCandidate[] = candidates.map((candidate) => {
    const breakdown: Record<string, number> = {};

    // Time since last flight — longer gap = higher priority
    breakdown.timeSinceLastFlight =
      normalize(candidate.daysSinceLastFlight, ranges.daysSinceLast.min, ranges.daysSinceLast.max) *
      effectiveWeights.timeSinceLastFlight;

    // Time until next flight — longer gap = higher priority (needs flight sooner)
    const nextFlightDays = candidate.daysUntilNextFlight ?? ranges.daysUntilNext.max;
    breakdown.timeUntilNextFlight =
      normalize(nextFlightDays, ranges.daysUntilNext.min, ranges.daysUntilNext.max) *
      effectiveWeights.timeUntilNextFlight;

    // Total flight hours — configurable direction, default: higher hours = higher priority (checkride readiness)
    breakdown.totalFlightHours =
      normalize(candidate.totalFlightHours, ranges.hours.min, ranges.hours.max) *
      effectiveWeights.totalFlightHours;

    // Enrollment progress — higher progress = higher priority (closer to completion)
    breakdown.enrollmentProgress =
      normalize(candidate.enrollmentProgress, ranges.progress.min, ranges.progress.max) *
      effectiveWeights.enrollmentProgress;

    // Waitlist position — lower position number = higher priority (invert normalization)
    breakdown.waitlistPosition =
      (1 - normalize(candidate.waitlistPosition, ranges.positions.min, ranges.positions.max)) *
      effectiveWeights.waitlistPosition;

    const score = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

    return {
      ...candidate,
      score: Math.round(score * 1000) / 1000,
      scoreBreakdown: breakdown,
    };
  });

  return ranked.sort((a, b) => b.score - a.score);
}
