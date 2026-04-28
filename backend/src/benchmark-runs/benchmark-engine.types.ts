import {
  BenchmarkMode,
  EnvironmentType,
} from './entities/benchmark-run.entity';

export type BenchmarkMetrics = {
  timeToProvisionSeconds: number;
  leadTimeSeconds: number;
  scalingTimeSeconds: number;
  rps: number;
  latencyMs: number;
  cpuOverheadPercent: number;
  startupTimeSeconds?: number;
  restartTimeSeconds?: number;
  requestsPerSecond?: number;
  avgLatencyMs?: number;
  p95LatencyMs?: number;
  errorRatePercent?: number;
  totalRequests?: number;
  warnings?: string[];
};

export type BenchmarkExecutionInput = {
  environmentType: EnvironmentType;
  benchmarkMode: BenchmarkMode;
  targetUrl?: string;
  vus?: number;
  durationSeconds?: number;
  dockerImage?: string;
  scalingContainers?: number;
};

export interface BenchmarkStrategy {
  readonly benchmarkMode: BenchmarkMode;
  execute(input: BenchmarkExecutionInput): Promise<BenchmarkMetrics>;
}
