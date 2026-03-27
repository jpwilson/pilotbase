import { describe, it, expect } from "vitest";
import { checkSlotConstraints, isAircraftCompatible, isInstructorCompatible } from "@/lib/engine/constraints";
import type { FSPSchedulableEvent } from "@/lib/fsp/types";

const baseEvent: FSPSchedulableEvent = {
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
  instructorIds: ["inst-1", "inst-2"],
  aircraftIds: ["ac-1", "ac-2"],
  schedulingGroupIds: [],
  meetingRoomIds: [],
  isStageCheck: false,
  reservationTypeId: "rt-1",
  activityTypeId: "at-1",
};

describe("checkSlotConstraints", () => {
  it("returns satisfied when no constraints provided", () => {
    const result = checkSlotConstraints({
      start: "2025-10-15T14:00:00Z",
      end: "2025-10-15T16:00:00Z",
    });
    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("detects daylight violation for day flights", () => {
    const result = checkSlotConstraints({
      start: "2025-10-15T23:00:00Z",
      end: "2025-10-16T01:00:00Z",
      timeOfDay: 1, // Day
      civilTwilight: {
        startDate: "2025-10-15T11:00:00Z",
        endDate: "2025-10-15T22:00:00Z",
      },
    });
    expect(result.satisfied).toBe(false);
    expect(result.violations).toContain("Proposed time is outside daylight hours (civil twilight)");
  });

  it("passes daylight check for day flights within twilight", () => {
    const result = checkSlotConstraints({
      start: "2025-10-15T14:00:00Z",
      end: "2025-10-15T16:00:00Z",
      timeOfDay: 1,
      civilTwilight: {
        startDate: "2025-10-15T11:00:00Z",
        endDate: "2025-10-15T22:00:00Z",
      },
    });
    expect(result.satisfied).toBe(true);
  });

  it("skips daylight check for non-day flights", () => {
    const result = checkSlotConstraints({
      start: "2025-10-15T23:00:00Z",
      end: "2025-10-16T01:00:00Z",
      timeOfDay: 2, // Night
      civilTwilight: {
        startDate: "2025-10-15T11:00:00Z",
        endDate: "2025-10-15T22:00:00Z",
      },
    });
    expect(result.satisfied).toBe(true);
  });

  it("detects student unavailability", () => {
    const result = checkSlotConstraints({
      start: "2025-10-15T14:00:00Z", // Wednesday
      end: "2025-10-15T16:00:00Z",
      studentAvailability: {
        userGuidId: "stu-1",
        availabilities: [
          { dayOfWeek: 1, startAtTimeUtc: "14:00", endAtTimeUtc: "22:00" }, // Monday only
        ],
        availabilityOverrides: [],
      },
    });
    expect(result.satisfied).toBe(false);
    expect(result.violations).toContain("Student is not available during proposed time");
  });
});

describe("isAircraftCompatible", () => {
  it("returns true when aircraft is in the event's list", () => {
    expect(isAircraftCompatible("ac-1", baseEvent)).toBe(true);
  });

  it("returns false when aircraft is not in the event's list", () => {
    expect(isAircraftCompatible("ac-99", baseEvent)).toBe(false);
  });

  it("returns true when event has no specific aircraft requirements", () => {
    const event = { ...baseEvent, aircraftIds: [] };
    expect(isAircraftCompatible("ac-99", event)).toBe(true);
  });
});

describe("isInstructorCompatible", () => {
  it("returns true when instructor is in the event's list", () => {
    expect(isInstructorCompatible("inst-1", baseEvent)).toBe(true);
  });

  it("returns false when instructor is not in the event's list", () => {
    expect(isInstructorCompatible("inst-99", baseEvent)).toBe(false);
  });

  it("returns true when instructor is not required", () => {
    const event = { ...baseEvent, instructorRequired: false };
    expect(isInstructorCompatible("inst-99", event)).toBe(true);
  });

  it("returns true when event allows any instructor", () => {
    const event = { ...baseEvent, instructorIds: [] };
    expect(isInstructorCompatible("inst-99", event)).toBe(true);
  });
});
