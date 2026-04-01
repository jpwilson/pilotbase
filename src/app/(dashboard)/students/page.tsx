"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils/cn";
import type { Student } from "@/lib/supabase/types";

// ---------- helpers ----------

function getStatusClass(status: Student["status"]) {
  switch (status) {
    case "ACTIVE":
      return "bg-tertiary-container text-on-tertiary-container";
    case "ON TRACK":
      return "bg-primary-fixed text-on-primary-fixed-variant";
    case "DELAYED":
      return "bg-error-container text-on-error-container";
    case "INACTIVE":
      return "bg-surface-container-high text-on-surface-variant";
    case "GRADUATED":
      return "bg-secondary-container text-on-secondary-container";
  }
}

function getProgressBar(progress: number): { className?: string; style?: React.CSSProperties } {
  if (progress >= 80) return { className: "bg-tertiary" };
  if (progress >= 50)
    return { style: { background: "linear-gradient(90deg, #8e4f00, #f49d48)" } };
  return { className: "bg-error" };
}

function formatLastFly(lastFlightAt: string | null): string {
  if (!lastFlightAt) return "Never";
  const diff = Date.now() - new Date(lastFlightAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 2) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------- Toast ----------

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-surface-container-highest px-5 py-3 shadow-xl ring-1 ring-outline-variant/20">
      <span className="material-symbols-outlined text-tertiary text-lg">check_circle</span>
      <span className="text-sm font-semibold text-on-surface">{message}</span>
      <button onClick={onClose} className="ml-2 text-on-surface-variant hover:text-on-surface">
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  );
}

// ---------- Add Student Modal ----------

const PROGRAMS = [
  "Private Pilot",
  "Instrument Rating",
  "Commercial Pilot",
  "CFI Applicant",
  "Commercial Multi",
];

const ADD_STATUSES: Student["status"][] = ["ACTIVE", "ON TRACK", "DELAYED"];

interface AddStudentForm {
  name: string;
  email: string;
  phone: string;
  program: string;
  status: Student["status"];
  total_flight_hours: string;
  notes: string;
}

const EMPTY_FORM: AddStudentForm = {
  name: "",
  email: "",
  phone: "",
  program: "Private Pilot",
  status: "ACTIVE",
  total_flight_hours: "0",
  notes: "",
};

function AddStudentModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (s: Student) => void;
}) {
  const [form, setForm] = useState<AddStudentForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          program: form.program,
          status: form.status,
          total_flight_hours: parseFloat(form.total_flight_hours) || 0,
          notes: form.notes.trim() || null,
          enrollment_progress: 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add student");
      onAdded(json.data as Student);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-surface-container-lowest p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 className="mb-6 text-xl font-bold font-headline text-on-surface">Add New Student</h2>
        {error && (
          <div className="mb-4 rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-on-surface-variant">
              Name <span className="text-error">*</span>
            </label>
            <input
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Full name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-on-surface-variant">Email</label>
              <input
                type="email"
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="student@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-on-surface-variant">Phone</label>
              <input
                type="tel"
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+1 555-000-0000"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-on-surface-variant">
                Program
              </label>
              <select
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
                value={form.program}
                onChange={(e) => setForm((f) => ({ ...f, program: e.target.value }))}
              >
                {PROGRAMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-on-surface-variant">Status</label>
              <select
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as Student["status"] }))
                }
              >
                {ADD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-on-surface-variant">
              Flight Hours
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
              value={form.total_flight_hours}
              onChange={(e) => setForm((f) => ({ ...f, total_flight_hours: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-on-surface-variant">Notes</label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Any additional notes..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-outline-variant/30 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg py-2.5 text-sm font-bold text-white aviation-gradient disabled:opacity-60"
            >
              {saving ? "Adding..." : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Student Detail Slide-Over ----------

function StudentDetailPanel({
  student,
  onClose,
  onUpdated,
  onDeleted,
  onToast,
}: {
  student: Student | null;
  onClose: () => void;
  onUpdated: (s: Student) => void;
  onDeleted: (id: string) => void;
  onToast: (msg: string) => void;
}) {
  const [form, setForm] = useState<Partial<Student>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setForm({ ...student });
      setError(null);
    }
  }, [student]);

  async function handleSave() {
    if (!student) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");
      onUpdated(json.data as Student);
      onToast("Student updated successfully.");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!student) return;
    if (!window.confirm(`Remove ${student.name} from the roster? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${student.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to delete");
      }
      onDeleted(student.id);
      onToast(`${student.name} removed from roster.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleting(false);
    }
  }

  if (!student) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 flex h-full w-full max-w-[480px] flex-col overflow-y-auto bg-surface-container-lowest shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/10 px-6 py-5">
          <h2 className="text-lg font-bold font-headline text-on-surface">Student Details</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 space-y-5 p-6">
          {error && (
            <div className="rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold text-on-surface-variant">Name</label>
            <input
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
              value={form.name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-on-surface-variant">Email</label>
              <input
                type="email"
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
                value={form.email ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value || null }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-on-surface-variant">Phone</label>
              <input
                type="tel"
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
                value={form.phone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value || null }))}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-on-surface-variant">Program</label>
            <select
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
              value={form.program ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, program: e.target.value }))}
            >
              {PROGRAMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-on-surface-variant">Status</label>
              <select
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
                value={form.status ?? "ACTIVE"}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as Student["status"] }))
                }
              >
                {(["ACTIVE", "ON TRACK", "DELAYED", "INACTIVE", "GRADUATED"] as const).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-on-surface-variant">
                Flight Hours
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
                value={form.total_flight_hours ?? 0}
                onChange={(e) =>
                  setForm((f) => ({ ...f, total_flight_hours: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-on-surface-variant">
              Enrollment Progress (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
              value={form.enrollment_progress ?? 0}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  enrollment_progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                }))
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-on-surface-variant">Notes</label>
            <textarea
              rows={4}
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
              value={form.notes ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
            />
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-error/20 bg-error-container/10 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-error">
              Danger Zone
            </p>
            <p className="mb-3 text-xs text-on-surface-variant">
              Permanently remove this student from the roster. This action cannot be undone.
            </p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg border border-error/40 px-4 py-2 text-xs font-bold text-error transition-colors hover:bg-error/10 disabled:opacity-60"
            >
              {deleting ? "Removing..." : "Remove Student"}
            </button>
          </div>
        </div>

        <div className="flex gap-3 border-t border-outline-variant/10 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-outline-variant/30 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg py-2.5 text-sm font-bold text-white aviation-gradient disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Student Card ----------

function StudentCard({
  student,
  onCardClick,
  onSuggestLesson,
  onSendReminder,
}: {
  student: Student;
  onCardClick: (s: Student) => void;
  onSuggestLesson: (s: Student) => void;
  onSendReminder: (s: Student) => void;
}) {
  const progressBar = getProgressBar(student.enrollment_progress);

  return (
    <div
      className="group cursor-pointer rounded-xl border border-outline-variant/5 bg-surface-container-lowest p-6 transition-all duration-300 hover:shadow-lg"
      onClick={() => onCardClick(student)}
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
            getStatusClass(student.status)
          )}
        >
          {student.status}
        </span>
      </div>

      <div className="space-y-4">
        <div className="mb-1 flex justify-between text-xs font-bold text-on-surface-variant">
          <span>Syllabus Progress</span>
          <span>{student.enrollment_progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-low">
          <div
            className={cn("h-full rounded-full", progressBar.className)}
            style={{ width: `${student.enrollment_progress}%`, ...progressBar.style }}
          />
        </div>
        <div className="flex gap-4 pt-2 text-xs font-medium text-on-surface-variant">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base">schedule</span>
            {student.total_flight_hours} hrs
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base">event</span>
            Last fly: {formatLastFly(student.last_flight_at)}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          className="rounded-lg border border-outline-variant/30 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/5"
          onClick={(e) => {
            e.stopPropagation();
            onSuggestLesson(student);
          }}
        >
          Suggest Lesson
        </button>
        <button
          className="rounded-lg bg-surface-container-high py-2 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-highest"
          onClick={(e) => {
            e.stopPropagation();
            onSendReminder(student);
          }}
        >
          Send Reminder
        </button>
      </div>
    </div>
  );
}

// ---------- Main Page ----------

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/students?operator_id=1");
      const json = await res.json();
      setStudents((json.data as Student[]) ?? []);
    } catch {
      // silently fail — empty list shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Stats
  const activeCount = students.filter(
    (s) => s.status === "ACTIVE" || s.status === "ON TRACK"
  ).length;
  const awaitingCheckride = students.filter((s) => s.enrollment_progress >= 90).length;
  const totalHoursMTD = students.reduce((acc, s) => acc + (s.total_flight_hours ?? 0), 0);

  const STATS = [
    {
      label: "Total Active Students",
      value: String(activeCount).padStart(2, "0"),
      trend: `${activeCount} active / on track`,
      trendIcon: "trending_up",
      trendColor: "text-tertiary",
      icon: "person_play",
      iconBg: "bg-tertiary/10",
      iconColor: "text-tertiary",
    },
    {
      label: "Awaiting Checkride",
      value: String(awaitingCheckride).padStart(2, "0"),
      trend: "≥90% syllabus complete",
      trendIcon: "schedule",
      trendColor: "text-primary",
      icon: "verified",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "Flight Hours MTD",
      value: totalHoursMTD.toFixed(1),
      trend: "Sum of all student hours",
      trendIcon: "timer",
      trendColor: "text-on-secondary-container",
      icon: "flight_takeoff",
      iconBg: "bg-secondary-container",
      iconColor: "text-on-secondary-container",
    },
  ];

  async function handleSuggestLesson(student: Student) {
    try {
      await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operator_id: "1",
          type: "next_lesson",
          status: "pending",
          priority: 5,
          student_id: student.id,
          student_name: student.name,
          rationale: `Next lesson suggested for ${student.name}`,
          context: {},
          trigger_event: {},
          alternatives: [],
        }),
      });
    } catch {
      // best effort
    }
    showToast(`Lesson suggestion created for ${student.name}.`);
  }

  async function handleSendReminder(student: Student) {
    try {
      await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operator_id: "1",
          event_type: "notification_sent",
          entity_type: "student",
          entity_id: student.id,
          actor_type: "system",
          payload: { student_name: student.name, channel: "reminder" },
        }),
      }).catch(() => null); // activity POST may not exist yet; ignore
    } catch {
      // best effort
    }
    showToast(`Reminder sent to ${student.name}.`);
  }

  function handleStudentAdded(s: Student) {
    setStudents((prev) => [...prev, s]);
    showToast(`${s.name} added to the roster.`);
  }

  function handleStudentUpdated(s: Student) {
    setStudents((prev) => prev.map((x) => (x.id === s.id ? s : x)));
  }

  function handleStudentDeleted(id: string) {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  }

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
                  {loading ? "—" : stat.value}
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
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white shadow-md shadow-primary/20 aviation-gradient"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              Add Student
            </button>
          </div>
        </div>

        {/* Student Cards */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
              <span className="ml-3 text-sm font-medium">Loading students…</span>
            </div>
          ) : (
            students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onCardClick={setDetailStudent}
                onSuggestLesson={handleSuggestLesson}
                onSendReminder={handleSendReminder}
              />
            ))
          )}

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
            <button
              onClick={() => setShowAdd(true)}
              className="text-xs font-bold text-primary hover:underline"
            >
              Launch Onboarding Wizard
            </button>
          </div>
        </section>
      </div>

      {/* Modals */}
      <AddStudentModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={handleStudentAdded}
      />

      <StudentDetailPanel
        student={detailStudent}
        onClose={() => setDetailStudent(null)}
        onUpdated={handleStudentUpdated}
        onDeleted={handleStudentDeleted}
        onToast={showToast}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
