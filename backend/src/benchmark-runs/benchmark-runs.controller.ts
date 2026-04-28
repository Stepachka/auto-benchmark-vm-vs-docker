import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BenchmarkRunsService } from './benchmark-runs.service';
import { CreateBenchmarkRunDto } from './dto/create-benchmark-run.dto';

@Controller('benchmark-runs')
export class BenchmarkRunsController {
  constructor(private readonly benchmarkRunsService: BenchmarkRunsService) {}

  @Get()
  findAll() {
    return this.benchmarkRunsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.benchmarkRunsService.findOne(id);
  }

  @Post()
  create(@Body() createBenchmarkRunDto: CreateBenchmarkRunDto) {
    return this.benchmarkRunsService.create(createBenchmarkRunDto);
  }
}

