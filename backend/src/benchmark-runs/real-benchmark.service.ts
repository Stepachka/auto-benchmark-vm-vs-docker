import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { Injectable } from '@nestjs/common';
import {
  BenchmarkExecutionInput,
  BenchmarkMetrics,
  BenchmarkStrategy,
} from './benchmark-engine.types';
import {
  BenchmarkMode,
  EnvironmentType,
} from './entities/benchmark-run.entity';
import { DockerRuntimeMetricsService } from '../infrastructure/docker-runtime-metrics.service';

const execFileAsync = promisify(execFile);

type K6Summary = {
  metrics?: Record<
    string,
    {
      values?: Record<string, number>;
      [key: string]: number | Record<string, number> | undefined;
    }
  >;
};

@Injectable()
export class RealBenchmarkService implements BenchmarkStrategy {
  readonly benchmarkMode = BenchmarkMode.Real;

  constructor(
    private readonly dockerRuntimeMetricsService: DockerRuntimeMetricsService,
  ) {}

  async execute(input: BenchmarkExecutionInput): Promise<BenchmarkMetrics> {
    if (!input.targetUrl) {
      throw new Error('Real benchmark mode requires targetUrl.');
    }

    const durationSeconds = input.durationSeconds ?? 10;
    const vus = input.vus ?? 1;
    const workdir = await mkdtemp(join(tmpdir(), 'k6-benchmark-'));
    const scriptPath = join(workdir, 'benchmark.js');
    const summaryPath = join(workdir, 'summary.json');

    try {
      await writeFile(scriptPath, this.createScript(vus, durationSeconds));
      await this.runK6(scriptPath, summaryPath, input.targetUrl, durationSeconds);

      const summary = JSON.parse(
        await readFile(summaryPath, 'utf8'),
      ) as K6Summary;

      const k6Metrics = this.mapSummary(summary);

      if (input.environmentType !== EnvironmentType.Docker) {
        return k6Metrics;
      }

      const dockerMetrics = await this.dockerRuntimeMetricsService.measure({
        image: input.dockerImage,
        scalingContainers: input.scalingContainers,
      });

      return {
        ...k6Metrics,
        startupTimeSeconds: dockerMetrics.startupTimeSeconds,
        restartTimeSeconds: dockerMetrics.restartTimeSeconds,
        scalingTimeSeconds: dockerMetrics.scalingTimeSeconds,
        warnings: dockerMetrics.warnings,
      };
    } finally {
      await rm(workdir, { recursive: true, force: true });
    }
  }

  private createScript(vus: number, durationSeconds: number) {
    return `
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: ${vus},
  duration: '${durationSeconds}s',
};

export default function () {
  const response = http.get(__ENV.TARGET_URL);
  check(response, {
    'status is below 500': (result) => result.status < 500,
  });
}
`;
  }

  private async runK6(
    scriptPath: string,
    summaryPath: string,
    targetUrl: string,
    durationSeconds: number,
  ) {
    try {
      await execFileAsync(
        'k6',
        ['run', '--summary-export', summaryPath, scriptPath],
        {
          env: {
            ...process.env,
            TARGET_URL: targetUrl,
          },
          timeout: (durationSeconds + 30) * 1000,
          maxBuffer: 1024 * 1024,
        },
      );
    } catch (error) {
      if (this.isMissingExecutable(error)) {
        throw new Error(
          'k6 executable not found. Install k6 or use benchmarkMode=demo.',
        );
      }

      throw error;
    }
  }

  private mapSummary(summary: K6Summary): BenchmarkMetrics {
    const requestsPerSecond = this.metric(summary, 'http_reqs', 'rate');
    const avgLatencyMs = this.metric(summary, 'http_req_duration', 'avg');
    const p95LatencyMs = this.metric(summary, 'http_req_duration', 'p(95)');
    const errorRatePercent =
      this.metric(summary, 'http_req_failed', 'rate') * 100;
    const totalRequests = this.metric(summary, 'http_reqs', 'count');

    return {
      timeToProvisionSeconds: 0,
      leadTimeSeconds: 0,
      scalingTimeSeconds: 0,
      rps: requestsPerSecond,
      latencyMs: avgLatencyMs,
      cpuOverheadPercent: 0,
      requestsPerSecond,
      avgLatencyMs,
      p95LatencyMs,
      errorRatePercent,
      totalRequests: Math.round(totalRequests),
    };
  }

  private metric(summary: K6Summary, metricName: string, valueName: string) {
    const metric = summary.metrics?.[metricName];
    const value = metric?.values?.[valueName] ?? metric?.[valueName];

    return typeof value === 'number' ? value : 0;
  }

  private isMissingExecutable(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    );
  }
}
