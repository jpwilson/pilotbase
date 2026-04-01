"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils/cn";
import { STRATEGIES } from "@/lib/simulation/strategies";
import { ACADEMY_SCENARIO } from "@/lib/simulation/scenario";
import { runSimulation } from "@/lib/simulation/engine";
import type { SimResult, SimEvent, SimConflict, ConflictType } from "@/lib/simulation/types";
import { parseISO, differenceInDays } from "date-fns";

// ─── Icon map ───────────────────────────────────────────────────────────────

const EVENT_ICON: Record<string, string> = {
  lesson_completed: "event_available",
  lesson_cancelled: "cancel",
  lesson_scheduled: "add_task",
  proficiency_gap_warning: "warning",
  conflict_detected: "error",
  weather_ground_stop: "thunderstorm",
  weather_clear: "wb_sunny",
  instructor_sick: "sick",
  instructor_recovered: "healing",
  aircraft_unserviceable: "build",
  aircraft_returned: "check_circle",
  next_lesson_triggered: "next_plan",
  discovery_request: "search",
};

const CONFLICT_ICON: Record<ConflictType, string> = {
  double_booking: "event_busy",
  proficiency_gap: "schedule",
  instructor_overload: "person_off",
  aircraft_overutilized: "airplane_ticket",
  no_slot_available: "block",
};

const SEVERITY_BORDER: Record<string, string> = {
  info: "border-l-emerald-400",
  warning: "border-l-amber-400",
  error: "border-l-red-400",
};

const SEVERITY_ICON_COLOR: Record<string, string> = {
  info: "text-emerald-500",
  warning: "text-amber-500",
  error: "text-red-500",
};

