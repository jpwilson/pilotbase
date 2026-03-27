"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils/cn";

interface DiscoveryRequest {
  id: string;
  operator_id: string;
  prospect_name: string;
  prospect_email: string | null;
  prospect_phone: string | null;
  preferred_dates: string[];
  notes: string | null;
  status: "pending" | "scheduled" | "cancelled";
  suggestion_id: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-primary-fixed text-on-primary-fixed-variant",
  scheduled: "bg-tertiary-container/30 text-on-tertiary-container",
  cancelled: "bg-surface-container-high text-secondary",
};

export default function DiscoveryPage() {
  const [requests, setRequests] = useState<DiscoveryRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    prospectName: "",
    prospectEmail: "",
    prospectPhone: "",
    notes: "",
    locationId: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const res = await fetch("/api/discovery");
      const { data } = await res.json();
      setRequests(data || []);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setShowForm(false);
      setFormData({
        prospectName: "",
        prospectEmail: "",
        prospectPhone: "",
        notes: "",
        locationId: 1,
      });
      await fetchRequests();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <Header title="Discovery Flights" badge={`${requests.length} Requests`} />
      <div className="mx-auto max-w-5xl space-y-8 p-8">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">
              Prospect Flights
            </h3>
            <p className="mt-1 text-on-surface-variant">
              Manage discovery flight requests for prospective students.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white shadow-md shadow-primary/20 aviation-gradient"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New Request
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl bg-surface-container-lowest p-6"
          >
            <div>
              <label className="text-sm font-bold tracking-wide text-on-surface">
                PROSPECT NAME
              </label>
              <input
                type="text"
                required
                value={formData.prospectName}
                onChange={(e) => setFormData({ ...formData, prospectName: e.target.value })}
                className="mt-1 w-full rounded-lg border-none bg-surface p-3 text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold tracking-wide text-on-surface">EMAIL</label>
                <input
                  type="email"
                  value={formData.prospectEmail}
                  onChange={(e) => setFormData({ ...formData, prospectEmail: e.target.value })}
                  className="mt-1 w-full rounded-lg border-none bg-surface p-3 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-bold tracking-wide text-on-surface">PHONE</label>
                <input
                  type="tel"
                  value={formData.prospectPhone}
                  onChange={(e) => setFormData({ ...formData, prospectPhone: e.target.value })}
                  className="mt-1 w-full rounded-lg border-none bg-surface p-3 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-bold tracking-wide text-on-surface">NOTES</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border-none bg-surface p-3 text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg px-6 py-2.5 text-sm font-bold text-white aviation-gradient disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-outline-variant/30 px-6 py-2.5 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/50 p-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-low shadow-sm">
              <span className="material-symbols-outlined text-outline">flight</span>
            </div>
            <p className="font-bold text-on-surface">No discovery flight requests</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Create a new request to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="group flex items-center gap-6 rounded-xl bg-surface-container-lowest p-5 transition-all duration-300 hover:bg-surface-bright hover:shadow-[0px_12px_32px_rgba(25,28,30,0.06)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed/30 text-primary">
                  <span className="material-symbols-outlined">flight</span>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <h5 className="text-base font-bold text-on-surface">{req.prospect_name}</h5>
                  </div>
                  <div className="mt-0.5 text-xs text-on-surface-variant">
                    {req.prospect_email}
                    {req.prospect_email && req.prospect_phone && " · "}
                    {req.prospect_phone}
                  </div>
                </div>
                <span className="text-xs text-on-surface-variant">
                  {new Date(req.created_at).toLocaleDateString()}
                </span>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[10px] font-black uppercase",
                    STATUS_STYLES[req.status]
                  )}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
