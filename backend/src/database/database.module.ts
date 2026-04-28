import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BenchmarkRun } from '../benchmark-runs/entities/benchmark-run.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USER', 'benchmark_user'),
        password: configService.get<string>(
          'DATABASE_PASSWORD',
          'benchmark_password',
        ),
        database: configService.get<string>('DATABASE_NAME', 'benchmark_db'),
        entities: [BenchmarkRun],
        synchronize: configService.get<string>('DATABASE_SYNCHRONIZE') === 'true',
      }),
    }),
  ],
})
export class DatabaseModule {}

