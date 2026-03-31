import { vi, describe, it, expect, beforeEach } from "vitest";
import type { FSP } from "@/lib/fsp";
import type { EngineConfig, DiscoveryTrigger } from "@/lib/engine/types";

vi.mock("@/lib/engine/suggestions", () => ({
  SuggestionService: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue({ id: "sug-1" }),
  })),
}));

const { DiscoveryEngine } = await import("@/lib/engine/discovery");

const config: EngineConfig = {
  operatorId: "op-1",
  locationId: 1,
  searchWindowDays: 14,
  maxAlternatives: 3,
  priorityWeights: {
    timeSinceLastFlight: 0.3,
    timeUntilNextFlight: 0.2,
    totalFlightHours: 0.1,
    enrollmentProgress: 0.2,
    waitlistPosition: 0.2,
  },
};

const discoveryTrigger: DiscoveryTrigger = {
  type: "discovery_request",
  requestId: "req-1",
  prospectName: "Tom Prospect",
  detectedAt: "2025-10-20T12:00:00Z",
};

const mockDiscoveryActivity = { id: "at-disc", name: "Discovery Flight", isActive: true };

const mockSlot = {
  instructorId: "inst-1",
  instructorName: "Carol Jones",
  aircraftId: "ac-1",
  aircraftName: "N67890",
  start: "2025-10-22T13:00:00Z",
  end: "2025-10-22T14:30:00Z",
  isWithinDaylight: true,
  matchesOriginalInstructor: false,
  matchesOriginalAircraft: false,
};

function makeMockFSP(): FSP {
  return {
    resources: {
      listActivityTypes: vi.fn().mockResolvedValue([mockDiscoveryActivity]),
      listInstructors: vi.fn().mockResolvedValue([]),
      listAircraft: vi.fn().mockResolvedValue([]),
    },
    weather: { getCivilTwilight: vi.fn().mockResolvedValue(null) },
    schedule: { getAvailableTimeSlots: vi.fn().mockResolvedValue([mockSlot]) },
  } as unknown as FSP;
}

describe("DiscoveryEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a suggestion when a discovery activity and daylight slot are found", async () => {
    const fsp = makeMockFSP();
    const engine = new DiscoveryEngine(fsp, config);
    await engine.processRequest(discoveryTrigger, { prospectName: "Tom Prospect", prospectEmail: "tom@example.com" });
    expect(fsp.resources.listActivityTypes).toHaveBeenCalledOnce();
    expect(fsp.schedule.getAvailableTimeSlots).toHaveBeenCalledOnce();
  });

  it("returns early when no discovery activity type found", async () => {
    const fsp = makeMockFSP();
    (fsp.resources.listActivityTypes as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "at-1", name: "Private Pilot Lesson", isActive: true },
    ]);
    const engine = new DiscoveryEngine(fsp, config);
    await engine.processRequest(discoveryTrigger, { prospectName: "Tom Prospect" });
    expect(fsp.schedule.getAvailableTimeSlots).not.toHaveBeenCalled();
  });

  it("returns early when no daylight slots available", async () => {
    const fsp = makeMockFSP();
    (fsp.schedule.getAvailableTimeSlots as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const engine = new DiscoveryEngine(fsp, config);
    await engine.processRequest(discoveryTrigger, { prospectName: "Tom Prospect" });
    expect(fsp.schedule.getAvailableTimeSlots).toHaveBeenCalledOnce();
  });

  it("filters out non-daylight slots", async () => {
    const fsp = makeMockFSP();
    (fsp.schedule.getAvailableTimeSlots as ReturnType<typeof vi.fn>).mockResolvedValue([
      { ...mockSlot, isWithinDaylight: false },
      { ...mockSlot, isWithinDaylight: true, start: "2025-10-23T13:00:00Z" },
    ]);
    const engine = new DiscoveryEngine(fsp, config);
    await engine.processRequest(discoveryTrigger, { prospectName: "Tom Prospect" });
    expect(fsp.schedule.getAvailableTimeSlots).toHaveBeenCalledOnce();
  });

  it("handles inactive activity types", async () => {
    const fsp = makeMockFSP();
    (fsp.resources.listActivityTypes as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "at-disc", name: "Discovery Flight", isActive: false },
    ]);
    const engine = new DiscoveryEngine(fsp, config);
    await engine.processRequest(discoveryTrigger, { prospectName: "Tom Prospect" });
    expect(fsp.schedule.getAvailableTimeSlots).not.toHaveBeenCalled();
  });

  it("handles slots returned as non-array gracefully", async () => {
    const fsp = makeMockFSP();
    (fsp.schedule.getAvailableTimeSlots as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const engine = new DiscoveryEngine(fsp, config);
    await engine.processRequest(discoveryTrigger, { prospectName: "Tom Prospect" });
    expect(fsp.schedule.getAvailableTimeSlots).toHaveBeenCalledOnce();
  });

  it("passes preferred dates to request context", async () => {
    const fsp = makeMockFSP();
    const engine = new DiscoveryEngine(fsp, config);
    await engine.processRequest(discoveryTrigger, {
      prospectName: "Tom Prospect",
      preferredDates: ["2025-10-25", "2025-10-26"],
    });
    expect(fsp.schedule.getAvailableTimeSlots).toHaveBeenCalledOnce();
  });
});
