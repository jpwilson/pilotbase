"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import type { AuditLogRow } from "@/lib/engine/audit";
import { cn } from "@/lib/utils/cn";
import { DEMO_ACTIVITY } from "@/lib/demo-data";

type AuditLogEntry = AuditLogRow;

const EVENT_CONFIG: Record<
  string,
  {
    label: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    statusLabel: string;
    statusClass: string;
  }
> = {
  suggestion_created: {
    label: "Suggestion Created",
    icon: "add_task",
    iconBg: "bg-primary-fixed/30",
    iconColor: "text-primary",
    statusLabel: "Scheduled",
    statusClass: "bg-primary-fixed text-on-primary-fixed-variant",
  },
  suggestion_approved: {
    label: "Suggestion Approved",
    icon: "event_available",
    iconBg: "bg-tertiary-container/20",
    iconColor: "text-tertiary",
    statusLabel: "Executed",
    statusClass: "bg-tertiary-container/30 text-on-tertiary-container",
  },
  suggestion_declined: {
    label: "Suggestion Declined",
    icon: "cancel",
    iconBg: "bg-error-container/20",
    iconColor: "text-error",
    statusLabel: "Alert",
    statusClass: "bg-error-container text-on-error-container",
  },
  reservation_created: {
    label: "Reservation Created",
    icon: "assignment_turned_in",
    iconBg: "bg-tertiary-container/20",
    iconColor: "text-tertiary",
    statusLabel: "Completed",
    statusClass: "bg-tertiary-container/30 text-on-tertiary-container",
  },
  notification_sent: {
    label: "Notification Sent",
    icon: "notifications_active",
    iconBg: "bg-secondary-container/50",
    iconColor: "text-secondary",
    statusLabel: "Sent",
    statusClass: "bg-secondary-container text-on-secondary-container",
  },
};

const FILTER_OPTIONS = [
  { value: "all", label: "All Events" },
  { value: "suggestion_created", label: "Suggestions Created" },
  { value: "suggestion_approved", label: "Suggestions Approved" },
  { value: "suggestion_declined", label: "Suggestions Declined" },
  { value: "reservation_created", label: "Reservations Created" },
  { value: "notification_sent", label: "Notifications Sent" },
];

function groupByDate(events: AuditLogEntry[]): { label: string; entries: AuditLogEntry[] }[] {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Record<string, AuditLogEntry[]> = {};

  for (const event of events) {
    const d = new Date(event.created_at);
    let label: string;
    if (d.toDateString() === today.toDateString()) label = "Today";
    else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
    else label = d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

    if (!groups[label]) groups[label] = [];
    groups[label].push(event);
  }

  return Object.entries(groups).map(([label, entries]) => ({ label, entries }));
}

