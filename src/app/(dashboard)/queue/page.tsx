"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import type { SuggestionType, SuggestionStatus } from "@/lib/supabase/types";
import type { SuggestionRow } from "@/lib/engine/suggestions";
import { cn } from "@/lib/utils/cn";

type Suggestion = SuggestionRow;

const TYPE_CONFIG: Record<
  string,
  { label: string; bgClass: string; textClass: string; icon: string }
> = {
  waitlist: {
    label: "Waitlist Automation",
    bgClass: "bg-tertiary-container/20",
    textClass: "text-on-tertiary-container",
    icon: "hourglass_top",
  },
  reschedule: {
    label: "Reschedule on Cancellation",
    bgClass: "bg-primary-fixed",
    textClass: "text-on-primary-fixed-variant",
    icon: "event_repeat",
  },
  discovery: {
    label: "Discovery Flight",
    bgClass: "bg-secondary-container",
    textClass: "text-on-secondary-container",
    icon: "explore",
  },
  next_lesson: {
    label: "Next Lesson Suggestion",
    bgClass: "bg-tertiary-container/20",
    textClass: "text-on-tertiary-container",
    icon: "school",
  },
};

const STATUS_CONFIG: Record<string, { label: string; bgClass: string; textClass: string }> = {
  pending: {
    label: "Pending",
    bgClass: "bg-primary-fixed",
    textClass: "text-on-primary-fixed-variant",
  },
  approved: {
    label: "Approved",
    bgClass: "bg-tertiary-container/30",
    textClass: "text-on-tertiary-container",
  },
  declined: {
    label: "Declined",
    bgClass: "bg-error-container",
    textClass: "text-on-error-container",
  },
  expired: { label: "Expired", bgClass: "bg-surface-container-high", textClass: "text-secondary" },
  executed: {
    label: "Executed",
    bgClass: "bg-tertiary-container/30",
    textClass: "text-on-tertiary-container",
  },
  failed: { label: "Failed", bgClass: "bg-error-container", textClass: "text-on-error-container" },
};

const FILTER_TYPES: Array<{ value: SuggestionType | "all"; label: string }> = [
  { value: "all", label: "All Requests" },
  { value: "waitlist", label: "Waitlist" },
  { value: "reschedule", label: "Cancellations" },
  { value: "next_lesson", label: "Next Lesson" },
];

