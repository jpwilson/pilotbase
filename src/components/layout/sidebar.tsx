"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/queue", label: "Approval Queue", icon: "pending_actions" },
  { href: "/activity", label: "Activity Feed", icon: "rss_feed" },
  { href: "/students", label: "Students", icon: "group" },
  { href: "/simulation", label: "Simulation", icon: "science" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  const currentRole =
    typeof window !== "undefined"
      ? (document.cookie
          .split("; ")
          .find((c) => c.startsWith("demo_role="))
          ?.split("=")[1] ?? "admin")
      : "admin";

  const displayName = currentRole === "student" ? "Alex Rivera" : "Capt. Miller";
  const displayRole = currentRole === "student" ? "PPL Student" : "Chief Instructor";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <aside className="relative fixed left-0 top-0 flex h-screen w-64 flex-col bg-slate-900 p-4 z-50">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg aviation-gradient shadow-lg">
          <span
            className="material-symbols-outlined text-white"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            flight_takeoff
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white font-headline">
            PilotBase
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Flight Operations
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200",
                isActive
                  ? "bg-orange-500/15 text-orange-400 border-l-2 border-orange-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white border-l-2 border-transparent"
              )}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className={cn("text-sm font-headline", isActive ? "font-bold" : "font-medium")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-700 pt-6">
        {/* Profile panel */}
        {profileOpen && (
          <div className="absolute bottom-20 left-4 right-4 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-2xl z-50 overflow-hidden">
            <div className="aviation-gradient p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 font-bold text-white text-lg font-headline">
                  {initials}
                </div>
                <div>
                  <p className="font-bold text-white">{displayName}</p>
                  <p className="text-xs text-white/70">{displayRole}</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-400">Operator</p>
                <p className="text-sm font-medium text-white">Central Valley Flight Academy</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-400">Email</p>
                <p className="text-sm font-medium text-white">capt.miller@pilotbase.demo</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-400">Role</p>
                <p className="text-sm font-medium text-white">Admin — Full Access</p>
              </div>
              <div className="border-t border-slate-700 pt-3 space-y-1">
                <button
                  onClick={() => {
                    document.cookie =
                      "demo_role=student; path=/; max-age=" + 60 * 60 * 24 * 30;
                    window.location.reload();
                  }}
                  className="w-full text-left text-sm text-slate-300 hover:text-white transition-colors py-1 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">swap_horiz</span>
                  Switch to Student View
                </button>
                <button
                  onClick={() => {
                    document.cookie = "demo_role=; path=/; max-age=0";
                    window.location.href = "/login";
                  }}
                  className="w-full text-left text-sm text-slate-300 hover:text-red-400 transition-colors py-1 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
            <button
              onClick={() => setProfileOpen(false)}
              className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        <div
          className="flex items-center gap-3 px-2 cursor-pointer hover:bg-slate-800 rounded-lg py-2 transition-colors"
          onClick={() => setProfileOpen((p) => !p)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full aviation-gradient font-headline font-bold text-sm text-white shadow-md">
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="truncate text-sm font-bold text-white">{displayName}</p>
            <p className="truncate text-xs text-slate-400">{displayRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
