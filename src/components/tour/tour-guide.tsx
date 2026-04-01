"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface TourStep {
  title: string;
  body: string;
  page: string;
  icon: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to PilotBase!",
    body: "PilotBase is an AI scheduling assistant for flight schools. It watches the schedule, spots opportunities, and makes smart suggestions — so instructors don't have to juggle spreadsheets.\n\nLet's walk through how it works!",
    page: "/queue",
    icon: "flight_takeoff",
  },
  {
    title: "The Approval Queue",
    body: "This is mission control. When the AI spots a scheduling opportunity, it creates a suggestion that lands here.\n\nThere are 4 types:\n\u2022 Waitlist — an open slot matched to a waiting student\n\u2022 Cancellation — someone cancelled, here's a reschedule option\n\u2022 Next Lesson — a student just finished a lesson, here's what to book next\n\u2022 Discovery — a prospect wants a trial flight\n\nYou approve or decline each one. The AI explains its reasoning so you can decide quickly.",
    page: "/queue",
    icon: "pending_actions",
  },
  {
    title: "Activity Feed",
    body: "The activity feed is your audit trail — every action the AI takes gets logged here.\n\nYou can see when suggestions were created, who approved or declined them, when reservations were booked in the flight school's system, and when notifications were sent to students.\n\nThink of it as a black box recorder for your scheduling operations.",
    page: "/activity",
    icon: "rss_feed",
  },
  {
    title: "Student Roster",
    body: "This shows all enrolled students with their training progress.\n\nEach card shows their program (Private Pilot, Instrument Rating, etc.), how far along they are, total flight hours, and when they last flew.\n\nThe AI uses this data to make smarter suggestions — like prioritizing students who haven't flown in a while or who are close to a checkride.",
    page: "/students",
    icon: "group",
  },
  {
    title: "Settings & Configuration",
    body: "This is where you tune the AI's behavior.\n\n\u2022 Priority Weights — tell the AI what matters most (recency? progress? waitlist position?)\n\u2022 Search Windows — how far ahead to look for available slots\n\u2022 Feature Toggles — turn each scheduling engine on or off\n\u2022 Daylight Only — safety rule restricting solo flights to daylight hours\n\nEvery flight school is different, so these settings let you customize the AI to match your operations.",
    page: "/settings",
    icon: "settings",
  },
  {
    title: "You're all set!",
    body: "That's PilotBase in a nutshell:\n\n1. The AI monitors the schedule and spots opportunities\n2. It creates suggestions with clear reasoning\n3. Instructors review and approve in the queue\n4. Bookings are made automatically in Flight Schedule Pro\n5. Everything is logged for compliance\n\nThe goal: less time juggling schedules, more time flying. Click the agent button anytime to retake this tour!",
    page: "/queue",
    icon: "check_circle",
  },
];

