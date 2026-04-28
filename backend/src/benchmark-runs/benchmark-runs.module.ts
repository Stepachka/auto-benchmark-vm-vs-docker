import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BenchmarkEngineService } from './benchmark-engine.service';
import { BenchmarkRunsController } from './benchmark-runs.controller';
import { BenchmarkRunsService } from './benchmark-runs.service';
import { DemoBenchmarkService } from './demo-benchmark.service';
import { BenchmarkRun } from './entities/benchmark-run.entity';
import { RealBenchmarkService } from './real-benchmark.service';
import { RecommendationService } from './recommendation.service';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

@Module({
  imports: [TypeOrmModule.forFeature([BenchmarkRun]), InfrastructureModule],
  controllers: [BenchmarkRunsController],
  providers: [
    BenchmarkRunsService,
    BenchmarkEngineService,
    DemoBenchmarkService,
    RealBenchmarkService,
    RecommendationService,
  ],
})
export class BenchmarkRunsModule {}
