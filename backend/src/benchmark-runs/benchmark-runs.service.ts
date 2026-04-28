import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BenchmarkEngineService } from './benchmark-engine.service';
import { CreateBenchmarkRunDto } from './dto/create-benchmark-run.dto';
import {
  BenchmarkMode,
  BenchmarkRun,
  BenchmarkRunStatus,
} from './entities/benchmark-run.entity';
import { RecommendationService } from './recommendation.service';

@Injectable()
export class BenchmarkRunsService {
  constructor(
    @InjectRepository(BenchmarkRun)
    private readonly benchmarkRunsRepository: Repository<BenchmarkRun>,
    private readonly benchmarkEngineService: BenchmarkEngineService,
    private readonly recommendationService: RecommendationService,
  ) {}

  async findAll() {
    const benchmarkRuns = await this.benchmarkRunsRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    return benchmarkRuns.map((benchmarkRun) =>
      this.withCompatibility(benchmarkRun),
    );
  }

  async findOne(id: string) {
    const benchmarkRun = await this.benchmarkRunsRepository.findOneBy({ id });

    if (!benchmarkRun) {
      throw new NotFoundException(`Benchmark run ${id} not found`);
    }

    return this.withCompatibility(benchmarkRun);
  }

  async create(createBenchmarkRunDto: CreateBenchmarkRunDto) {
    const benchmarkMode =
      createBenchmarkRunDto.benchmarkMode ??
      createBenchmarkRunDto.mode ??
      BenchmarkMode.Demo;
    const benchmarkRun = await this.benchmarkRunsRepository.save(
      this.benchmarkRunsRepository.create({
        ...createBenchmarkRunDto,
        benchmarkMode,
        status: BenchmarkRunStatus.Pending,
        timeToProvisionSeconds:
          createBenchmarkRunDto.timeToProvisionSeconds ?? 0,
        scalingTimeSeconds: createBenchmarkRunDto.scalingTimeSeconds ?? 0,
        rps: createBenchmarkRunDto.rps ?? 0,
        latencyMs: createBenchmarkRunDto.latencyMs ?? 0,
        cpuOverheadPercent: createBenchmarkRunDto.cpuOverheadPercent ?? 0,
        leadTimeSeconds: createBenchmarkRunDto.leadTimeSeconds ?? 0,
        targetUrl: createBenchmarkRunDto.targetUrl,
        vus: createBenchmarkRunDto.vus ?? 1,
        durationSeconds: createBenchmarkRunDto.durationSeconds ?? 10,
        dockerImage: createBenchmarkRunDto.dockerImage,
        scalingContainers: createBenchmarkRunDto.scalingContainers ?? 3,
      }),
    );

    await this.benchmarkRunsRepository.update(benchmarkRun.id, {
      status: BenchmarkRunStatus.Running,
    });

    try {
      const metrics = await this.benchmarkEngineService.execute(
        benchmarkRun.environmentType,
        benchmarkMode,
        {
          targetUrl: createBenchmarkRunDto.targetUrl,
          vus: createBenchmarkRunDto.vus,
          durationSeconds: createBenchmarkRunDto.durationSeconds,
          dockerImage: createBenchmarkRunDto.dockerImage,
          scalingContainers: createBenchmarkRunDto.scalingContainers,
        },
      );
      const recommendation =
        createBenchmarkRunDto.recommendation ??
        this.recommendationService.build(benchmarkRun.environmentType, metrics);
      const { warnings, ...persistedMetrics } = metrics;
      const notes = [
        createBenchmarkRunDto.notes,
        ...(warnings ?? []),
      ]
        .filter(Boolean)
        .join(' ');

      await this.benchmarkRunsRepository.update(benchmarkRun.id, {
        ...persistedMetrics,
        recommendation,
        notes: notes || undefined,
        status: BenchmarkRunStatus.Completed,
      });
    } catch (error) {
      await this.benchmarkRunsRepository.update(benchmarkRun.id, {
        status: BenchmarkRunStatus.Failed,
        notes:
          error instanceof Error
            ? error.message
            : 'Benchmark execution failed unexpectedly',
      });
    }

    return this.findOne(benchmarkRun.id);
  }

  private withCompatibility(benchmarkRun: BenchmarkRun) {
    return {
      ...benchmarkRun,
      mode: benchmarkRun.benchmarkMode,
    };
  }
}
