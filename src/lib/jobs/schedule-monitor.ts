import { FSP } from "@/lib/fsp";
import type { FSPScheduleEvent } from "@/lib/fsp/types";
import type { ScheduleSnapshot, ScheduleChange, CancellationTrigger } from "@/lib/engine/types";
import { WaitlistEngine } from "@/lib/engine/waitlist";
import { RescheduleEngine } from "@/lib/engine/reschedule";
import { OperatorConfigService } from "@/lib/engine/config";
import { isFeatureEnabled } from "@/lib/utils/feature-flags";
import { logger } from "@/lib/utils/logger";

// In-memory snapshot store (per operator+location)
// In production, consider Redis or database for persistence across restarts
const snapshotStore = new Map<string, ScheduleSnapshot>();

function snapshotKey(operatorId: string, locationId: number): string {
  return `${operatorId}:${locationId}`;
}

/**
 * Monitor schedule for an operator+location, detecting changes and triggering engines.
 */
export async function monitorSchedule(
  operatorId: string,
  locationId: number
): Promise<{ changes: ScheduleChange[]; suggestionsCreated: number }> {
  logger.info("Running schedule monitor", { operatorId, locationId });

  const configService = new OperatorConfigService(operatorId);
  const config = await configService.get();
  const engineConfig = await configService.getEngineConfig(locationId);

  const fsp = new FSP({
    baseUrl: process.env.FSP_API_BASE_URL!,
    operatorId,
  });

  // 1. Fetch current schedule
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + config.search_window_days);

  const schedule = await fsp.schedule.getSchedule({
    start: now.toISOString().split("T")[0],
    end: endDate.toISOString().split("T")[0],
    locationIds: [locationId],
    outputFormat: "bryntum",
    pageSize: 500,
  });

  const currentEvents = schedule.results.events;

  // 2. Compare to previous snapshot
  const key = snapshotKey(operatorId, locationId);
  const previousSnapshot = snapshotStore.get(key);
  const changes = detectChanges(previousSnapshot?.events || [], currentEvents);

  // 3. Store new snapshot
  snapshotStore.set(key, {
    operatorId,
    locationId,
    capturedAt: now.toISOString(),
    events: currentEvents,
  });

  if (changes.length === 0) {
    logger.info("No schedule changes detected", { operatorId, locationId });
    return { changes: [], suggestionsCreated: 0 };
  }

  logger.info("Schedule changes detected", {
    operatorId,
    locationId,
    cancellations: changes.filter((c) => c.type === "cancellation").length,
  });

  // 4. Process changes
  let suggestionsCreated = 0;

  for (const change of changes) {
    if (change.type === "cancellation") {
      const trigger: CancellationTrigger = {
        type: "cancellation",
        originalReservation: change.event,
        detectedAt: now.toISOString(),
      };

      // Reschedule the affected student
      if (isFeatureEnabled(config.feature_flags, "reschedule")) {
        try {
          const rescheduleEngine = new RescheduleEngine(fsp, engineConfig);
          await rescheduleEngine.processCancellation(trigger);
          suggestionsCreated++;
        } catch (err) {
          logger.error("Reschedule engine failed", { error: String(err) });
        }
      }

      // Fill the opening from waitlist
      if (isFeatureEnabled(config.feature_flags, "waitlist")) {
        try {
          const waitlistEngine = new WaitlistEngine(fsp, engineConfig);
          await waitlistEngine.processOpening(trigger);
          suggestionsCreated++;
        } catch (err) {
          logger.error("Waitlist engine failed", { error: String(err) });
        }
      }
    }
  }

  return { changes, suggestionsCreated };
}

/**
 * Compare two schedule snapshots to detect changes.
 */
function detectChanges(
  previous: FSPScheduleEvent[],
  current: FSPScheduleEvent[]
): ScheduleChange[] {
  const changes: ScheduleChange[] = [];

  // Build lookup by reservation ID
  const currentMap = new Map<string, FSPScheduleEvent>();
  for (const event of current) {
    if (event.ReservationId) {
      currentMap.set(event.ReservationId, event);
    }
  }

  const previousMap = new Map<string, FSPScheduleEvent>();
  for (const event of previous) {
    if (event.ReservationId) {
      previousMap.set(event.ReservationId, event);
    }
  }

  // Detect cancellations (in previous but not in current)
  for (const [id, event] of previousMap) {
    if (!currentMap.has(id)) {
      changes.push({ type: "cancellation", event });
    }
  }

  // Detect new bookings (in current but not in previous)
  for (const [id, event] of currentMap) {
    if (!previousMap.has(id)) {
      changes.push({ type: "new_booking", event });
    }
  }

  return changes;
}
