"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/queue", label: "Approval Queue", icon: "pending_actions" },
  { href: "/activity", label: "Activity Feed", icon: "rss_feed" },
  { href: "/students", label: "Students", icon: "group" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const currentRole =
    typeof window !== "undefined"
      ? (document.cookie
          .split("; ")
          .find((c) => c.startsWith("demo_role="))
          ?.split("=")[1] ?? "admin")
      : "admin";

  const displayName = currentRole === "student" ? "Alex Rivera" : "Capt. Miller";
  const displayRole = currentRole === "student" ? "PPL Student" : "Chief Instructor";

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-slate-200/20 bg-slate-50/80 p-4 backdrop-blur-md z-50">
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
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-headline">
            PilotBase
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
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
                  ? "scale-95 bg-orange-50/50 font-bold text-orange-600"
                  : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-900"
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

      <div className="mt-auto border-t border-slate-200/20 pt-6">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest text-primary font-headline font-bold text-sm">
            {displayName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="overflow-hidden">
            <p className="truncate text-sm font-bold">{displayName}</p>
            <p className="truncate text-xs text-on-surface-variant">{displayRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
