import type { BenchmarkRun } from '../types';
import { environmentLabel, formatNumber } from '../utils';

type HistoryTableProps = {
  runs: BenchmarkRun[];
  isLoading: boolean;
};

export function HistoryTable({ runs, isLoading }: HistoryTableProps) {
  const statusLabel: Record<string, string> = {
    pending: 'ожидает',
    running: 'выполняется',
    completed: 'завершён',
    failed: 'ошибка',
  };

  return (
    <section className="panel history-panel">
      <div className="section-title">
        <h2>История запусков</h2>
        <p>
          {isLoading
            ? 'Загрузка результатов из backend...'
            : 'Последние сохранённые benchmark-запуски.'}
        </p>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Создан</th>
              <th>Среда</th>
              <th>Режим</th>
              <th>Статус</th>
              <th>RPS</th>
              <th>Задержка</th>
              <th>CPU</th>
              <th>Lead Time</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && runs.length === 0 && (
              <tr>
                <td colSpan={8}>Benchmark-запуски пока не найдены.</td>
              </tr>
            )}
            {runs.map((run) => (
              <tr key={run.id}>
                <td>{new Date(run.createdAt).toLocaleString()}</td>
                <td>{environmentLabel(run.environmentType)}</td>
                <td>
                  <span
                    className={`run-mode-badge mode-${
                      run.benchmarkMode ?? run.mode ?? 'demo'
                    }`}
                  >
                    {(run.benchmarkMode ?? run.mode) === 'real'
                      ? 'Реальный запуск'
                      : 'Симуляция'}
                  </span>
                </td>
                <td>
                  <span className={`status-tag ${run.status}`}>
                    {statusLabel[run.status] ?? run.status}
                  </span>
                </td>
                <td>{formatNumber(run.rps)}</td>
                <td>{formatNumber(run.latencyMs, 'ms')}</td>
                <td>{formatNumber(run.cpuOverheadPercent, '%')}</td>
                <td>{formatNumber(run.leadTimeSeconds, 's')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
