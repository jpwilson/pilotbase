import { describe, it, expect } from "vitest";
import { isFeatureEnabled, getEnabledFeatures } from "@/lib/utils/feature-flags";
import type { FeatureFlags } from "@/lib/supabase/types";

describe("isFeatureEnabled", () => {
  it("returns true for enabled features", () => {
    const flags: FeatureFlags = { waitlist: true, reschedule: false, discovery: true, nextLesson: false };
    expect(isFeatureEnabled(flags, "waitlist")).toBe(true);
    expect(isFeatureEnabled(flags, "discovery")).toBe(true);
  });

  it("returns false for disabled features", () => {
    const flags: FeatureFlags = { waitlist: true, reschedule: false, discovery: true, nextLesson: false };
    expect(isFeatureEnabled(flags, "reschedule")).toBe(false);
    expect(isFeatureEnabled(flags, "next_lesson")).toBe(false);
  });

  it("uses defaults when flags are undefined", () => {
    expect(isFeatureEnabled(undefined, "waitlist")).toBe(true);
    expect(isFeatureEnabled(undefined, "reschedule")).toBe(true);
  });
});

describe("getEnabledFeatures", () => {
  it("returns only enabled features", () => {
    const flags: FeatureFlags = { waitlist: true, reschedule: false, discovery: true, nextLesson: false };
    const enabled = getEnabledFeatures(flags);
    expect(enabled).toContain("waitlist");
    expect(enabled).toContain("discovery");
    expect(enabled).not.toContain("reschedule");
    expect(enabled).not.toContain("next_lesson");
  });

  it("returns all features with defaults", () => {
    const enabled = getEnabledFeatures(undefined);
    expect(enabled).toHaveLength(4);
  });
});
