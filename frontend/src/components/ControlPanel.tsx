import type {
  BenchmarkMetrics,
  BenchmarkMode,
  EnvironmentType,
  TargetService,
} from '../types';

type ControlPanelProps = {
  benchmarkMode: BenchmarkMode;
  environmentType: EnvironmentType;
  targetService: TargetService;
  customTargetUrl: string;
  durationSeconds: number;
  concurrentUsers: number;
  requests: number;
  metrics: BenchmarkMetrics;
  isSubmitting: boolean;
  onBenchmarkModeChange: (benchmarkMode: BenchmarkMode) => void;
  onEnvironmentChange: (environmentType: EnvironmentType) => void;
  onTargetServiceChange: (targetService: TargetService) => void;
  onCustomTargetUrlChange: (customTargetUrl: string) => void;
  onDurationSecondsChange: (durationSeconds: number) => void;
  onConcurrentUsersChange: (concurrentUsers: number) => void;
  onRequestsChange: (requests: number) => void;
  onMetricChange: (name: keyof BenchmarkMetrics, value: number) => void;
  onSubmit: () => void;
};

const metricInputs: Array<{
  key: keyof BenchmarkMetrics;
  label: string;
  unit: string;
}> = [
  { key: 'timeToProvisionSeconds', label: 'Время подготовки', unit: 'с' },
  { key: 'scalingTimeSeconds', label: 'Масштабирование', unit: 'с' },
  { key: 'rps', label: 'RPS', unit: 'req/s' },
  { key: 'latencyMs', label: 'Задержка', unit: 'мс' },
  { key: 'cpuOverheadPercent', label: 'CPU overhead', unit: '%' },
  { key: 'leadTimeSeconds', label: 'Lead time', unit: 'с' },
];

export function ControlPanel({
  benchmarkMode,
  environmentType,
  targetService,
  customTargetUrl,
  durationSeconds,
  concurrentUsers,
  requests,
  metrics,
  isSubmitting,
  onBenchmarkModeChange,
  onEnvironmentChange,
  onTargetServiceChange,
  onCustomTargetUrlChange,
  onDurationSecondsChange,
  onConcurrentUsersChange,
  onRequestsChange,
  onMetricChange,
  onSubmit,
}: ControlPanelProps) {
  return (
    <section className="panel control-panel">
      <div className="section-title">
        <h2>Панель запуска</h2>
        <p>Настройте demo или real benchmark-запуск.</p>
      </div>

      <div className="mode-row">
        <span className={`run-mode-badge mode-${benchmarkMode}`}>
          {benchmarkMode === 'demo' ? 'Симуляция' : 'Реальный запуск'}
        </span>
      </div>

      <div className="segmented-control" aria-label="Выбор benchmark-режима">
        <button
          className={benchmarkMode === 'demo' ? 'active' : ''}
          onClick={() => onBenchmarkModeChange('demo')}
          type="button"
        >
          Demo
        </button>
        <button
          className={benchmarkMode === 'real' ? 'active' : ''}
          onClick={() => onBenchmarkModeChange('real')}
          type="button"
        >
          Real
        </button>
      </div>

      <div className="segmented-control" aria-label="Выбор среды">
        <button
          className={environmentType === 'vm' ? 'active' : ''}
          onClick={() => onEnvironmentChange('vm')}
          type="button"
        >
          VM
        </button>
        <button
          className={environmentType === 'docker' ? 'active' : ''}
          onClick={() => onEnvironmentChange('docker')}
          type="button"
        >
          Docker
        </button>
      </div>

      {benchmarkMode === 'real' && (
        <div className="metric-form form-block">
          <label className="field">
            <span>Целевой сервис</span>
            <select
              value={targetService}
              onChange={(event) =>
                onTargetServiceChange(event.target.value as TargetService)
              }
            >
              <option value="benchmark-target">benchmark-target</option>
              <option value="custom">свой URL</option>
            </select>
          </label>

          {targetService === 'custom' && (
            <label className="field">
              <span>Пользовательский URL</span>
              <input
                className="text-input"
                type="url"
                value={customTargetUrl}
                onChange={(event) =>
                  onCustomTargetUrlChange(event.target.value)
                }
              />
            </label>
          )}

          <div className="advanced-grid">
            <label className="field">
              <span>Длительность</span>
              <div className="input-with-unit">
                <input
                  min="1"
                  type="number"
                  value={durationSeconds}
                  onChange={(event) =>
                    onDurationSecondsChange(Number(event.target.value))
                  }
                />
                <small>с</small>
              </div>
            </label>
            <label className="field">
              <span>Пользователи</span>
              <div className="input-with-unit">
                <input
                  min="1"
                  type="number"
                  value={concurrentUsers}
                  onChange={(event) =>
                    onConcurrentUsersChange(Number(event.target.value))
                  }
                />
                <small>vus</small>
              </div>
            </label>
            <label className="field">
              <span>Запросы</span>
              <div className="input-with-unit">
                <input
                  min="1"
                  type="number"
                  value={requests}
                  onChange={(event) => onRequestsChange(Number(event.target.value))}
                />
                <small>цель</small>
              </div>
            </label>
          </div>
        </div>
      )}

      {benchmarkMode === 'demo' && (
        <div className="metric-form">
          {metricInputs.map((input) => (
            <label key={input.key} className="field">
              <span>{input.label}</span>
              <div className="input-with-unit">
                <input
                  min="0"
                  step="0.1"
                  type="number"
                  value={metrics[input.key]}
                  onChange={(event) =>
                    onMetricChange(input.key, Number(event.target.value))
                  }
                />
                <small>{input.unit}</small>
              </div>
            </label>
          ))}
        </div>
      )}

      <button
        className="primary-action"
        disabled={isSubmitting}
        onClick={onSubmit}
        type="button"
      >
        {isSubmitting ? 'Запуск...' : 'Запустить benchmark'}
      </button>
    </section>
  );
}