export default function QueuePage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<SuggestionType | "all">("all");
  const [activeStatus] = useState<SuggestionStatus | "all">("pending");

  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeStatus !== "all") params.set("status", activeStatus);
      if (activeType !== "all") params.set("type", activeType);
      const res = await fetch(`/api/suggestions?${params}`);
      const { data } = await res.json();
      setSuggestions(data || []);
    } catch {
      console.error("Failed to fetch suggestions");
    } finally {
      setIsLoading(false);
    }
  }, [activeType, activeStatus]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/suggestions/${id}/approve`, { method: "POST" });
      await fetchSuggestions();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/suggestions/${id}/decline`, { method: "POST" });
      await fetchSuggestions();
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = suggestions.filter((s) => s.status === "pending").length;

  return (
    <div>
      <Header title="Approval Queue" badge={`${pendingCount} Pending`} />
      <div className="mx-auto max-w-6xl space-y-12 p-8">
        {/* Filters */}
        <section className="flex items-center justify-between">
          <div className="flex gap-2 rounded-xl bg-surface-container-low p-1">
            {FILTER_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setActiveType(t.value)}
                className={cn(
                  "rounded-lg px-6 py-2 text-sm font-medium transition-colors",
                  activeType === t.value
                    ? "bg-surface-container-lowest font-bold text-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-highest"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-on-surface-variant">
            <span className="material-symbols-outlined text-lg">sort</span>
            Sort by: Newest First
          </div>
        </section>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/50 p-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-low shadow-sm">
              <span className="material-symbols-outlined text-outline">inbox</span>
            </div>
            <p className="font-bold text-on-surface">No suggestions</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              The scheduling agent will create suggestions when it detects opportunities.
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {suggestions.map((s, i) => {
              const typeConf = TYPE_CONFIG[s.type] || TYPE_CONFIG.waitlist;
              const statusConf = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending;
              const isPending = s.status === "pending";
              const isFirst = i === 0 && isPending;

              if (isFirst) {
                // Large priority item
                return (
                  <div
                    key={s.id}
                    className="relative overflow-hidden rounded-xl border border-transparent bg-surface-container-lowest p-8 shadow-sm transition-all hover:shadow-md lg:col-span-8"
                  >
                    <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-[100px] aviation-gradient opacity-5" />
                    <div className="relative z-10 flex justify-between">
                      <div className="flex gap-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-container-low text-primary">
                          <span className="material-symbols-outlined text-3xl">
                            {typeConf.icon}
                          </span>
                        </div>
                        <div>
                          <span
                            className={cn(
                              "mb-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                              typeConf.bgClass,
                              typeConf.textClass
                            )}
                          >
                            {typeConf.label}
                          </span>
                          <h3 className="text-2xl font-bold font-headline text-on-surface">
                            {s.student_name || "Unknown Student"}
                          </h3>
                          {s.instructor_name && (
                            <p className="mt-1 flex items-center gap-1 font-medium text-on-surface-variant">
                              <span className="material-symbols-outlined text-sm">person</span>
                              {s.instructor_name}
                            </p>
                          )}
                        </div>
                      </div>
                      {s.proposed_start && (
                        <div className="text-right">
                          <p className="text-2xl font-black font-headline tracking-tight text-primary">
                            {new Date(s.proposed_start).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-sm font-bold text-on-surface-variant">
                            {new Date(s.proposed_start).toLocaleDateString([], {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-8 rounded-xl bg-surface-container-low/40 p-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-on-surface-variant/70">
                          Aircraft
                        </p>
                        <p className="flex items-center gap-2 font-bold text-on-surface">
                          <span className="material-symbols-outlined text-lg text-primary">
                            flight
                          </span>
                          {s.aircraft_name || "TBD"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-on-surface-variant/70">
                          Instructor
                        </p>
                        <p className="flex items-center gap-2 font-bold text-on-surface">
                          <span className="material-symbols-outlined text-lg text-primary">
                            person
                          </span>
                          {s.instructor_name || "TBD"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-on-surface-variant/70">
                          Rationale
                        </p>
                        <p className="flex items-center gap-1 text-sm font-medium text-tertiary">
                          <span
                            className="material-symbols-outlined text-sm"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </span>
                          {s.rationale || "Best match"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                      <button
                        onClick={() => handleDecline(s.id)}
                        disabled={actionLoading === s.id}
                        className="flex items-center gap-2 rounded-lg bg-surface-container-high px-6 py-3 text-sm font-bold text-on-surface-variant transition-all hover:bg-surface-container-highest disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                        Decline
                      </button>
                      <button
                        onClick={() => handleApprove(s.id)}
                        disabled={actionLoading === s.id}
                        className="flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-bold text-white aviation-gradient shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
                      >
                        <span
                          className="material-symbols-outlined text-lg"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          verified
                        </span>
                        Approve Schedule
                      </button>
                    </div>
                  </div>
                );
              }

              // Secondary items
              return (
                <div
                  key={s.id}
                  className="flex flex-col rounded-xl border border-transparent bg-surface-container-lowest p-6 shadow-sm transition-all hover:shadow-md lg:col-span-4"
                >
                  <div className="mb-6 flex items-start justify-between">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        typeConf.bgClass,
                        typeConf.textClass
                      )}
                    >
                      {typeConf.label}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-black uppercase",
                        statusConf.bgClass,
                        statusConf.textClass
                      )}
                    >
                      {statusConf.label}
                    </span>
                  </div>

                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-low font-headline font-bold text-primary">
                      {(s.student_name || "??")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <h4 className="font-bold font-headline text-on-surface">
                        {s.student_name || "Unknown"}
                      </h4>
                      <p className="text-xs text-on-surface-variant">
                        {s.instructor_name || s.type}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6 flex-1 rounded-lg bg-surface-container-low p-4">
                    {s.proposed_start && (
                      <div className="mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-orange-500">
                          schedule
                        </span>
                        <span className="text-sm font-bold text-on-surface">
                          {new Date(s.proposed_start).toLocaleDateString([], {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          &bull;{" "}
                          {new Date(s.proposed_start).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                    <p className="text-xs leading-relaxed text-on-surface-variant">
                      <span className="font-bold text-on-surface">Rationale:</span>{" "}
                      {s.rationale || "Optimized scheduling suggestion."}
                    </p>
                  </div>

                  {isPending && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecline(s.id)}
                        disabled={actionLoading === s.id}
                        className="flex-1 rounded-lg border border-outline-variant/30 py-2.5 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleApprove(s.id)}
                        disabled={actionLoading === s.id}
                        className="flex-1 rounded-lg py-2.5 text-xs font-bold text-white aviation-gradient transition-all disabled:opacity-50"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* Efficiency banner */}
        {suggestions.length > 0 && (
          <section className="flex flex-col items-center justify-between gap-8 rounded-2xl border border-white/50 bg-surface-container-low p-10 md:flex-row">
            <div className="max-w-md">
              <h3 className="mb-2 text-2xl font-bold font-headline">Automated Efficiency</h3>
              <p className="font-medium text-on-surface-variant">
                PilotBase AI optimizes flight time through smart scheduling suggestions, reducing
                aircraft idle time.
              </p>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-3xl font-black font-headline text-primary">
                  {suggestions.length}
                </p>
                <p className="text-[10px] font-bold uppercase text-on-surface-variant">
                  Suggestions
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black font-headline text-tertiary">{pendingCount}</p>
                <p className="text-[10px] font-bold uppercase text-on-surface-variant">Pending</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
