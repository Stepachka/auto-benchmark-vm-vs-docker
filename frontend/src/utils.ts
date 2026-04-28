import type { BenchmarkRun, EnvironmentType } from './types';

export type ComparisonMetricKey =
  | 'timeToProvisionSeconds'
  | 'scalingTimeSeconds'
  | 'rps'
  | 'latencyMs'
  | 'cpuOverheadPercent'
  | 'leadTimeSeconds';

export type ComparisonRow = {
  label: string;
  key: ComparisonMetricKey;
  unit: string;
  lowerIsBetter: boolean;
};

export type RecommendationResult = {
  title: string;
  summary: string;
  details: string[];
};

export type TrendStatus = 'Improved' | 'Stable' | 'Regressed';

export type TrendMetric = {
  label: string;
  status: TrendStatus;
  delta: string;
};

export type HistoricalTrend = {
  title: string;
  summary: string;
  metrics: TrendMetric[];
};

export function formatNumber(value: number, suffix = '') {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`;
}

export function environmentLabel(environmentType: EnvironmentType) {
  return environmentType === 'vm' ? 'VM' : 'Docker';
}

export function latestRunByEnvironment(
  runs: BenchmarkRun[],
  environmentType: EnvironmentType,
) {
  return runs.find((run) => run.environmentType === environmentType);
}

export function getWinner(
  vmValue: number,
  dockerValue: number,
  lowerIsBetter: boolean,
) {
  if (vmValue === dockerValue) {
    return 'Tie';
  }

  return lowerIsBetter
    ? vmValue < dockerValue
      ? 'VM'
      : 'Docker'
    : vmValue > dockerValue
      ? 'VM'
      : 'Docker';
}

export function getPercentDifference(vmValue: number, dockerValue: number) {
  if (vmValue === 0) {
    return dockerValue === 0 ? '0%' : 'n/a';
  }

  const difference = ((dockerValue - vmValue) / vmValue) * 100;
  const sign = difference > 0 ? '+' : '';

  return `${sign}${difference.toFixed(1)}%`;
}

export function buildRecommendation(runs: BenchmarkRun[]): RecommendationResult {
  const vm = latestRunByEnvironment(runs, 'vm');
  const docker = latestRunByEnvironment(runs, 'docker');

  if (!vm || !docker) {
    return {
      title: 'Ожидание сопоставимых запусков',
      summary:
        'Создайте хотя бы один VM benchmark и один Docker benchmark, чтобы получить рекомендацию.',
      details: [
        vm ? 'Последний VM-запуск доступен.' : 'VM-запуск отсутствует.',
        docker ? 'Последний Docker-запуск доступен.' : 'Docker-запуск отсутствует.',
      ],
    };
  }

  const dockerScalingGain =
    vm.scalingTimeSeconds > 0
      ? ((vm.scalingTimeSeconds - docker.scalingTimeSeconds) /
          vm.scalingTimeSeconds) *
        100
      : 0;
  const dockerProvisionGain =
    vm.timeToProvisionSeconds > 0
      ? ((vm.timeToProvisionSeconds - docker.timeToProvisionSeconds) /
          vm.timeToProvisionSeconds) *
        100
      : 0;
  const dockerRpsDelta =
    vm.rps > 0 ? ((docker.rps - vm.rps) / vm.rps) * 100 : 0;

  if (
    dockerScalingGain > 20 &&
    dockerProvisionGain > 20 &&
    dockerRpsDelta > -8
  ) {
    return {
      title: 'Рекомендуется Docker',
      summary:
        'Docker даёт более быстрое развёртывание и сохраняет пропускную способность близко к VM baseline.',
      details: [
        `Масштабирование быстрее VM на ${dockerScalingGain.toFixed(1)}%.`,
        `Подготовка быстрее VM на ${dockerProvisionGain.toFixed(1)}%.`,
        `Разница RPS относительно VM: ${dockerRpsDelta.toFixed(1)}%.`,
      ],
    };
  }

  if (vm.cpuOverheadPercent < docker.cpuOverheadPercent && vm.latencyMs <= docker.latencyMs) {
    return {
      title: 'Рекомендуется VM',
      summary:
        'VM лучше подходит для этого запуска, если важнее низкий overhead и предсказуемая задержка.',
      details: [
        `CPU overhead VM относительно Docker: ${getPercentDifference(docker.cpuOverheadPercent, vm.cpuOverheadPercent)}.`,
        `Задержка VM относительно Docker: ${getPercentDifference(docker.latencyMs, vm.latencyMs)}.`,
        'Docker стоит выбрать, если приоритетом является скорость доставки.',
      ],
    };
  }

  return {
    title: 'Смешанный результат',
    summary:
      'Нет однозначного лидера. Выбор зависит от того, важнее скорость развёртывания или runtime overhead.',
    details: [
      `Разница Docker по масштабированию: ${getPercentDifference(vm.scalingTimeSeconds, docker.scalingTimeSeconds)}.`,
      `Разница Docker по RPS: ${getPercentDifference(vm.rps, docker.rps)}.`,
      `Разница Docker по CPU overhead: ${getPercentDifference(vm.cpuOverheadPercent, docker.cpuOverheadPercent)}.`,
    ],
  };
}

export function buildHistoricalTrend(runs: BenchmarkRun[]): HistoricalTrend {
  const [latest] = runs;

  if (!latest) {
    return {
      title: 'Нет исторических данных',
      summary: 'Создайте benchmark-запуски, чтобы отслеживать регрессии.',
      metrics: [],
    };
  }

  const previous = runs.find(
    (run) =>
      run.id !== latest.id &&
      run.environmentType === latest.environmentType &&
      (run.benchmarkMode ?? run.mode ?? 'demo') ===
        (latest.benchmarkMode ?? latest.mode ?? 'demo'),
  );

  if (!previous) {
    return {
      title: 'Базовый запуск сохранён',
      summary:
        'Для последнего запуска пока нет предыдущего сопоставимого запуска с той же средой и режимом.',
      metrics: [],
    };
  }

  const metrics: TrendMetric[] = [
    buildTrendMetric('RPS', previous.rps, latest.rps, false),
    buildTrendMetric('Задержка', previous.latencyMs, latest.latencyMs, true),
    buildTrendMetric(
      'Масштабирование',
      previous.scalingTimeSeconds,
      latest.scalingTimeSeconds,
      true,
    ),
  ];
  const regressions = metrics.filter(
    (metric) => metric.status === 'Regressed',
  ).length;

  return {
    title: regressions > 0 ? 'Обнаружена регрессия' : 'Тренд стабилен',
    summary:
      regressions > 0
        ? `Ухудшилось метрик: ${regressions} относительно предыдущего сопоставимого запуска.`
        : 'Последний запуск стабилен или улучшился относительно предыдущего сопоставимого запуска.',
    metrics,
  };
}

function buildTrendMetric(
  label: string,
  previous: number,
  latest: number,
  lowerIsBetter: boolean,
): TrendMetric {
  const deltaPercent = previous === 0 ? 0 : ((latest - previous) / previous) * 100;
  const absDelta = Math.abs(deltaPercent);
  const isImproved = lowerIsBetter ? latest < previous : latest > previous;
  const isRegressed = lowerIsBetter ? latest > previous : latest < previous;
  const status: TrendStatus =
    absDelta < 2 ? 'Stable' : isImproved ? 'Improved' : isRegressed ? 'Regressed' : 'Stable';

  return {
    label,
    status,
    delta: previous === 0 ? 'n/a' : `${deltaPercent > 0 ? '+' : ''}${deltaPercent.toFixed(1)}%`,
  };
}
