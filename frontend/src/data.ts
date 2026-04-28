import type { BenchmarkMetrics, BenchmarkRun } from './types';

export const defaultMetrics: BenchmarkMetrics = {
  timeToProvisionSeconds: 45,
  scalingTimeSeconds: 42,
  rps: 850,
  latencyMs: 118,
  cpuOverheadPercent: 14,
  leadTimeSeconds: 180,
};

export const sampleRuns: BenchmarkRun[] = [
  {
    id: 'sample-vm',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    environmentType: 'vm',
    status: 'completed',
    timeToProvisionSeconds: 130,
    scalingTimeSeconds: 58,
    rps: 720,
    latencyMs: 145,
    cpuOverheadPercent: 8,
    leadTimeSeconds: 260,
    recommendation: 'VM baseline стабилен, но медленнее подготавливается.',
    notes: 'Базовый запуск',
  },
  {
    id: 'sample-docker',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    environmentType: 'docker',
    status: 'completed',
    timeToProvisionSeconds: 42,
    scalingTimeSeconds: 31,
    rps: 910,
    latencyMs: 104,
    cpuOverheadPercent: 17,
    leadTimeSeconds: 95,
    recommendation: 'Docker быстрее доставляет изменения при умеренной CPU-стоимости.',
    notes: 'Контейнерный запуск',
  },
];
