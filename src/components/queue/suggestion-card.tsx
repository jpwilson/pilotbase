"use client";

import { cn } from "@/lib/utils/cn";
import {
  Clock,
  User,
  Plane,
  BookOpen,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import type { SuggestionRow } from "@/lib/engine/suggestions";

type Suggestion = SuggestionRow;

interface SuggestionCardProps {
  suggestion: Suggestion;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
  isLoading?: boolean;
}

const TYPE_CONFIG = {
  waitlist: { label: "Waitlist Fill", color: "bg-purple-100 text-purple-700", icon: Clock },
  reschedule: { label: "Reschedule", color: "bg-orange-100 text-orange-700", icon: Clock },
  discovery: { label: "Discovery Flight", color: "bg-green-100 text-green-700", icon: Plane },
  next_lesson: { label: "Next Lesson", color: "bg-blue-100 text-blue-700", icon: BookOpen },
};

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "text-yellow-600" },
  approved: { label: "Approved", color: "text-green-600" },
  declined: { label: "Declined", color: "text-red-600" },
  expired: { label: "Expired", color: "text-gray-500" },
  executed: { label: "Executed", color: "text-blue-600" },
  failed: { label: "Failed", color: "text-red-700" },
};

export function SuggestionCard({
  suggestion,
  onApprove,
  onDecline,
  isLoading,
}: SuggestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const typeConfig = TYPE_CONFIG[suggestion.type];
  const statusConfig = STATUS_CONFIG[suggestion.status];
  const isPending = suggestion.status === "pending";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", typeConfig.color)}>
            {typeConfig.label}
          </span>
          <span className={cn("text-xs font-medium", statusConfig.color)}>
            {statusConfig.label}
          </span>
          {suggestion.priority > 0 && (
            <span className="text-xs text-gray-400">Priority: {suggestion.priority}</span>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {new Date(suggestion.created_at).toLocaleString()}
        </span>
      </div>

      {/* Body */}
      <div className="mt-3 space-y-2">
        {suggestion.student_name && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{suggestion.student_name}</span>
          </div>
        )}

        {suggestion.proposed_start && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>
              {new Date(suggestion.proposed_start).toLocaleString()} &mdash;{" "}
              {suggestion.proposed_end
                ? new Date(suggestion.proposed_end).toLocaleTimeString()
                : ""}
            </span>
          </div>
        )}

        {(suggestion.instructor_name || suggestion.aircraft_name) && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {suggestion.instructor_name && <span>Instructor: {suggestion.instructor_name}</span>}
            {suggestion.aircraft_name && <span>Aircraft: {suggestion.aircraft_name}</span>}
          </div>
        )}

        <p className="text-sm text-gray-600">{suggestion.rationale}</p>
      </div>

      {/* Alternatives (expandable) */}
      {suggestion.alternatives && suggestion.alternatives.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {suggestion.alternatives.length} alternative(s)
          </button>
          {expanded && (
            <div className="mt-2 space-y-2 rounded-lg bg-gray-50 p-3">
              {suggestion.alternatives.map((rawAlt, i) => {
                const alt = rawAlt as Record<string, unknown>;
                return (
                  <div key={i} className="text-xs text-gray-600">
                    <span className="font-medium">Option {i + 1}:</span> {String(alt.start ?? "")}{" "}
                    &mdash; {String(alt.instructorName ?? "")} / {String(alt.aircraftName ?? "")}
                    {alt.rationale ? (
                      <span className="ml-1 text-gray-400">({String(alt.rationale)})</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {isPending && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onApprove(suggestion.id)}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            Approve
          </button>
          <button
            onClick={() => onDecline(suggestion.id)}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Decline
          </button>
        </div>
      )}
    </div>
  );
}
