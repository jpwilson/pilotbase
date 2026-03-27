import { describe, it, expect } from "vitest";
import { generateRationale } from "@/lib/engine/explainer";
import type { CancellationTrigger, DiscoveryTrigger, RankedCandidate } from "@/lib/engine/types";
import type { FSPScheduleEvent } from "@/lib/fsp/types";

describe("generateRationale", () => {
  it("generates rationale for a cancellation trigger", () => {
    const trigger: CancellationTrigger = {
      type: "cancellation",
      originalReservation: {
        CustomerName: "Jane Smith",
        Start: "2025-10-15T14:00:00Z",
        End: "2025-10-15T16:00:00Z",
        Title: "Lesson 5",
        InstructorName: "Bob",
        AircraftName: "N12345",
      },
      detectedAt: "2025-10-15T14:05:00Z",
    };

    const rationale = generateRationale({
      type: "reschedule",
      trigger,
      constraintsChecked: ["student availability", "daylight hours"],
    });

    expect(rationale).toContain("Jane Smith");
    expect(rationale).toContain("cancelled");
    expect(rationale).toContain("student availability");
  });

  it("generates rationale for a discovery request", () => {
    const trigger: DiscoveryTrigger = {
      type: "discovery_request",
      requestId: "req-1",
      prospectName: "New Prospect",
      detectedAt: "2025-10-15T10:00:00Z",
    };

    const rationale = generateRationale({
      type: "discovery",
      trigger,
      constraintsChecked: ["daylight hours"],
      additionalContext: "3 slots available.",
    });

    expect(rationale).toContain("New Prospect");
    expect(rationale).toContain("3 slots available");
  });

  it("includes ranking details when candidate is provided", () => {
    const candidate: RankedCandidate = {
      studentId: "stu-1",
      studentName: "Alex Johnson",
      daysSinceLastFlight: 10,
      daysUntilNextFlight: null,
      totalFlightHours: 45,
      enrollmentProgress: 75,
      waitlistPosition: 2,
      score: 0.82,
      scoreBreakdown: { timeSinceLastFlight: 0.3, enrollmentProgress: 0.2 },
      schedulableEvent: {} as never,
    };

    const rationale = generateRationale({
      type: "waitlist",
      trigger: {
        type: "opening",
        openSlot: { start: "2025-10-15T14:00:00Z", end: "2025-10-15T16:00:00Z", resourceId: "r1" },
        detectedAt: "2025-10-15T14:00:00Z",
      },
      candidate,
      constraintsChecked: [],
    });

    expect(rationale).toContain("Alex Johnson");
    expect(rationale).toContain("0.82");
    expect(rationale).toContain("45 total flight hours");
  });
});
