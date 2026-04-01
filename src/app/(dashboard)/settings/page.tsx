"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import type { PriorityWeights, FeatureFlags } from "@/lib/supabase/types";
import { cn } from "@/lib/utils/cn";

const STRATEGIES = [
  {
    id: "weighted_priority",
    name: "Weighted Priority",
    description:
      "Ranks students by configurable weights: time since last flight, enrollment progress, waitlist position.",
    keyMetric: "Minimizes: Avg wait time",
    default: true,
  },
  {
    id: "edf",
    name: "Earliest Deadline First",
    description:
      "Prioritizes students with certification deadlines approaching soonest.",
    keyMetric: "Minimizes: Deadline misses",
  },
  {
    id: "fifo",
    name: "First In, First Out",
    description:
      "Students fill slots in strict waitlist order. Simple and transparent.",
    keyMetric: "Maximizes: Fairness",
  },
  {
    id: "balanced_utilization",
    name: "Balanced Utilization",
    description:
      "Spreads bookings evenly across aircraft and instructors to maximize fleet efficiency.",
    keyMetric: "Maximizes: Fleet utilization",
  },
];

interface OperatorConfig {
  priority_weights: PriorityWeights;
  search_window_days: number;
  max_alternatives: number;
  feature_flags: FeatureFlags;
}

const WEIGHT_SLIDERS: Array<{
  key: string;
  label: string;
  description: string;
  badgeClass: string;
}> = [
  {
    key: "timeSinceLastFlight",
    label: "TIME SINCE LAST FLIGHT",
    description: "Prioritizes students who haven't flown recently to maintain proficiency.",
    badgeClass: "bg-primary-fixed text-on-primary-fixed-variant",
  },
  {
    key: "enrollmentProgress",
    label: "ENROLLMENT PROGRESS",
    description: "Weights students closer to completing their program milestones.",
    badgeClass: "bg-tertiary-container text-on-tertiary-container",
  },
  {
    key: "waitlistPosition",
    label: "WAITLIST POSITION",
    description: "Ensures students stay with their queue position whenever possible.",
    badgeClass: "bg-secondary-fixed text-on-secondary-fixed-variant",
  },
];

const FLAG_LABELS: Record<string, string> = {
  waitlist: "Waitlist Automation",
  reschedule: "Reschedule on Cancellation",
  discovery: "Discovery Flight Booking",
  nextLesson: "Schedule Next Lesson",
};

const DEMO_CONFIG: OperatorConfig = {
  priority_weights: {
    timeSinceLastFlight: 0.3,
    timeUntilNextFlight: 0.2,
    totalFlightHours: 0.1,
    enrollmentProgress: 0.2,
    waitlistPosition: 0.2,
  },
  search_window_days: 7,
  max_alternatives: 5,
  feature_flags: { waitlist: true, reschedule: true, discovery: true, nextLesson: true },
};

