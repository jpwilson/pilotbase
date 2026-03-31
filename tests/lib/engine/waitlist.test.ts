import { vi, describe, it, expect, beforeEach } from "vitest";
import type { FSP } from "@/lib/fsp";
import type { EngineConfig } from "@/lib/engine/types";
import type { FSPSchedulableEvent } from "@/lib/fsp/types";

vi.mock("@/lib/engine/suggestions", () => ({
  SuggestionService: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue({ id: "sug-1" }),
  })),
}));

// Import after mock setup
const { WaitlistEngine } = await import("@/lib/engine/waitlist");

const mockEvent: FSPSchedulableEvent = {
  eventId: "evt-1",
  enrollmentId: "enr-1",
  studentId: "stu-1",
  studentFirstName: "Alice",
  studentLastName: "Smith",
  courseId: "crs-1",
  courseName: "Private Pilot",
  lessonId: "les-1",
  lessonName: "Lesson 3",
  lessonOrder: 3,
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

const mockSlot = {
  instructorId: "inst-1",
  instructorName: "Bob Jones",
  aircraftId: "ac-1",
  aircraftName: "N12345",
  start: "2025-10-20T14:00:00Z",
  end: "2025-10-20T16:00:00Z",
  isWithinDaylight: true,
  matchesOriginalInstructor: true,
  matchesOriginalAircraft: true,
};

const config: EngineConfig = {
  operatorId: "op-1",
  locationId: 1,
  searchWindowDays: 7,
  maxAlternatives: 3,
  priorityWeights: {
    timeSinceLastFlight: 0.3,
    timeUntilNextFlight: 0.2,
    totalFlightHours: 0.1,
    enrollmentProgress: 0.2,
    waitlistPosition: 0.2,
  },
};

function makeMockFSP(): FSP {
  return {
    training: {
      getSchedulableEvents: vi.fn().mockResolvedValue([mockEvent]),
      getEnrollmentProgress: vi.fn().mockResolvedValue(null),
    },
    availability: { getForUsers: vi.fn().mockResolvedValue([]) },
    weather: { getCivilTwilight: vi.fn().mockResolvedValue(null) },
    schedule: { getAvailableTimeSlots: vi.fn().mockResolvedValue([mockSlot]) },
    resources: {
      listActivityTypes: vi.fn().mockResolvedValue([]),
      listInstructors: vi.fn().mockResolvedValue([]),
      listAircraft: vi.fn().mockResolvedValue([]),
    },
  } as unknown as FSP;
}

describe("WaitlistEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a suggestion when a schedulable event and slot are found", async () => {
    const fsp = makeMockFSP();
    const engine = new WaitlistEngine(fsp, config);
    await engine.processOpening({ type: "opening", openSlot: { start: "2025-10-20T14:00:00Z", end: "2025-10-20T15:00:00Z", resourceId: "r-1" }, detectedAt: "2025-10-20T13:00:00Z" });
    expect(fsp.training.getSchedulableEvents).toHaveBeenCalledOnce();
    expect(fsp.schedule.getAvailableTimeSlots).toHaveBeenCalledOnce();
  });

  it("returns early when no schedulable events exist", async () => {
    const fsp = makeMockFSP();
    (fsp.training.getSchedulableEvents as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const engine = new WaitlistEngine(fsp, config);
    await engine.processOpening({ type: "opening", openSlot: { start: "2025-10-20T14:00:00Z", end: "2025-10-20T15:00:00Z", resourceId: "r-1" }, detectedAt: "2025-10-20T13:00:00Z" });
    expect(fsp.schedule.getAvailableTimeSlots).not.toHaveBeenCalled();
  });

  it("handles a cancellation trigger", async () => {
    const fsp = makeMockFSP();
    const engine = new WaitlistEngine(fsp, config);
    await engine.processOpening({
      type: "cancellation",
      originalReservation: {
        Start: "2025-10-20T14:00:00Z",
        End: "2025-10-20T16:00:00Z",
        Title: "Lesson 3",
        CustomerName: "Alice Smith",
        InstructorName: "Bob Jones",
        AircraftName: "N12345",
        PilotId: "stu-1",
      },
      detectedAt: "2025-10-20T13:00:00Z",
    });
    expect(fsp.training.getSchedulableEvents).toHaveBeenCalledOnce();
  });

  it("respects maxAlternatives config", async () => {
    const manyEvents = Array.from({ length: 10 }, (_, i) => ({
      ...mockEvent,
      eventId: `evt-${i}`,
      studentId: `stu-${i}`,
    }));
    const fsp = makeMockFSP();
    (fsp.training.getSchedulableEvents as ReturnType<typeof vi.fn>).mockResolvedValue(manyEvents);
    const limitedConfig = { ...config, maxAlternatives: 2 };
    const engine = new WaitlistEngine(fsp, limitedConfig);
    await engine.processOpening({ type: "opening", openSlot: { start: "2025-10-20T14:00:00Z", end: "2025-10-20T15:00:00Z", resourceId: "r-1" }, detectedAt: "2025-10-20T13:00:00Z" });
    expect(fsp.schedule.getAvailableTimeSlots).toHaveBeenCalledTimes(2);
  });

  it("includes civil twilight in constraint check when available", async () => {
    const fsp = makeMockFSP();
    (fsp.weather.getCivilTwilight as ReturnType<typeof vi.fn>).mockResolvedValue({
      startDate: "2025-10-20T11:00:00Z",
      endDate: "2025-10-20T21:00:00Z",
    });
    const engine = new WaitlistEngine(fsp, config);
    await engine.processOpening({ type: "opening", openSlot: { start: "2025-10-20T14:00:00Z", end: "2025-10-20T15:00:00Z", resourceId: "r-1" }, detectedAt: "2025-10-20T13:00:00Z" });
    expect(fsp.weather.getCivilTwilight).toHaveBeenCalledWith("1");
  });
});
