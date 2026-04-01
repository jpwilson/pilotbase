import { weightedPriorityStrategy } from "./weighted-priority";
import { edfStrategy } from "./edf";
import { fifoStrategy } from "./fifo";
import { balancedUtilizationStrategy } from "./balanced-utilization";
import type { SimStrategy } from "../types";

export const STRATEGIES: SimStrategy[] = [
  weightedPriorityStrategy,
  edfStrategy,
  fifoStrategy,
  balancedUtilizationStrategy,
];

export type { SimStrategy };
