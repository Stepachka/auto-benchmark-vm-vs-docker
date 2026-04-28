import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { BenchmarkRunsModule } from './benchmark-runs/benchmark-runs.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, BenchmarkRunsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
