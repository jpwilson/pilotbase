import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov"],
      include: [
        "src/lib/engine/ranker.ts",
        "src/lib/engine/constraints.ts",
        "src/lib/engine/explainer.ts",
        "src/lib/engine/waitlist.ts",
        "src/lib/engine/reschedule.ts",
        "src/lib/engine/discovery.ts",
        "src/lib/engine/next-lesson.ts",
        "src/lib/utils/dates.ts",
        "src/lib/utils/feature-flags.ts",
        "src/lib/notifications/templates.ts",
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
