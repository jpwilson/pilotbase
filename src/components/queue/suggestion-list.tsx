"use client";

import { SuggestionCard } from "./suggestion-card";
import type { SuggestionRow } from "@/lib/engine/suggestions";

type Suggestion = SuggestionRow;

interface SuggestionListProps {
  suggestions: Suggestion[];
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
  isLoading?: boolean;
}

export function SuggestionList({
  suggestions,
  onApprove,
  onDecline,
  isLoading,
}: SuggestionListProps) {
  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
        <p className="text-sm font-medium text-gray-900">No suggestions</p>
        <p className="mt-1 text-sm text-gray-500">
          The scheduling agent will create suggestions when it detects opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          onApprove={onApprove}
          onDecline={onDecline}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
