export type EnvironmentType = 'vm' | 'docker';

export type BackendStatus = 'checking' | 'online' | 'offline';

export type BenchmarkMode = 'demo' | 'real';

export type TargetService = 'benchmark-target' | 'custom';

export type BenchmarkMetrics = {
  timeToProvisionSeconds: number;
  scalingTimeSeconds: number;
  rps: number;
  latencyMs: number;
  cpuOverheadPercent: number;
  leadTimeSeconds: number;
};

export type BenchmarkRun = BenchmarkMetrics & {
  id: string;
  createdAt: string;
  environmentType: EnvironmentType;
  status: 'pending' | 'running' | 'completed' | 'failed';
  benchmarkMode?: BenchmarkMode;
  mode?: BenchmarkMode;
  targetUrl?: string;
  vus?: number;
  durationSeconds?: number;
  dockerImage?: string;
  scalingContainers?: number;
  startupTimeSeconds?: number;
  restartTimeSeconds?: number;
  requestsPerSecond?: number;
  avgLatencyMs?: number;
  p95LatencyMs?: number;
  errorRatePercent?: number;
  totalRequests?: number;
  recommendation?: string;
  notes?: string;
};
