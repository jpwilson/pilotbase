import { describe, it, expect } from "vitest";
import { rankCandidates } from "@/lib/engine/ranker";
import type { StudentCandidate } from "@/lib/engine/types";
import type { FSPSchedulableEvent } from "@/lib/fsp/types";

const mockEvent: FSPSchedulableEvent = {
  eventId: "evt-1",
  enrollmentId: "enr-1",
  studentId: "stu-1",
  studentFirstName: "John",
  studentLastName: "Doe",
  courseId: "crs-1",
  courseName: "Private Pilot",
  lessonId: "les-1",
  lessonName: "Lesson 5",
  lessonOrder: 5,
  flightType: 0,
  routeType: 0,
  timeOfDay: 0,
  durationTotal: 90,
  aircraftDurationTotal: 60,
  instructorDurationPre: 15,
  instructorDurationPost: 15,
  instructorDurationTotal: 90,
  instructorRequired: true,
  instructorIds: ["inst-1"],
  aircraftIds: ["ac-1"],
  schedulingGroupIds: [],
  meetingRoomIds: [],
  isStageCheck: false,
  reservationTypeId: "rt-1",
  activityTypeId: "at-1",
};

function makeCandidate(overrides: Partial<StudentCandidate> = {}): StudentCandidate {
  return {
    studentId: "stu-1",
    studentName: "John Doe",
    daysSinceLastFlight: 7,
    daysUntilNextFlight: null,
    totalFlightHours: 20,
    enrollmentProgress: 50,
    waitlistPosition: 1,
    schedulableEvent: mockEvent,
    ...overrides,
  };
}

describe("rankCandidates", () => {
  it("returns empty array for empty input", () => {
    expect(rankCandidates([])).toEqual([]);
  });

  it("ranks a single candidate with score > 0", () => {
    const candidates = [makeCandidate()];
    const ranked = rankCandidates(candidates);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].score).toBeGreaterThan(0);
    expect(ranked[0].scoreBreakdown).toBeDefined();
  });

  it("ranks candidates with longer gap since last flight higher", () => {
    const candidates = [
      makeCandidate({ studentId: "a", daysSinceLastFlight: 3, waitlistPosition: 1 }),
      makeCandidate({ studentId: "b", daysSinceLastFlight: 14, waitlistPosition: 2 }),
    ];
    const ranked = rankCandidates(candidates);
    expect(ranked[0].studentId).toBe("b");
  });

  it("respects custom weights", () => {
    const candidates = [
      makeCandidate({ studentId: "a", daysSinceLastFlight: 30, totalFlightHours: 5 }),
      makeCandidate({ studentId: "b", daysSinceLastFlight: 1, totalFlightHours: 100 }),
    ];

    // Give all weight to flight hours
    const ranked = rankCandidates(candidates, {
      timeSinceLastFlight: 0,
      timeUntilNextFlight: 0,
      totalFlightHours: 1,
      enrollmentProgress: 0,
      waitlistPosition: 0,
    });
    expect(ranked[0].studentId).toBe("b");
  });

  it("uses default weights when no custom weights provided", () => {
    const candidates = [makeCandidate()];
    const ranked = rankCandidates(candidates);
    expect(ranked[0].scoreBreakdown).toHaveProperty("timeSinceLastFlight");
    expect(ranked[0].scoreBreakdown).toHaveProperty("timeUntilNextFlight");
    expect(ranked[0].scoreBreakdown).toHaveProperty("totalFlightHours");
  });

  it("assigns lower position number higher waitlist priority", () => {
    const candidates = [
      makeCandidate({ studentId: "a", waitlistPosition: 5 }),
      makeCandidate({ studentId: "b", waitlistPosition: 1 }),
    ];
    // With equal other scores, lower position should rank higher
    const ranked = rankCandidates(candidates, {
      timeSinceLastFlight: 0,
      timeUntilNextFlight: 0,
      totalFlightHours: 0,
      enrollmentProgress: 0,
      waitlistPosition: 1,
    });
    expect(ranked[0].studentId).toBe("b");
  });

  it("handles null daysUntilNextFlight", () => {
    const candidates = [
      makeCandidate({ studentId: "a", daysUntilNextFlight: null }),
      makeCandidate({ studentId: "b", daysUntilNextFlight: 3 }),
    ];
    const ranked = rankCandidates(candidates);
    expect(ranked).toHaveLength(2);
    // Student with no next flight should get max gap value
    expect(ranked.every((r) => r.score > 0)).toBe(true);
  });

  it("produces scores between 0 and 1", () => {
    const candidates = [
      makeCandidate({ studentId: "a" }),
      makeCandidate({ studentId: "b", daysSinceLastFlight: 30, totalFlightHours: 100 }),
    ];
    const ranked = rankCandidates(candidates);
    for (const r of ranked) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
    }
  });
});
