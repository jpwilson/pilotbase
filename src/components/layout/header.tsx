"use client";

import { useState, useEffect, useRef } from "react";
import { DEMO_ACTIVITY } from "@/lib/demo-data";

interface HeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, badge, actions }: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [read, setRead] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-black text-slate-900 font-headline">{title}</h2>
        {badge && (
          <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-on-primary-fixed-variant">
            {badge}
          </span>
        )}
        {subtitle && <span className="text-sm text-on-surface-variant">{subtitle}</span>}
      </div>
      <div className="flex items-center gap-6">
        {actions}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative text-slate-500 transition-colors hover:text-orange-500"
          >
            <span className="material-symbols-outlined">notifications</span>
            {!read && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-surface bg-error" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/30">
                <h4 className="text-sm font-bold text-on-surface">Notifications</h4>
                <button
                  onClick={() => setRead(true)}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Mark all read
                </button>
              </div>
              <div className="divide-y divide-outline-variant/20 max-h-72 overflow-y-auto">
                {DEMO_ACTIVITY.slice(0, 6).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors"
                  >
                    <div className="mt-0.5 h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full bg-primary-fixed/40 text-primary">
                      <span className="material-symbols-outlined text-sm">
                        {event.event_type === "suggestion_approved"
                          ? "event_available"
                          : event.event_type === "suggestion_declined"
                            ? "cancel"
                            : event.event_type === "reservation_created"
                              ? "assignment_turned_in"
                              : event.event_type === "notification_sent"
                                ? "notifications_active"
                                : "add_task"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-on-surface truncate">
                        {(event.payload?.student as string) ||
                          (event.payload?.recipient as string) ||
                          "System"}
                      </p>
                      <p className="text-xs text-on-surface-variant capitalize">
                        {event.event_type.replace(/_/g, " ")}
                      </p>
                      <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
                        {new Date(event.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-outline-variant/30">
                <a
                  href="/activity"
                  className="text-xs text-primary font-medium hover:underline"
                >
                  View all activity →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