export default function SettingsPage() {
  const [config, setConfig] = useState<OperatorConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState("weighted_priority");

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch("/api/settings");
        const { data } = await res.json();
        setConfig(data ?? DEMO_CONFIG);
      } catch {
        setConfig(DEMO_CONFIG);
      } finally {
        setIsLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priority_weights: config.priority_weights,
          search_window_days: config.search_window_days,
          max_alternatives: config.max_alternatives,
          feature_flags: config.feature_flags,
        }),
      });
      if (res.ok) {
        setSaveMessage("Settings saved.");
        setTimeout(() => setSaveMessage(""), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !config) {
    return (
      <div>
        <Header title="Settings" />
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Settings"
        actions={
          <div className="flex items-center gap-3">
            {saveMessage && (
              <span className="text-sm font-medium text-tertiary">{saveMessage}</span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg px-5 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 aviation-gradient transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        }
      />
      <div className="min-h-screen px-12 pb-12 pt-8">
        <div className="mx-auto max-w-5xl">
          {/* Page header */}
          <div className="mb-12">
            <h3 className="mb-2 text-4xl font-extrabold font-headline tracking-tight">
              Scheduling Agent Configuration
            </h3>
            <p className="max-w-2xl leading-relaxed text-on-surface-variant">
              Adjust the core logic of the PilotBase AI. These weights and windows define how
              flights are auto-assigned and prioritized across the fleet.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left column */}
            <div className="space-y-8 lg:col-span-8">
              {/* Scheduling Strategy */}
              <section className="rounded-xl bg-surface-container-lowest p-8 shadow-none">
                <div className="mb-8 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">psychology</span>
                  <h4 className="text-xl font-bold font-headline">Scheduling Strategy</h4>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {STRATEGIES.map((strategy) => {
                    const isSelected = selectedStrategy === strategy.id;
                    return (
                      <button
                        key={strategy.id}
                        onClick={() => setSelectedStrategy(strategy.id)}
                        className={cn(
                          "relative flex flex-col items-start rounded-xl border p-5 text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary-fixed/20 shadow-sm"
                            : "border-outline-variant/20 bg-surface hover:bg-surface-container-low"
                        )}
                      >
                        {isSelected && (
                          <span
                            className="material-symbols-outlined absolute right-4 top-4 text-lg text-primary"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </span>
                        )}
                        <p className="mb-2 pr-6 font-bold text-on-surface">{strategy.name}</p>
                        <p className="mb-4 text-xs leading-relaxed text-on-surface-variant">
                          {strategy.description}
                        </p>
                        <span className="rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                          {strategy.keyMetric}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs text-on-surface-variant">
                  Strategy selection affects how the Scheduling Agent ranks and fills open slots. Run
                  a simulation to compare strategies before changing.
                </p>
              </section>

              {/* Priority Weighting */}
              <section className="rounded-xl bg-surface-container-lowest p-8 shadow-none">
                <div className="mb-8 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">low_priority</span>
                  <h4 className="text-xl font-bold font-headline">Priority Weighting</h4>
                </div>
                <div className="space-y-10">
                  {WEIGHT_SLIDERS.map((slider) => {
                    const value = Math.round((config.priority_weights[slider.key] ?? 0) * 100);
                    return (
                      <div key={slider.key} className="group">
                        <div className="mb-4 flex items-center justify-between">
                          <label className="text-sm font-bold tracking-wide text-on-surface">
                            {slider.label}
                          </label>
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-bold",
                              slider.badgeClass
                            )}
                          >
                            {value}% Impact
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={value}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              priority_weights: {
                                ...config.priority_weights,
                                [slider.key]: parseInt(e.target.value) / 100,
                              },
                            })
                          }
                          className="w-full"
                        />
                        <p className="mt-2 text-xs italic text-on-surface-variant">
                          {slider.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Search Windows */}
              <section className="rounded-xl bg-surface-container-lowest p-8 shadow-none">
                <div className="mb-8 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">search_insights</span>
                  <h4 className="text-xl font-bold font-headline">Search Windows</h4>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold tracking-wide text-on-surface">
                      SEARCH WINDOW
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={config.search_window_days}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            search_window_days: parseInt(e.target.value) || 7,
                          })
                        }
                        className="w-full rounded-lg border-none bg-surface p-4 text-xl font-bold font-headline focus:ring-2 focus:ring-primary"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-on-surface-variant">
                        Days
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      How far ahead to search for available slots.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold tracking-wide text-on-surface">
                      MAX ALTERNATIVES
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={config.max_alternatives}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            max_alternatives: parseInt(e.target.value) || 5,
                          })
                        }
                        className="w-full rounded-lg border-none bg-surface p-4 text-xl font-bold font-headline focus:ring-2 focus:ring-primary"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-on-surface-variant">
                        Options
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      Maximum alternative time slots per suggestion.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Right column */}
            <div className="space-y-8 lg:col-span-4">
              {/* Daylight toggle card */}
              <div className="rounded-xl bg-gradient-to-br from-primary to-primary-container p-1 shadow-lg shadow-primary/10">
                <div className="rounded-[calc(0.75rem-3px)] bg-surface-container-lowest p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        wb_sunny
                      </span>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" defaultChecked className="peer sr-only" />
                      <div className="peer h-6 w-11 rounded-full bg-surface-container-highest after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full" />
                    </label>
                  </div>
                  <h5 className="mb-1 text-lg font-bold font-headline">Daylight Only</h5>
                  <p className="text-xs leading-relaxed text-on-surface-variant">
                    Automatically restrict student solo flights to local civil twilight hours.
                  </p>
                </div>
              </div>

              {/* Feature flags */}
              <section className="rounded-xl bg-surface-container-lowest p-8">
                <div className="mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">
                    notifications_active
                  </span>
                  <h4 className="text-lg font-bold font-headline">Feature Toggles</h4>
                </div>
                <div className="space-y-4">
                  {Object.entries(FLAG_LABELS).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors hover:bg-surface-container-low"
                    >
                      <span className="text-sm font-medium">{label}</span>
                      <button
                        onClick={() =>
                          setConfig({
                            ...config,
                            feature_flags: {
                              ...config.feature_flags,
                              [key]: !config.feature_flags[key],
                            },
                          })
                        }
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                          config.feature_flags[key] ? "bg-primary" : "bg-surface-container-highest"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                            config.feature_flags[key] ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </button>
                    </label>
                  ))}
                </div>
              </section>

              {/* Help card */}
              <div className="rounded-xl bg-tertiary-fixed p-8 text-on-tertiary-fixed-variant">
                <span className="material-symbols-outlined mb-4">help_outline</span>
                <h5 className="mb-2 font-bold">Need Help?</h5>
                <p className="mb-4 text-sm leading-relaxed opacity-90">
                  All changes are logged in the operations audit trail. Consult the Flight Training
                  Handbook for fleet-wide policy guidelines.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center gap-1 text-sm font-bold transition-all hover:gap-2"
                >
                  View Documentation
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom action footer */}
          <div className="mt-16 flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-low p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error-container text-error">
                <span className="material-symbols-outlined">restart_alt</span>
              </div>
              <div>
                <p className="text-sm font-bold">Reset to Defaults</p>
                <p className="text-xs text-on-surface-variant">
                  Revert all scheduling weights to standard factory settings.
                </p>
              </div>
            </div>
            <button className="rounded-lg border border-outline-variant px-6 py-2 text-sm font-bold text-on-surface-variant transition-colors hover:bg-white">
              Factory Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
