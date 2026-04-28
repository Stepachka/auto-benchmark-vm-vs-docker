import type { BenchmarkMetrics } from '../types';
import { formatNumber } from '../utils';

type MetricCardsProps = {
  metrics: BenchmarkMetrics;
};

const cards: Array<{
  key: keyof BenchmarkMetrics;
  label: string;
  unit: string;
}> = [
  { key: 'timeToProvisionSeconds', label: 'Время подготовки', unit: 'с' },
  { key: 'scalingTimeSeconds', label: 'Масштабирование', unit: 'с' },
  { key: 'rps', label: 'RPS', unit: '' },
  { key: 'latencyMs', label: 'Задержка', unit: 'мс' },
  { key: 'cpuOverheadPercent', label: 'CPU overhead', unit: '%' },
  { key: 'leadTimeSeconds', label: 'Lead time', unit: 'с' },
];

export function MetricCards({ metrics }: MetricCardsProps) {
  return (
    <section className="metric-grid">
      {cards.map((card) => (
        <article key={card.key} className="metric-card">
          <p>{card.label}</p>
          <strong>{formatNumber(metrics[card.key], card.unit)}</strong>
        </article>
      ))}
    </section>
  );
}