function exportAsCSV(events: AuditLogEntry[]) {
  const rows = [
    ["ID", "Event Type", "Entity", "Actor", "Timestamp"],
    ...events.map((e) => [
      e.id,
      e.event_type,
      e.entity_type || "",
      e.actor_type || "",
      new Date(e.created_at).toISOString(),
    ]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pilotbase-activity.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ActivityPage() {
  const [events, setEvents] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch("/api/activity?limit=100");
        const { data } = await res.json();
        const results = data && data.length > 0 ? data : DEMO_ACTIVITY;
        setEvents(results);
      } catch {
        setEvents(DEMO_ACTIVITY);
      } finally {
        setIsLoading(false);
      }
    }
    fetchActivity();
  }, []);

  const filteredEvents =
    activeFilter === "all" ? events : events.filter((e) => e.event_type === activeFilter);
  const dateGroups = groupByDate(filteredEvents);

  return (
    <div>
      <Header title="Mission Log" badge="Live Feed" />
      <div className="mx-auto max-w-5xl p-8">
        {/* Page header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h3 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">
              Activity Stream
            </h3>
            <p className="mt-1 text-on-surface-variant">
              Monitoring real-time scheduling maneuvers and student logistics.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <button
                onClick={() => setFilterOpen((f) => !f)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
                  activeFilter !== "all"
                    ? "bg-primary text-white"
                    : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                )}
              >
                <span className="material-symbols-outlined text-sm">filter_list</span>
                Filter
                {activeFilter !== "all" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </button>

              {filterOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-xl z-40 overflow-hidden">
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setActiveFilter(opt.value);
                        setFilterOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between",
                        activeFilter === opt.value
                          ? "bg-primary-fixed/20 text-primary font-semibold"
                          : "text-on-surface hover:bg-surface-container-low"
                      )}
                    >
                      {opt.label}
                      {activeFilter === opt.value && (
                        <span
                          className="material-symbols-outlined text-sm"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => exportAsCSV(filteredEvents)}
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 aviation-gradient transition-all hover:opacity-90"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export Log
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/50 p-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-low shadow-sm">
              <span className="material-symbols-outlined text-outline">rss_feed</span>
            </div>
            <p className="font-bold text-on-surface">No activity yet</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Events will appear here as the scheduling agent takes action.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {dateGroups.map((group, gi) => (
              <section key={group.label}>
                <div className="mb-6 flex items-center gap-4">
                  <h4
                    className={cn(
                      "text-sm font-bold uppercase tracking-widest",
                      gi === 0 ? "text-primary" : "text-on-surface-variant"
                    )}
                  >
                    {group.label}
                  </h4>
                  <div className="h-px flex-grow bg-gradient-to-r from-outline-variant/50 to-transparent" />
                </div>
                <div
                  className={cn(
                    "space-y-4",
                    gi > 0 && "opacity-80 hover:opacity-100 transition-opacity"
                  )}
                >
                  {group.entries.map((event) => {
                    const conf = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.suggestion_created;
                    return (
                      <div
                        key={event.id}
                        className="group flex items-center gap-6 rounded-xl bg-surface-container-lowest p-5 transition-all duration-300 hover:bg-surface-bright hover:shadow-[0px_12px_32px_rgba(25,28,30,0.06)]"
                      >
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full",
                            conf.iconBg,
                            conf.iconColor
                          )}
                        >
                          <span className="material-symbols-outlined">{conf.icon}</span>
                        </div>
                        <div className="grid flex-grow grid-cols-12 items-center gap-4">
                          <div className="col-span-4">
                            <p className="mb-0.5 text-xs font-bold uppercase tracking-tight text-on-surface-variant">
                              {conf.label}
                            </p>
                            <h5 className="text-base font-bold text-on-surface">
                              {(event.payload?.student as string) ||
                                (event.payload?.recipient as string) ||
                                `${event.entity_type} ${event.entity_id?.slice(0, 8)}`}
                              {event.payload?.type ? (
                                <span className="ml-2 text-xs font-medium text-on-surface-variant">
                                  {String(event.payload.type)}
                                </span>
                              ) : null}
                            </h5>
                          </div>
                          <div className="col-span-3">
                            <p className="mb-0.5 text-xs text-on-surface-variant">Time Logged</p>
                            <p className="text-sm font-semibold text-on-surface">
                              {new Date(event.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              UTC
                            </p>
                          </div>
                          <div className="col-span-3">
                            <p className="mb-0.5 text-xs text-on-surface-variant">Actor</p>
                            <p className="text-sm font-medium text-on-surface">
                              {event.actor_id
                                ? event.actor_id
                                : event.actor_type
                                  ? event.actor_type.charAt(0).toUpperCase() +
                                    event.actor_type.slice(1)
                                  : "System"}
                            </p>
                          </div>
                          <div className="col-span-2 flex justify-end">
                            <span
                              className={cn(
                                "rounded-full px-3 py-1 text-[10px] font-black uppercase",
                                conf.statusClass
                              )}
                            >
                              {conf.statusLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
