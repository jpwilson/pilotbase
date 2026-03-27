import { FSP } from "@/lib/fsp";
import { NextLessonEngine } from "@/lib/engine/next-lesson";
import { OperatorConfigService } from "@/lib/engine/config";
import { isFeatureEnabled } from "@/lib/utils/feature-flags";
import { logger } from "@/lib/utils/logger";

/**
 * Check for students with pending lessons and generate scheduling suggestions.
 * Runs periodically (every 15 minutes) to catch completed lessons.
 */
export async function checkCompletions(
  operatorId: string,
  locationId: number
): Promise<{ suggestionsCreated: number }> {
  logger.info("Running completion checker", { operatorId, locationId });

  const configService = new OperatorConfigService(operatorId);
  const config = await configService.get();

  if (!isFeatureEnabled(config.feature_flags, "next_lesson")) {
    logger.info("Next lesson feature disabled for operator", { operatorId });
    return { suggestionsCreated: 0 };
  }

  const engineConfig = await configService.getEngineConfig(locationId);

  const fsp = new FSP({
    baseUrl: process.env.FSP_API_BASE_URL!,
    operatorId,
  });

  const engine = new NextLessonEngine(fsp, engineConfig);
  const suggestionsCreated = await engine.processPendingLessons();

  logger.info("Completion checker finished", { operatorId, suggestionsCreated });
  return { suggestionsCreated };
}
