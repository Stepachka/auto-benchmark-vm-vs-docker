import { Module } from '@nestjs/common';
import { DockerRuntimeMetricsService } from './docker-runtime-metrics.service';

@Module({
  providers: [DockerRuntimeMetricsService],
  exports: [DockerRuntimeMetricsService],
})
export class InfrastructureModule {}

