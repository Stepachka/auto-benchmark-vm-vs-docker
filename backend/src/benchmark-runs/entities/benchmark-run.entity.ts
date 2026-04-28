import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum EnvironmentType {
  Vm = 'vm',
  Docker = 'docker',
}

export enum BenchmarkRunStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

export enum BenchmarkMode {
  Demo = 'demo',
  Real = 'real',
}

@Entity({ name: 'benchmark_runs' })
export class BenchmarkRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({
    name: 'environment_type',
    type: 'enum',
    enum: EnvironmentType,
  })
  environmentType!: EnvironmentType;

  @Column({
    type: 'enum',
    enum: BenchmarkRunStatus,
    default: BenchmarkRunStatus.Pending,
  })
  status!: BenchmarkRunStatus;

  @Column({
    name: 'benchmark_mode',
    type: 'enum',
    enum: BenchmarkMode,
    default: BenchmarkMode.Demo,
  })
  benchmarkMode!: BenchmarkMode;

  mode?: BenchmarkMode;

  @Column({
    name: 'time_to_provision_seconds',
    type: 'double precision',
    default: 0,
  })
  timeToProvisionSeconds!: number;

  @Column({ name: 'scaling_time_seconds', type: 'double precision', default: 0 })
  scalingTimeSeconds!: number;

  @Column({ type: 'double precision', default: 0 })
  rps!: number;

  @Column({ name: 'latency_ms', type: 'double precision', default: 0 })
  latencyMs!: number;

  @Column({
    name: 'cpu_overhead_percent',
    type: 'double precision',
    default: 0,
  })
  cpuOverheadPercent!: number;

  @Column({ name: 'lead_time_seconds', type: 'double precision', default: 0 })
  leadTimeSeconds!: number;

  @Column({ name: 'target_url', type: 'text', nullable: true })
  targetUrl?: string;

  @Column({ type: 'integer', default: 1 })
  vus!: number;

  @Column({ name: 'duration_seconds', type: 'integer', default: 10 })
  durationSeconds!: number;

  @Column({ name: 'docker_image', type: 'text', nullable: true })
  dockerImage?: string;

  @Column({ name: 'scaling_containers', type: 'integer', default: 3 })
  scalingContainers!: number;

  @Column({ name: 'startup_time_seconds', type: 'double precision', default: 0 })
  startupTimeSeconds!: number;

  @Column({ name: 'restart_time_seconds', type: 'double precision', default: 0 })
  restartTimeSeconds!: number;

  @Column({ name: 'requests_per_second', type: 'double precision', default: 0 })
  requestsPerSecond!: number;

  @Column({ name: 'avg_latency_ms', type: 'double precision', default: 0 })
  avgLatencyMs!: number;

  @Column({ name: 'p95_latency_ms', type: 'double precision', default: 0 })
  p95LatencyMs!: number;

  @Column({ name: 'error_rate_percent', type: 'double precision', default: 0 })
  errorRatePercent!: number;

  @Column({ name: 'total_requests', type: 'integer', default: 0 })
  totalRequests!: number;

  @Column({ type: 'text', nullable: true })
  recommendation?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
