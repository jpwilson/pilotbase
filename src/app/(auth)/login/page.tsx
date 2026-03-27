"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_ACCOUNTS = [
  {
    label: "Admin — Capt. Miller (Chief Instructor)",
    role: "admin",
    email: "capt.miller@pilotbase.demo",
    password: "demo-admin",
  },
  {
    label: "Student — Alex Rivera (PPL Student)",
    role: "student",
    email: "alex.rivera@pilotbase.demo",
    password: "demo-student",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(0);
  const [email, setEmail] = useState(DEMO_ACCOUNTS[0].email);
  const [password, setPassword] = useState(DEMO_ACCOUNTS[0].password);

  const handleAccountChange = (index: number) => {
    setSelectedAccount(index);
    setEmail(DEMO_ACCOUNTS[index].email);
    setPassword(DEMO_ACCOUNTS[index].password);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Set role cookie for the demo
    const account = DEMO_ACCOUNTS[selectedAccount];
    document.cookie = `demo_role=${account.role}; path=/; max-age=${60 * 60 * 24 * 30}`;
    document.cookie = `demo_email=${account.email}; path=/; max-age=${60 * 60 * 24 * 30}`;

    setTimeout(() => {
      router.push("/queue");
    }, 600);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full aviation-gradient opacity-5" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-tertiary opacity-5" />
      </div>

      <div className="relative w-full max-w-md space-y-8 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-10 shadow-2xl">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl aviation-gradient shadow-lg shadow-primary/20">
            <span
              className="material-symbols-outlined text-3xl text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              flight_takeoff
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight font-headline text-on-surface">
            PilotBase
          </h1>
          <p className="text-sm text-on-surface-variant">Flight Operations Center</p>
        </div>

        {/* Demo Account Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Quick Demo Login
          </label>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((account, i) => (
              <button
                key={account.role}
                type="button"
                onClick={() => handleAccountChange(i)}
                className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                  selectedAccount === i
                    ? "border-primary bg-primary-fixed/20 shadow-sm"
                    : "border-outline-variant/20 bg-surface hover:border-outline-variant/40"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    account.role === "admin"
                      ? "aviation-gradient text-white"
                      : "bg-tertiary-container/30 text-tertiary"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {account.role === "admin" ? "admin_panel_settings" : "school"}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-on-surface">{account.label}</p>
                  <p className="text-xs text-on-surface-variant">{account.email}</p>
                </div>
                {selectedAccount === i && (
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border-none bg-surface p-3 text-sm font-medium focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border-none bg-surface p-3 text-sm font-medium focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 aviation-gradient transition-all hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Signing in...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">login</span>
                Sign In to Operations
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] uppercase tracking-wider text-on-surface-variant/60">
          Demo Mode — FSP auth integration pending
        </p>
      </div>
    </div>
  );
}
