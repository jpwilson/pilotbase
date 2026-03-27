import type { FeatureFlags } from "@/lib/supabase/types";
import type { SuggestionType } from "@/lib/supabase/types";

const DEFAULT_FLAGS: FeatureFlags = {
  waitlist: true,
  reschedule: true,
  discovery: true,
  nextLesson: true,
};

const FEATURE_TO_TYPE: Record<SuggestionType, keyof FeatureFlags> = {
  waitlist: "waitlist",
  reschedule: "reschedule",
  discovery: "discovery",
  next_lesson: "nextLesson",
};

export function isFeatureEnabled(
  flags: FeatureFlags | undefined,
  feature: SuggestionType
): boolean {
  const effectiveFlags = { ...DEFAULT_FLAGS, ...flags };
  const flagKey = FEATURE_TO_TYPE[feature];
  return effectiveFlags[flagKey] ?? false;
}

export function getEnabledFeatures(flags: FeatureFlags | undefined): SuggestionType[] {
  return (Object.keys(FEATURE_TO_TYPE) as SuggestionType[]).filter((type) =>
    isFeatureEnabled(flags, type)
  );
}
