import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BenchmarkRun } from '../types';
import { environmentLabel, latestRunByEnvironment } from '../utils';

type BenchmarkChartsProps = {
  runs: BenchmarkRun[];
};

const axisColor = '#7f8b9c';
const gridColor = 'rgba(255, 255, 255, 0.08)';
const dockerColor = '#6ee7c8';
const vmColor = '#f6c453';

export function BenchmarkCharts({ runs }: BenchmarkChartsProps) {
  const trendData = runs
    .slice()
    .reverse()
    .slice(-12)
    .map((run, index) => ({
      label: `${environmentLabel(run.environmentType)} ${index + 1}`,
      rps: run.rps,
      latency: run.latencyMs,
      environment: environmentLabel(run.environmentType),
    }));
  const vm = latestRunByEnvironment(runs, 'vm');
  const docker = latestRunByEnvironment(runs, 'docker');
  const scalingData = [
    vm && { name: 'VM', scalingTime: vm.scalingTimeSeconds },
    docker && { name: 'Docker', scalingTime: docker.scalingTimeSeconds },
  ].filter(Boolean);
  const hasTrendData = trendData.length > 0;
  const hasScalingData = scalingData.length > 0;

  return (
    <section className="charts-grid">
      <ChartPanel
        title="Тренд RPS"
        description="Пропускная способность последних benchmark-запусков."
        isEmpty={!hasTrendData}
      >
        <LineChart data={trendData}>
          <CartesianGrid stroke={gridColor} vertical={false} />
          <XAxis dataKey="label" stroke={axisColor} tick={{ fontSize: 11 }} />
          <YAxis stroke={axisColor} tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="rps"
            stroke={dockerColor}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartPanel>

      <ChartPanel
        title="Тренд задержки"
        description="Задержка ответа в последних benchmark-запусках."
        isEmpty={!hasTrendData}
      >
        <LineChart data={trendData}>
          <CartesianGrid stroke={gridColor} vertical={false} />
          <XAxis dataKey="label" stroke={axisColor} tick={{ fontSize: 11 }} />
          <YAxis stroke={axisColor} tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="latency"
            stroke={vmColor}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartPanel>

      <ChartPanel
        title="Время масштабирования"
        description="Сравнение последнего VM и Docker запуска."
        isEmpty={!hasScalingData}
      >
        <BarChart data={scalingData}>
          <CartesianGrid stroke={gridColor} vertical={false} />
          <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 11 }} />
          <YAxis stroke={axisColor} tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Bar dataKey="scalingTime" fill={dockerColor} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartPanel>
    </section>
  );
}

type ChartPanelProps = {
  title: string;
  description: string;
  isEmpty: boolean;
  children: React.ReactElement;
};

const tooltipStyle = {
  background: '#17191f',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '6px',
  color: '#e7ecf3',
};

function ChartPanel({
  title,
  description,
  isEmpty,
  children,
}: ChartPanelProps) {
  return (
    <article className="panel chart-panel">
      <div className="section-title">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {isEmpty ? (
        <div className="chart-empty">Создайте benchmark-запуски, чтобы увидеть графики.</div>
      ) : (
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}
