"use client";

import { cn } from "@/lib/utils/cn";
import type { SuggestionType, SuggestionStatus } from "@/lib/supabase/types";

interface FiltersProps {
  activeType: SuggestionType | "all";
  activeStatus: SuggestionStatus | "all";
  onTypeChange: (type: SuggestionType | "all") => void;
  onStatusChange: (status: SuggestionStatus | "all") => void;
}

const TYPES: Array<{ value: SuggestionType | "all"; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "waitlist", label: "Waitlist" },
  { value: "reschedule", label: "Reschedule" },
  { value: "discovery", label: "Discovery" },
  { value: "next_lesson", label: "Next Lesson" },
];

const STATUSES: Array<{ value: SuggestionStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
  { value: "executed", label: "Executed" },
];

export function Filters({ activeType, activeStatus, onTypeChange, onStatusChange }: FiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-1">
        {STATUSES.map((status) => (
          <button
            key={status.value}
            onClick={() => onStatusChange(status.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              activeStatus === status.value
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {status.label}
          </button>
        ))}
      </div>
      <div className="h-6 w-px bg-gray-200" />
      <div className="flex items-center gap-1">
        {TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => onTypeChange(type.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              activeType === type.value
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}