export function TourGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  // Auto-show on first visit
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("pilotbase_tour_seen");
    if (!hasSeenTour) {
      setIsOpen(true);
      setIsTourActive(true);
      localStorage.setItem("pilotbase_tour_seen", "true");
    }
  }, []);

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const goToStep = (idx: number) => {
    setCurrentStep(idx);
    const targetPage = TOUR_STEPS[idx].page;
    if (pathname !== targetPage) {
      router.push(targetPage);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      setIsTourActive(false);
      setIsOpen(false);
    } else {
      goToStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      goToStep(currentStep - 1);
    }
  };

  const startTour = () => {
    setCurrentStep(0);
    setIsTourActive(true);
    setIsOpen(true);
    const targetPage = TOUR_STEPS[0].page;
    if (pathname !== targetPage) {
      router.push(targetPage);
    }
  };

  const handleFloatingButtonClick = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };

  return (
    <>
      {/* Floating Agent Button — always visible */}
      <button
        onClick={handleFloatingButtonClick}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full aviation-gradient text-white shadow-2xl transition-all hover:scale-105 active:scale-95",
          isOpen && "opacity-70"
        )}
      >
        <span
          className="material-symbols-outlined text-3xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          assistant
        </span>
        {/* Pulsing orange dot when tour is active and panel is closed */}
        {isTourActive && !isOpen && (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-orange-400 border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between aviation-gradient px-5 py-4">
            <div className="flex items-center gap-3">
              <span
                className="material-symbols-outlined text-white"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                assistant
              </span>
              <div>
                <h3 className="text-sm font-bold text-white font-headline">PilotBase Agent</h3>
                <p className="text-[10px] text-white/70">
                  {isTourActive
                    ? `Step ${currentStep + 1} of ${TOUR_STEPS.length}`
                    : "Your scheduling copilot"}
                </p>
              </div>
            </div>
            {/* X only closes the panel — tour state is preserved */}
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {isTourActive ? (
            /* Tour content */
            <div className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                  <span className="material-symbols-outlined">{step.icon}</span>
                </div>
                <h4 className="text-lg font-bold font-headline text-on-surface">{step.title}</h4>
              </div>
              <div className="mb-6 whitespace-pre-line text-sm leading-relaxed text-on-surface-variant">
                {step.body}
              </div>

              {/* Progress dots */}
              <div className="mb-5 flex justify-center gap-2">
                {TOUR_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToStep(i)}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      i === currentStep
                        ? "w-6 bg-primary"
                        : i < currentStep
                          ? "w-2 bg-primary/40"
                          : "w-2 bg-surface-container-highest"
                    )}
                  />
                ))}
              </div>

              {/* Nav buttons */}
              <div className="flex gap-3">
                {!isFirstStep && (
                  <button
                    onClick={handlePrev}
                    className="flex-1 rounded-lg border border-outline-variant/30 py-2.5 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low"
                  >
                    Previous
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex-1 rounded-lg py-2.5 text-xs font-bold text-white aviation-gradient transition-all"
                >
                  {isLastStep ? "Finish Tour" : "Next"}
                </button>
              </div>

              {/* End tour link */}
              <button
                onClick={() => { setIsTourActive(false); }}
                className="w-full text-center text-xs text-on-surface-variant/60 hover:text-on-surface-variant mt-2 transition-colors"
              >
                End tour
              </button>
            </div>
          ) : (
            /* Agent menu */
            <div className="p-5">
              <p className="mb-4 text-sm text-on-surface-variant">
                I&apos;m your PilotBase scheduling assistant. How can I help?
              </p>
              <div className="space-y-2">
                <button
                  onClick={startTour}
                  className="flex w-full items-center gap-3 rounded-xl bg-surface-container-low p-4 text-left transition-all hover:bg-surface-container-high"
                >
                  <span className="material-symbols-outlined text-primary">tour</span>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Take the Tour</p>
                    <p className="text-xs text-on-surface-variant">
                      Walk through every feature step by step
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => router.push("/queue")}
                  className="flex w-full items-center gap-3 rounded-xl bg-surface-container-low p-4 text-left transition-all hover:bg-surface-container-high"
                >
                  <span className="material-symbols-outlined text-primary">pending_actions</span>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Go to Approval Queue</p>
                    <p className="text-xs text-on-surface-variant">
                      Review pending scheduling suggestions
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => router.push("/settings")}
                  className="flex w-full items-center gap-3 rounded-xl bg-surface-container-low p-4 text-left transition-all hover:bg-surface-container-high"
                >
                  <span className="material-symbols-outlined text-primary">tune</span>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Configure AI Behavior</p>
                    <p className="text-xs text-on-surface-variant">
                      Adjust priority weights and scheduling rules
                    </p>
                  </div>
                </button>
              </div>
              <p className="mt-4 text-center text-[10px] text-on-surface-variant/50 uppercase tracking-wider">
                PilotBase v1.0 — Demo Mode
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