const SEVERITY_BADGE: Record<string, string> = {
  info: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatEventTime(isoTimestamp: string, startDate: string): string {
  try {
    const days = differenceInDays(parseISO(isoTimestamp), parseISO(startDate));
    const d = parseISO(isoTimestamp);
    return `Day ${days}, ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  } catch {
    return isoTimestamp.slice(0, 16);
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  suffix,
  icon,
  delta,
  winner,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon: string;
  delta?: number | null;
  winner?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-surface-container-lowest p-4 flex flex-col gap-1 shadow-sm",
        winner ? "border-orange-400 ring-1 ring-orange-300" : "border-outline-variant"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          {label}
        </span>
        <span className="material-symbols-outlined text-base text-primary">{icon}</span>
      </div>
      <div className="flex items-end gap-1 mt-1">
        <span className="text-2xl font-extrabold font-headline text-on-surface">{value}</span>
        {suffix && (
          <span className="text-sm text-on-surface-variant mb-0.5">{suffix}</span>
        )}
        {delta !== null && delta !== undefined && (
          <span
            className={cn(
              "ml-2 text-xs font-semibold mb-0.5",
              delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-500" : "text-on-surface-variant"
            )}
          >
            {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
      </div>
    </div>
  );
}

function EventRow({
  event,
  startDate,
}: {
  event: SimEvent;
  startDate: string;
}) {
  const icon = EVENT_ICON[event.type] ?? "info";
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 border-l-4 bg-surface-container-lowest rounded-r-lg",
        SEVERITY_BORDER[event.severity] ?? "border-l-slate-300"
      )}
    >
      <span
        className={cn(
          "material-symbols-outlined text-xl mt-0.5 shrink-0",
          SEVERITY_ICON_COLOR[event.severity] ?? "text-on-surface-variant"
        )}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-on-surface-variant">
            {formatEventTime(event.timestamp, startDate)}
          </span>
          {event.studentName && (
            <span className="text-[11px] font-semibold text-primary bg-primary-fixed/30 rounded px-1.5 py-0.5">
              {event.studentName}
            </span>
          )}
          {event.conflictId && (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 rounded px-1.5 py-0.5 border border-red-200">
              CONFLICT
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-on-surface mt-0.5">{event.headline}</p>
        {event.detail && (
          <p className="text-xs text-on-surface-variant mt-0.5">{event.detail}</p>
        )}
      </div>
    </div>
  );
}

function ConflictItem({ conflict }: { conflict: SimConflict }) {
  const icon = CONFLICT_ICON[conflict.type] ?? "warning";
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-outline-variant bg-surface-container-lowest">
      <span
        className={cn(
          "material-symbols-outlined text-xl shrink-0 mt-0.5",
          SEVERITY_ICON_COLOR[conflict.severity]
        )}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
              SEVERITY_BADGE[conflict.severity]
            )}
          >
            {conflict.severity}
          </span>
          <span className="text-[10px] font-mono text-on-surface-variant">
            {conflict.detectedAt.slice(0, 10)}
          </span>
          <span
            className={cn(
              "text-[10px] font-bold rounded px-1.5 py-0.5",
              conflict.autoResolved
                ? "bg-emerald-100 text-emerald-700"
                : "bg-surface-variant text-on-surface-variant"
            )}
          >
            {conflict.autoResolved ? "auto-resolved" : "unresolved"}
          </span>
        </div>
        <p className="text-sm text-on-surface mt-1">{conflict.description}</p>
        {conflict.resolution && (
          <p className="text-xs text-emerald-600 mt-0.5">Resolution: {conflict.resolution}</p>
        )}
      </div>
    </div>
  );
}

function ConflictPanel({ conflicts }: { conflicts: SimConflict[] }) {
  const grouped: Partial<Record<ConflictType, SimConflict[]>> = {};
  for (const c of conflicts) {
    if (!grouped[c.type]) grouped[c.type] = [];
    grouped[c.type]!.push(c);
  }

  const conflictTypeLabels: Record<ConflictType, string> = {
    double_booking: "Double Bookings",
    proficiency_gap: "Proficiency Gaps",
    instructor_overload: "Instructor Overload",
    aircraft_overutilized: "Aircraft Overutilized",
    no_slot_available: "No Slot Available",
  };

  if (conflicts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl text-emerald-400">check_circle</span>
        <p className="text-sm font-medium">No conflicts detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(Object.entries(grouped) as [ConflictType, SimConflict[]][]).map(([type, items]) => (
        <div key={type}>
          <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">{CONFLICT_ICON[type]}</span>
            {conflictTypeLabels[type]} ({items.length})
          </h4>
          <div className="space-y-2">
            {items.map((c) => (
              <ConflictItem key={c.id} conflict={c} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultsView({
  result,
  startDate,
  label,
}: {
  result: SimResult;
  startDate: string;
  label?: string;
}) {
  const [activeTab, setActiveTab] = useState<"events" | "conflicts">("events");
  const stats = result.stats;

  return (
    <div className="space-y-4">
      {label && (
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full bg-orange-500" />
          <span className="text-sm font-bold text-primary font-headline">{label}</span>
        </div>
      )}
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          label="Aircraft Util."
          value={stats.aircraftUtilizationPct.toFixed(1)}
          suffix="%"
          icon="flight"
        />
        <StatCard
          label="Completed"
          value={stats.completedLessons}
          icon="event_available"
        />
        <StatCard
          label="Cancelled"
          value={stats.cancelledLessons}
          icon="cancel"
        />
        <StatCard
          label="Conflicts"
          value={stats.conflictsTotal}
          icon="error"
        />
        <StatCard
          label="Avg Wait"
          value={stats.avgWaitHoursBetweenLessons.toFixed(1)}
          suffix="h"
          icon="schedule"
        />
        <StatCard
          label="Auto-Resolved"
          value={stats.conflictsAutoResolved}
          icon="auto_fix"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-outline-variant">
        <button
          onClick={() => setActiveTab("events")}
          className={cn(
            "px-4 py-2 text-sm font-semibold border-b-2 transition-colors",
            activeTab === "events"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          )}
        >
          Event Timeline ({result.events.length})
        </button>
        <button
          onClick={() => setActiveTab("conflicts")}
          className={cn(
            "px-4 py-2 text-sm font-semibold border-b-2 transition-colors",
            activeTab === "conflicts"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          )}
        >
          Conflicts ({result.conflicts.length})
        </button>
      </div>

      <div
        className={cn(
          "overflow-y-auto rounded-xl border border-outline-variant bg-surface-container p-3 space-y-1.5",
          "max-h-[520px]"
        )}
      >
        {activeTab === "events" ? (
          result.events.length === 0 ? (
            <p className="text-center text-sm text-on-surface-variant py-8">No events</p>
          ) : (
            result.events.map((ev) => (
              <EventRow key={ev.id} event={ev} startDate={startDate} />
            ))
          )
        ) : (
          <ConflictPanel conflicts={result.conflicts} />
        )}
      </div>
    </div>
  );
}

function ComparisonView({ results, startDate }: { results: SimResult[]; startDate: string }) {
  const [a, b] = results;

  type NumericStatKey = keyof {
    [K in keyof typeof a.stats as (typeof a.stats)[K] extends number ? K : never]: unknown;
  };

  const statKeys: {
    key: NumericStatKey;
    label: string;
    icon: string;
    higherIsBetter: boolean;
    suffix?: string;
  }[] = [
    { key: "aircraftUtilizationPct", label: "Aircraft Utilization", icon: "flight", higherIsBetter: true, suffix: "%" },
    { key: "instructorUtilizationPct", label: "Instructor Utilization", icon: "person", higherIsBetter: true, suffix: "%" },
    { key: "completedLessons", label: "Completed Lessons", icon: "event_available", higherIsBetter: true },
    { key: "cancelledLessons", label: "Cancelled Lessons", icon: "cancel", higherIsBetter: false },
    { key: "conflictsTotal", label: "Total Conflicts", icon: "error", higherIsBetter: false },
    { key: "conflictsAutoResolved", label: "Auto-Resolved", icon: "auto_fix", higherIsBetter: true },
    { key: "avgWaitHoursBetweenLessons", label: "Avg Wait Hours", icon: "schedule", higherIsBetter: false, suffix: "h" },
    { key: "proficiencyGapViolations", label: "Proficiency Gaps", icon: "warning", higherIsBetter: false },
  ];

  // Score each strategy
  let aScore = 0;
  let bScore = 0;
  for (const stat of statKeys) {
    const aVal = a.stats[stat.key] as number;
    const bVal = b.stats[stat.key] as number;
    if (aVal === bVal) continue;
    const aWins = stat.higherIsBetter ? aVal > bVal : aVal < bVal;
    if (aWins) aScore++;
    else bScore++;
  }
  const winnerIdx = aScore > bScore ? 0 : aScore < bScore ? 1 : -1;

  return (
    <div className="space-y-6">
      {/* Winner banner */}
      {winnerIdx !== -1 && (
        <div className="flex items-center gap-3 rounded-xl aviation-gradient px-5 py-3 shadow-md">
          <span
            className="material-symbols-outlined text-white text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            emoji_events
          </span>
          <div>
            <p className="text-white text-xs font-semibold uppercase tracking-wider">
              Best Strategy
            </p>
            <p className="text-white font-extrabold font-headline text-lg">
              {results[winnerIdx].strategyName}
            </p>
          </div>
          <span className="ml-auto text-white/80 text-sm font-medium">
            {winnerIdx === 0 ? aScore : bScore} / {statKeys.length} metrics won
          </span>
        </div>
      )}

      {/* Comparison table */}
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-outline-variant">
          <div className="p-3 text-xs font-bold uppercase text-on-surface-variant text-center">Metric</div>
          <div className="p-3 text-xs font-bold text-center text-primary">{a.strategyName}</div>
          <div className="p-3 text-xs font-bold text-center text-tertiary">{b.strategyName}</div>
        </div>
        {statKeys.map((stat) => {
          const aVal = a.stats[stat.key] as number;
          const bVal = b.stats[stat.key] as number;
          const aWins = aVal !== bVal && (stat.higherIsBetter ? aVal > bVal : aVal < bVal);
          const bWins = aVal !== bVal && (stat.higherIsBetter ? bVal > aVal : bVal < aVal);
          return (
            <div
              key={stat.key}
              className="grid grid-cols-3 divide-x divide-outline-variant border-t border-outline-variant"
            >
              <div className="p-3 flex items-center gap-1.5 text-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">{stat.icon}</span>
                {stat.label}
              </div>
              <div
                className={cn(
                  "p-3 text-center text-sm font-bold",
                  aWins ? "bg-emerald-50 text-emerald-700" : "text-on-surface"
                )}
              >
                {typeof aVal === "number" ? (stat.suffix === "%" ? aVal.toFixed(1) : aVal) : aVal}
                {stat.suffix}
                {aWins && (
                  <span className="material-symbols-outlined text-sm ml-1 text-emerald-600">
                    arrow_upward
                  </span>
                )}
              </div>
              <div
                className={cn(
                  "p-3 text-center text-sm font-bold",
                  bWins ? "bg-emerald-50 text-emerald-700" : "text-on-surface"
                )}
              >
                {typeof bVal === "number" ? (stat.suffix === "%" ? bVal.toFixed(1) : bVal) : bVal}
                {stat.suffix}
                {bWins && (
                  <span className="material-symbols-outlined text-sm ml-1 text-emerald-600">
                    arrow_upward
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Side-by-side event/conflict views */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ResultsView result={a} startDate={startDate} label={a.strategyName} />
        <ResultsView result={b} startDate={startDate} label={b.strategyName} />
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SimulationPage() {
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [duration, setDuration] = useState<7 | 14 | 30>(7);
  const [results, setResults] = useState<SimResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);

  const scenario = ACADEMY_SCENARIO;

  function toggleStrategy(id: string) {
    setSelectedStrategies((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (comparisonMode && prev.length >= 2) return [prev[1], id];
      if (!comparisonMode && prev.length >= 1) return [id];
      return [...prev, id];
    });
  }

  function runSingle() {
    if (selectedStrategies.length === 0) return;
    const strategy = STRATEGIES.find((s) => s.id === selectedStrategies[0]);
    if (!strategy) return;
    setIsRunning(true);
    setResults([]);
    setTimeout(() => {
      const result = runSimulation(scenario, strategy, duration);
      setResults([result]);
      setIsRunning(false);
    }, 0);
  }

  function runComparison() {
    if (selectedStrategies.length < 2) return;
    const [idA, idB] = selectedStrategies;
    const stratA = STRATEGIES.find((s) => s.id === idA);
    const stratB = STRATEGIES.find((s) => s.id === idB);
    if (!stratA || !stratB) return;
    setIsRunning(true);
    setResults([]);
    setTimeout(() => {
      const resultA = runSimulation(scenario, stratA, duration);
      const resultB = runSimulation(scenario, stratB, duration);
      setResults([resultA, resultB]);
      setIsRunning(false);
    }, 0);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header title="Schedule Simulation" />

      <main className="flex-1 p-6 space-y-6">
        {/* Scenario info */}
        <div className="rounded-2xl aviation-gradient p-5 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <span
              className="material-symbols-outlined text-3xl mt-0.5"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              science
            </span>
            <div>
              <h2 className="text-xl font-extrabold font-headline">{scenario.name}</h2>
              <p className="text-white/80 text-sm mt-1 max-w-2xl">{scenario.description}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">group</span>
                  {scenario.students.length} students
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">person</span>
                  {scenario.instructors.length} instructors
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">flight</span>
                  {scenario.aircraft.length} aircraft
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">event</span>
                  {scenario.initialBookings.length} initial bookings
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Strategy selector */}
          <div className="lg:col-span-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold font-headline text-on-surface">
                Select Strategy
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={comparisonMode}
                  onChange={(e) => {
                    setComparisonMode(e.target.checked);
                    setSelectedStrategies([]);
                  }}
                  className="rounded accent-orange-500"
                />
                <span className="text-sm text-on-surface-variant">Compare mode (pick 2)</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STRATEGIES.map((strategy) => {
                const isSelected = selectedStrategies.includes(strategy.id);
                const selIdx = selectedStrategies.indexOf(strategy.id);
                return (
                  <button
                    key={strategy.id}
                    onClick={() => toggleStrategy(strategy.id)}
                    className={cn(
                      "text-left p-4 rounded-xl border-2 transition-all duration-200 relative",
                      isSelected
                        ? "border-primary bg-primary-fixed/20"
                        : "border-outline-variant bg-surface-container hover:border-primary/50"
                    )}
                  >
                    {isSelected && comparisonMode && (
                      <span className="absolute top-2 right-2 h-5 w-5 rounded-full aviation-gradient text-white text-xs font-bold flex items-center justify-center shadow">
                        {selIdx + 1}
                      </span>
                    )}
                    {isSelected && !comparisonMode && (
                      <span
                        className="absolute top-2 right-2 material-symbols-outlined text-primary text-lg"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    )}
                    <p className="font-bold text-sm text-on-surface font-headline pr-6">
                      {strategy.name}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">{strategy.description}</p>
                    <p className="text-xs font-semibold text-primary mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">trending_up</span>
                      {strategy.keyMetric}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration + run controls */}
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm flex flex-col gap-4">
            <h3 className="text-base font-bold font-headline text-on-surface">
              Simulation Duration
            </h3>
            <div className="flex flex-col gap-2">
              {([7, 14, 30] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={cn(
                    "px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all",
                    duration === d
                      ? "border-primary bg-primary-fixed/20 text-primary"
                      : "border-outline-variant text-on-surface-variant hover:border-primary/50"
                  )}
                >
                  {d} Days
                  <span className="ml-2 text-xs font-normal opacity-60">
                    {d === 7 ? "1 week" : d === 14 ? "2 weeks" : "1 month"}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-auto space-y-2">
              <button
                onClick={runSingle}
                disabled={isRunning || selectedStrategies.length === 0}
                className={cn(
                  "w-full px-4 py-3 rounded-xl font-bold text-sm transition-all",
                  "aviation-gradient text-white shadow-md",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "hover:shadow-lg active:scale-[0.98]"
                )}
              >
                {isRunning ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm animate-spin">
                      refresh
                    </span>
                    Running...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                    Run Simulation
                  </span>
                )}
              </button>

              <button
                onClick={runComparison}
                disabled={isRunning || selectedStrategies.length < 2}
                className={cn(
                  "w-full px-4 py-3 rounded-xl font-bold text-sm transition-all",
                  "border-2 border-primary text-primary",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "hover:bg-primary-fixed/20 active:scale-[0.98]"
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">compare</span>
                  Compare Strategies
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <span
                className="material-symbols-outlined text-primary text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                analytics
              </span>
              <h3 className="text-lg font-extrabold font-headline text-on-surface">
                {results.length === 2 ? "Strategy Comparison" : "Simulation Results"}
              </h3>
              <span className="ml-auto text-xs text-on-surface-variant font-medium">
                {duration} day simulation · {scenario.name}
              </span>
            </div>

            {results.length === 1 ? (
              <ResultsView result={results[0]} startDate={scenario.startDate} />
            ) : (
              <ComparisonView results={results} startDate={scenario.startDate} />
            )}
          </div>
        )}

        {/* Empty state */}
        {results.length === 0 && !isRunning && (
          <div className="rounded-2xl border-2 border-dashed border-outline-variant p-12 flex flex-col items-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl text-outline-variant">
              science
            </span>
            <p className="text-base font-semibold">Select a strategy and run the simulation</p>
            <p className="text-sm text-center max-w-sm">
              Choose one strategy and click &quot;Run Simulation&quot;, or enable compare mode to select two
              strategies for side-by-side analysis.
            </p>
          </div>
        )}

        {isRunning && (
          <div className="rounded-2xl border border-outline-variant p-12 flex flex-col items-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl text-primary animate-pulse">
              hourglass_top
            </span>
            <p className="text-base font-semibold text-on-surface">Running simulation...</p>
            <p className="text-sm">Processing {duration} days of schedule events</p>
          </div>
        )}
      </main>
    </div>
  );
}
