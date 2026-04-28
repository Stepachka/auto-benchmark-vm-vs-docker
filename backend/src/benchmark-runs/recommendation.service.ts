import { Injectable } from '@nestjs/common';
import { BenchmarkMetrics } from './benchmark-engine.types';
import { EnvironmentType } from './entities/benchmark-run.entity';

@Injectable()
export class RecommendationService {
  build(environmentType: EnvironmentType, metrics: BenchmarkMetrics) {
    if (environmentType === EnvironmentType.Docker) {
      return this.buildDockerRecommendation(metrics);
    }

    return this.buildVmRecommendation(metrics);
  }

  private buildDockerRecommendation(metrics: BenchmarkMetrics) {
    if (metrics.scalingTimeSeconds < 40 && metrics.cpuOverheadPercent <= 18) {
      return 'Docker is recommended: faster scaling and delivery with acceptable CPU overhead.';
    }

    return 'Docker improves scaling and provisioning, but CPU overhead should be monitored.';
  }

  private buildVmRecommendation(metrics: BenchmarkMetrics) {
    if (metrics.cpuOverheadPercent <= 8 && metrics.latencyMs <= 120) {
      return 'VM is recommended when predictable overhead and simple operation are the priority.';
    }

    return 'VM baseline is stable, but slower provisioning and scaling reduce deployment agility.';
  }
}

