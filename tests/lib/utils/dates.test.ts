import { describe, it, expect } from "vitest";
import {
  formatLocalTime,
  formatLocalDate,
  formatLocalDateTime,
  getDurationMinutes,
  isWithinDaylightHours,
  getSearchWindow,
} from "@/lib/utils/dates";

describe("formatLocalTime", () => {
  it("formats a time string", () => {
    const result = formatLocalTime("2025-10-15T14:30:00Z");
    expect(result).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
  });
});

describe("formatLocalDate", () => {
  it("formats a date string", () => {
    const result = formatLocalDate("2025-10-15T14:30:00Z");
    expect(result).toContain("Oct");
    expect(result).toContain("2025");
  });
});

describe("formatLocalDateTime", () => {
  it("formats a full datetime string", () => {
    const result = formatLocalDateTime("2025-10-15T14:30:00Z");
    expect(result).toContain("Oct");
    expect(result).toContain("2025");
  });
});

describe("getDurationMinutes", () => {
  it("calculates duration between two times", () => {
    expect(getDurationMinutes("2025-10-15T14:00:00Z", "2025-10-15T16:30:00Z")).toBe(150);
  });

  it("returns 0 for same time", () => {
    expect(getDurationMinutes("2025-10-15T14:00:00Z", "2025-10-15T14:00:00Z")).toBe(0);
  });
});

describe("isWithinDaylightHours", () => {
  it("returns true when event is within twilight", () => {
    expect(
      isWithinDaylightHours(
        "2025-10-15T14:00:00Z",
        "2025-10-15T16:00:00Z",
        "2025-10-15T11:00:00Z",
        "2025-10-15T22:00:00Z"
      )
    ).toBe(true);
  });

  it("returns false when event extends past twilight", () => {
    expect(
      isWithinDaylightHours(
        "2025-10-15T21:00:00Z",
        "2025-10-15T23:00:00Z",
        "2025-10-15T11:00:00Z",
        "2025-10-15T22:00:00Z"
      )
    ).toBe(false);
  });

  it("returns false when event starts before twilight", () => {
    expect(
      isWithinDaylightHours(
        "2025-10-15T09:00:00Z",
        "2025-10-15T12:00:00Z",
        "2025-10-15T11:00:00Z",
        "2025-10-15T22:00:00Z"
      )
    ).toBe(false);
  });
});

describe("getSearchWindow", () => {
  it("returns correct start and end dates", () => {
    const start = new Date("2025-10-15T00:00:00Z");
    const window = getSearchWindow(start, 7);
    expect(window.start).toEqual(start);
    const diffMs = window.end.getTime() - window.start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(7);
  });
});
