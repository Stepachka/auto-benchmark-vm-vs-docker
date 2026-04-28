import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  BenchmarkMode,
  BenchmarkRunStatus,
  EnvironmentType,
} from '../entities/benchmark-run.entity';

export class CreateBenchmarkRunDto {
  @IsEnum(EnvironmentType)
  environmentType!: EnvironmentType;

  @IsEnum(BenchmarkMode)
  @IsOptional()
  mode?: BenchmarkMode;

  @IsEnum(BenchmarkMode)
  @IsOptional()
  benchmarkMode?: BenchmarkMode;

  @IsEnum(BenchmarkRunStatus)
  @IsOptional()
  status?: BenchmarkRunStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  timeToProvisionSeconds?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  scalingTimeSeconds?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  rps?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  latencyMs?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cpuOverheadPercent?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  leadTimeSeconds?: number;

  @IsString()
  @IsOptional()
  targetUrl?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  vus?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  durationSeconds?: number;

  @IsString()
  @IsOptional()
  dockerImage?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  scalingContainers?: number;

  @IsString()
  @IsOptional()
  recommendation?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
