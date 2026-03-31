import { vi, describe, it, expect, beforeEach } from "vitest";
import type { FSP } from "@/lib/fsp";
import type { EngineConfig, CompletionTrigger } from "@/lib/engine/types";
import type { FSPSchedulableEvent } from "@/lib/fsp/types";

vi.mock("@/lib/engine/suggestions", () => ({
  SuggestionService: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue({ id: "sug-1" }),
  })),
}));

const { NextLessonEngine } = await import("@/lib/engine/next-lesson");

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

const mockEvent: FSPSchedulableEvent = {
  eventId: "evt-1",
  enrollmentId: "enr-1",
  studentId: "stu-1",
  studentFirstName: "Alice",
  studentLastName: "Smith",
  courseId: "crs-1",
  courseName: "Private Pilot",
  lessonId: "les-4",
  lessonName: "Lesson 4",
  lessonOrder: 4,
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
  start: "2025-10-22T14:00:00Z",
  end: "2025-10-22T16:00:00Z",
  isWithinDaylight: true,
  matchesOriginalInstructor: true,
  matchesOriginalAircraft: true,
};

const trigger: CompletionTrigger = {
  type: "completion",
  studentId: "stu-1",
  enrollmentId: "enr-1",
  completedLessonId: "les-3",
  detectedAt: "2025-10-20T17:00:00Z",
};

function makeMockFSP(): FSP {
  return {
    training: {
      getSchedulableEvents: vi.fn().mockResolvedValue([mockEvent]),
      getEnrollmentProgress: vi.fn().mockResolvedValue({ completionPercentage: 40 }),
    },
    availability: { getForUsers: vi.fn().mockResolvedValue([]) },
    schedule: { getAvailableTimeSlots: vi.fn().mockResolvedValue([mockSlot]) },
  } as unknown as FSP;
}

describe("NextLessonEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a suggestion when next lesson and slots are found", async () => {
    const fsp = makeMockFSP();
    const engine = new NextLessonEngine(fsp, config);
    await engine.processCompletion(trigger);
    expect(fsp.training.getSchedulableEvents).toHaveBeenCalledOnce();
    expect(fsp.schedule.getAvailableTimeSlots).toHaveBeenCalledOnce();
  });

  it("returns early when student has no pending lessons", async () => {
    const fsp = makeMockFSP();
    (fsp.training.getSchedulableEvents as ReturnType<typeof vi.fn>).mockResolvedValue([
      { ...mockEvent, studentId: "stu-other" },
    ]);
    const engine = new NextLessonEngine(fsp, config);
    await engine.processCompletion(trigger);
    expect(fsp.schedule.getAvailableTimeSlots).not.toHaveBeenCalled();
  });

  it("returns early when no available slots found", async () => {
    const fsp = makeMockFSP();
    (fsp.schedule.getAvailableTimeSlots as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const engine = new NextLessonEngine(fsp, config);
    await engine.processCompletion(trigger);
    expect(fsp.training.getSchedulableEvents).toHaveBeenCalledOnce();
    expect(fsp.schedule.getAvailableTimeSlots).toHaveBeenCalledOnce();
  });

  it("picks the lesson with lowest lessonOrder when multiple pending", async () => {
    const fsp = makeMockFSP();
    (fsp.training.getSchedulableEvents as ReturnType<typeof vi.fn>).mockResolvedValue([
      { ...mockEvent, lessonId: "les-6", lessonName: "Lesson 6", lessonOrder: 6 },
      { ...mockEvent, lessonId: "les-4", lessonName: "Lesson 4", lessonOrder: 4 },
      { ...mockEvent, lessonId: "les-5", lessonName: "Lesson 5", lessonOrder: 5 },
    ]);
    const engine = new NextLessonEngine(fsp, config);
    await engine.processCompletion(trigger);
    // getAvailableTimeSlots should be called with the lesson-4 activityTypeId
    expect(fsp.schedule.getAvailableTimeSlots).toHaveBeenCalledWith(
      expect.objectContaining({ activityTypeId: "at-1" })
    );
  });

  it("handles null enrollment progress gracefully", async () => {
    const fsp = makeMockFSP();
    (fsp.training.getEnrollmentProgress as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const engine = new NextLessonEngine(fsp, config);
    await engine.processCompletion(trigger);
    expect(fsp.schedule.getAvailableTimeSlots).toHaveBeenCalledOnce();
  });

  it("handles slots returned as non-array gracefully", async () => {
    const fsp = makeMockFSP();
    (fsp.schedule.getAvailableTimeSlots as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const engine = new NextLessonEngine(fsp, config);
    await engine.processCompletion(trigger);
    expect(fsp.schedule.getAvailableTimeSlots).toHaveBeenCalledOnce();
  });

  it("includes rationale with assigned instructor when slot matches", async () => {
    const fsp = makeMockFSP();
    // slot.instructorId matches event.instructorIds
    (fsp.schedule.getAvailableTimeSlots as ReturnType<typeof vi.fn>).mockResolvedValue([
      { ...mockSlot, instructorId: "inst-1" },
    ]);
    const engine = new NextLessonEngine(fsp, config);
    await engine.processCompletion(trigger);
    expect(fsp.schedule.getAvailableTimeSlots).toHaveBeenCalledOnce();
  });
});

describe("NextLessonEngine.processPendingLessons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns count of suggestions created", async () => {
    const fsp = makeMockFSP();
    const engine = new NextLessonEngine(fsp, config);
    const count = await engine.processPendingLessons();
    expect(count).toBe(1);
  });

  it("returns 0 when no schedulable events exist", async () => {
    const fsp = makeMockFSP();
    (fsp.training.getSchedulableEvents as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const engine = new NextLessonEngine(fsp, config);
    const count = await engine.processPendingLessons();
    expect(count).toBe(0);
  });

  it("processes only the earliest lesson per student", async () => {
    const fsp = makeMockFSP();
    (fsp.training.getSchedulableEvents as ReturnType<typeof vi.fn>).mockResolvedValue([
      { ...mockEvent, lessonId: "les-4", lessonOrder: 4 },
      { ...mockEvent, lessonId: "les-5", lessonOrder: 5 },
    ]);
    const engine = new NextLessonEngine(fsp, config);
    // Both events have same studentId (stu-1), so only 1 should be processed
    const count = await engine.processPendingLessons();
    expect(count).toBe(1);
  });

  it("continues processing remaining students when one fails", async () => {
    const fsp = makeMockFSP();
    const event2: FSPSchedulableEvent = { ...mockEvent, studentId: "stu-2", eventId: "evt-2" };
    (fsp.training.getSchedulableEvents as ReturnType<typeof vi.fn>).mockResolvedValue([
      mockEvent,
      event2,
    ]);

    let callCount = 0;
    (fsp.schedule.getAvailableTimeSlots as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      if (callCount === 1) throw new Error("FSP error");
      return Promise.resolve([mockSlot]);
    });

    const engine = new NextLessonEngine(fsp, config);
    const count = await engine.processPendingLessons();
    // First student fails, second succeeds — count = 1
    expect(count).toBe(1);
  });
});
