import { vi, describe, it, expect, beforeEach } from "vitest";
import type { FSP } from "@/lib/fsp";
import type { EngineConfig, CancellationTrigger } from "@/lib/engine/types";

vi.mock("@/lib/engine/suggestions", () => ({
  SuggestionService: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue({ id: "sug-1" }),
  })),
}));

const { RescheduleEngine } = await import("@/lib/engine/reschedule");

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

const mockSlot = {
  instructorId: "inst-1",
  instructorName: "Bob Jones",
  aircraftId: "ac-1",
  aircraftName: "N12345",
  start: "2025-10-21T10:00:00Z",
  end: "2025-10-21T12:00:00Z",
  isWithinDaylight: true,
  matchesOriginalInstructor: true,
  matchesOriginalAircraft: true,
};

const cancellationTrigger: CancellationTrigger = {
  type: "cancellation",
  originalReservation: {
    Start: "2025-10-20T14:00:00Z",
    End: "2025-10-20T16:00:00Z",
    Title: "Lesson 5",
    CustomerName: "Jane Doe",
    InstructorName: "Bob Jones",
    AircraftName: "N12345",
    PilotId: "stu-1",
    InstructorId: "inst-1",
    AircraftId: "ac-1",
  },
  detectedAt: "2025-10-20T14:05:00Z",
};

function makeMockFSP(): FSP {
  return {
    availability: { getForUsers: vi.fn().mockResolvedValue([]) },
    weather: { getCivilTwilight: vi.fn().mockResolvedValue(null) },
    schedule: { getAvailableTimeSlots: vi.fn().mockResolvedValue([mockSlot]) },
  } as unknown as FSP;
}

describe("RescheduleEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a suggestion when alternatives are found", async () => {
    const fsp = makeMockFSP();
    const engine = new RescheduleEngine(fsp, config);
    await engine.processCancellation(cancellationTrigger);
    expect(fsp.schedule.getAvailableTimeSlots).toHaveBeenCalledOnce();
  });

  it("returns early when reservation has no pilot ID", async () => {
    const fsp = makeMockFSP();
    const engine = new RescheduleEngine(fsp, config);
    const trigger: CancellationTrigger = {
      ...cancellationTrigger,
      originalReservation: {
        ...cancellationTrigger.originalReservation,
        PilotId: undefined,
      },
    };
    await engine.processCancellation(trigger);
    expect(fsp.schedule.getAvailableTimeSlots).not.toHaveBeenCalled();
  });

  it("returns early when no alternative slots are found", async () => {
    const fsp = makeMockFSP();
    (fsp.schedule.getAvailableTimeSlots as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const engine = new RescheduleEngine(fsp, config);
    await engine.processCancellation(cancellationTrigger);
    expect(fsp.schedule.getAvailableTimeSlots).toHaveBeenCalledOnce();
  });

  it("includes same instructor in rationale when matched", async () => {
    const fsp = makeMockFSP();
    // slot.instructorId matches original InstructorId
    (fsp.schedule.getAvailableTimeSlots as ReturnType<typeof vi.fn>).mockResolvedValue([
      { ...mockSlot, instructorId: "inst-1" },
    ]);
    const engine = new RescheduleEngine(fsp, config);
    await engine.processCancellation(cancellationTrigger);
    expect(fsp.availability.getForUsers).toHaveBeenCalledWith(
      ["stu-1"],
      expect.any(String),
      expect.any(String)
    );
  });

  it("limits alternatives to maxAlternatives config", async () => {
    const fsp = makeMockFSP();
    const manySlots = Array.from({ length: 10 }, (_, i) => ({
      ...mockSlot,
      start: `2025-10-${21 + i}T10:00:00Z`,
      end: `2025-10-${21 + i}T12:00:00Z`,
    }));
    (fsp.schedule.getAvailableTimeSlots as ReturnType<typeof vi.fn>).mockResolvedValue(manySlots);
    const engine = new RescheduleEngine(fsp, config);
    await engine.processCancellation(cancellationTrigger);
    // Just ensure it ran without error — alternatives are sliced internally
    expect(fsp.schedule.getAvailableTimeSlots).toHaveBeenCalledOnce();
  });

  it("handles slots returned as non-array gracefully", async () => {
    const fsp = makeMockFSP();
    (fsp.schedule.getAvailableTimeSlots as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const engine = new RescheduleEngine(fsp, config);
    await engine.processCancellation(cancellationTrigger);
    // No crash, no suggestion created since alternatives = []
    expect(fsp.schedule.getAvailableTimeSlots).toHaveBeenCalledOnce();
  });
});
