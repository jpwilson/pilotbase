"use client";

import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils/cn";

// Demo student data (sourced from FSP in production)
const DEMO_STUDENTS = [
  {
    name: "Marcus Chen",
    initials: "MC",
    program: "Private Pilot",
    status: "ACTIVE",
    statusClass: "bg-tertiary-container text-on-tertiary-container",
    progress: 65,
    progressColor: "bg-tertiary",
    hours: "32.5",
    lastFly: "2d ago",
  },
  {
    name: "Elena Rodriguez",
    initials: "ER",
    program: "Instrument Rating",
    status: "ON TRACK",
    statusClass: "bg-primary-fixed text-on-primary-fixed-variant",
    progress: 88,
    progressColor: "aviation-gradient",
    hours: "48.0",
    lastFly: "1d ago",
  },
  {
    name: "David Vance",
    initials: "DV",
    program: "Commercial Multi",
    status: "DELAYED",
    statusClass: "bg-error-container text-on-error-container",
    progress: 15,
    progressColor: "bg-error",
    hours: "5.5",
    lastFly: "14d ago",
  },
  {
    name: "Sophie Laurent",
    initials: "SL",
    program: "Private Pilot",
    status: "ACTIVE",
    statusClass: "bg-tertiary-container text-on-tertiary-container",
    progress: 42,
    progressColor: "bg-tertiary",
    hours: "18.2",
    lastFly: "3d ago",
  },
  {
    name: "Julian Banks",
    initials: "JB",
    program: "CFI Applicant",
    status: "ON TRACK",
    statusClass: "bg-primary-fixed text-on-primary-fixed-variant",
    progress: 92,
    progressColor: "aviation-gradient",
    hours: "240.5",
    lastFly: "5h ago",
  },
];

const STATS = [
  {
    label: "Total Active Students",
    value: "42",
    trend: "+5 from last month",
    trendIcon: "trending_up",
    trendColor: "text-tertiary",
    icon: "person_play",
    iconBg: "bg-tertiary/10",
    iconColor: "text-tertiary",
  },
  {
    label: "Awaiting Checkride",
    value: "08",
    trend: "Next scheduled: Friday",
    trendIcon: "schedule",
    trendColor: "text-primary",
    icon: "verified",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    label: "Flight Hours MTD",
    value: "184.5",
    trend: "92% of hangar target",
    trendIcon: "timer",
    trendColor: "text-on-secondary-container",
    icon: "flight_takeoff",
    iconBg: "bg-secondary-container",
    iconColor: "text-on-secondary-container",
  },
];

export default function StudentsPage() {
  return (
    <div>
      <Header title="Students Management" />
      <div className="mx-auto max-w-7xl space-y-10 p-8">
        {/* Stats */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm"
            >
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  {stat.label}
                </p>
                <h3 className="text-4xl font-extrabold font-headline text-on-surface">
                  {stat.value}
                </h3>
                <p
                  className={cn(
                    "mt-2 flex items-center gap-1 text-xs font-semibold",
                    stat.trendColor
                  )}
                >
                  <span className="material-symbols-outlined text-xs">{stat.trendIcon}</span>
                  {stat.trend}
                </p>
              </div>
              <div className={cn("rounded-full p-4", stat.iconBg)}>
                <span className={cn("material-symbols-outlined text-3xl", stat.iconColor)}>
                  {stat.icon}
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Filters */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold font-headline text-on-surface">Student Rosters</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Manage individual flight progress and certifications.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition-all hover:bg-surface-container-highest">
              <span className="material-symbols-outlined text-lg">filter_list</span>
              Filter
            </button>
            <button className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white shadow-md shadow-primary/20 aviation-gradient">
              <span className="material-symbols-outlined text-lg">person_add</span>
              Add Student
            </button>
          </div>
        </div>

        {/* Student Cards */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {DEMO_STUDENTS.map((student) => (
            <div
              key={student.name}
              className="group rounded-xl border border-outline-variant/5 bg-surface-container-lowest p-6 transition-all duration-300 hover:shadow-lg"
            >
              <div className="mb-6 flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-container-low font-headline text-lg font-bold text-primary">
                    {student.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface transition-colors group-hover:text-primary">
                      {student.name}
                    </h4>
                    <span className="rounded-full bg-secondary-container px-2 py-0.5 text-xs font-semibold text-on-secondary-container">
                      {student.program}
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest",
                    student.statusClass
                  )}
                >
                  {student.status}
                </span>
              </div>

              <div className="space-y-4">
                <div className="mb-1 flex justify-between text-xs font-bold text-on-surface-variant">
                  <span>Syllabus Progress</span>
                  <span>{student.progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-low">
                  <div
                    className={cn("h-full rounded-full", student.progressColor)}
                    style={{ width: `${student.progress}%` }}
                  />
                </div>
                <div className="flex gap-4 pt-2 text-xs font-medium text-on-surface-variant">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">schedule</span>
                    {student.hours} hrs
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">event</span>
                    Last fly: {student.lastFly}
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <button className="rounded-lg border border-outline-variant/30 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/5">
                  Suggest Lesson
                </button>
                <button className="rounded-lg bg-surface-container-high py-2 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-highest">
                  Send Reminder
                </button>
              </div>
            </div>
          ))}

          {/* Empty enrollment card */}
          <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-low/50 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
              <span className="material-symbols-outlined text-outline">person_add_alt</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-on-surface">New Enrollment?</h4>
              <p className="px-4 text-xs text-on-surface-variant">
                Start onboarding a new aviator to the PilotBase system.
              </p>
            </div>
            <button className="text-xs font-bold text-primary hover:underline">
              Launch Onboarding Wizard
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
