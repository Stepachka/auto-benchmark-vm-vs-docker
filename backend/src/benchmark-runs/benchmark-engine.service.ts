import { Injectable } from '@nestjs/common';
import {
  BenchmarkMode,
  EnvironmentType,
} from './entities/benchmark-run.entity';
import { BenchmarkMetrics, BenchmarkStrategy } from './benchmark-engine.types';
import { DemoBenchmarkService } from './demo-benchmark.service';
import { RealBenchmarkService } from './real-benchmark.service';

@Injectable()
export class BenchmarkEngineService {
  private readonly strategies: BenchmarkStrategy[];

  constructor(
    demoBenchmarkService: DemoBenchmarkService,
    realBenchmarkService: RealBenchmarkService,
  ) {
    this.strategies = [demoBenchmarkService, realBenchmarkService];
  }

  execute(
    environmentType: EnvironmentType,
    benchmarkMode = BenchmarkMode.Demo,
    options: {
      targetUrl?: string;
      vus?: number;
      durationSeconds?: number;
      dockerImage?: string;
      scalingContainers?: number;
    } = {},
  ): Promise<BenchmarkMetrics> {
    const strategy = this.strategies.find(
      (candidate) => candidate.benchmarkMode === benchmarkMode,
    );

    if (!strategy) {
      throw new Error(`Unsupported benchmark mode: ${benchmarkMode}`);
    }

    return strategy.execute({ environmentType, benchmarkMode, ...options });
  }
}
