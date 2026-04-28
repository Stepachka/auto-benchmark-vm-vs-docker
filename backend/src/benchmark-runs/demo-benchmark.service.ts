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

@Injectable()
export class DemoBenchmarkService implements BenchmarkStrategy {
  readonly benchmarkMode = BenchmarkMode.Demo;

  async execute(input: BenchmarkExecutionInput): Promise<BenchmarkMetrics> {
    return input.environmentType === EnvironmentType.Docker
      ? this.generateDockerMetrics()
      : this.generateVmMetrics();
  }

  private generateDockerMetrics(): BenchmarkMetrics {
    return {
      timeToProvisionSeconds: this.random(28, 55),
      leadTimeSeconds: this.random(75, 125),
      scalingTimeSeconds: this.random(18, 36),
      rps: this.random(820, 960),
      latencyMs: this.random(95, 135),
      cpuOverheadPercent: this.random(12, 20),
    };
  }

  private generateVmMetrics(): BenchmarkMetrics {
    return {
      timeToProvisionSeconds: this.random(95, 170),
      leadTimeSeconds: this.random(55, 100),
      scalingTimeSeconds: this.random(55, 95),
      rps: this.random(800, 930),
      latencyMs: this.random(90, 130),
      cpuOverheadPercent: this.random(4, 10),
    };
  }

  private random(min: number, max: number) {
    return Number((Math.random() * (max - min) + min).toFixed(1));
  }
}

