import type { BenchmarkRun } from '../types';
import {
  type ComparisonRow,
  formatNumber,
  getPercentDifference,
  getWinner,
  latestRunByEnvironment,
} from '../utils';

type ComparisonTableProps = {
  runs: BenchmarkRun[];
};

const rows: ComparisonRow[] = [
  { label: 'Время подготовки', key: 'timeToProvisionSeconds', unit: 'с', lowerIsBetter: true },
  { label: 'Масштабирование', key: 'scalingTimeSeconds', unit: 'с', lowerIsBetter: true },
  { label: 'RPS', key: 'rps', unit: '', lowerIsBetter: false },
  { label: 'Задержка', key: 'latencyMs', unit: 'мс', lowerIsBetter: true },
  { label: 'CPU overhead', key: 'cpuOverheadPercent', unit: '%', lowerIsBetter: true },
  { label: 'Lead time', key: 'leadTimeSeconds', unit: 'с', lowerIsBetter: true },
];

function winnerLabel(winner: string) {
  return winner === 'Tie' ? 'Равно' : winner;
}

export function ComparisonTable({ runs }: ComparisonTableProps) {
  const vm = latestRunByEnvironment(runs, 'vm');
  const docker = latestRunByEnvironment(runs, 'docker');
  const hasComparableRuns = Boolean(vm && docker);

  return (
    <section className="panel">
      <div className="section-title">
        <h2>Сравнение VM и Docker</h2>
        <p>
          {hasComparableRuns
            ? 'Сравнивается последний VM-запуск с последним Docker-запуском.'
            : 'Создайте хотя бы один VM-запуск и один Docker-запуск для полного сравнения.'}
        </p>
      </div>

      {!hasComparableRuns && (
        <div className="empty-state">
          {!vm && <span>Нет последнего VM-запуска</span>}
          {!docker && <span>Нет последнего Docker-запуска</span>}
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Метрика</th>
              <th>VM</th>
              <th>Docker</th>
              <th>Docker к VM</th>
              <th>Лучше</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const vmValue = vm?.[row.key];
              const dockerValue = docker?.[row.key];
              const better =
                vmValue === undefined || dockerValue === undefined
                  ? '-'
                  : getWinner(vmValue, dockerValue, row.lowerIsBetter);
              const difference =
                vmValue === undefined || dockerValue === undefined
                  ? '-'
                  : getPercentDifference(vmValue, dockerValue);

              return (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  <td className={better === 'VM' ? 'best-value' : ''}>
                    {vmValue === undefined ? '-' : formatNumber(vmValue, row.unit)}
                  </td>
                  <td className={better === 'Docker' ? 'best-value' : ''}>
                    {dockerValue === undefined
                      ? '-'
                      : formatNumber(dockerValue, row.unit)}
                  </td>
                  <td>{difference}</td>
                  <td>
                    <span
                      className={`winner-badge ${
                        better === 'Tie' ? 'winner-neutral' : ''
                      }`}
                    >
                      {winnerLabel(better)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
