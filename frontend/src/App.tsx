import { useEffect, useMemo, useState } from 'react';
import {
  createBenchmarkRun,
  getBackendHealth,
  getBenchmarkRuns,
} from './api';
import { BenchmarkCharts } from './components/BenchmarkCharts';
import { ComparisonTable } from './components/ComparisonTable';
import { ControlPanel } from './components/ControlPanel';
import { Header } from './components/Header';
import { HistoryTable } from './components/HistoryTable';
import { MetricCards } from './components/MetricCards';
import { RecommendationPanel } from './components/RecommendationPanel';
import { TrendSummaryPanel } from './components/TrendSummaryPanel';
import { defaultMetrics } from './data';
import type {
  BackendStatus,
  BenchmarkMode,
  BenchmarkMetrics,
  BenchmarkRun,
  EnvironmentType,
  TargetService,
} from './types';
import { buildHistoricalTrend, buildRecommendation } from './utils';

const benchmarkTargetUrl = 'http://benchmark-target:4000/health';

export function App() {
  const [backendStatus, setBackendStatus] =
    useState<BackendStatus>('checking');
  const [benchmarkMode, setBenchmarkMode] = useState<BenchmarkMode>('demo');
  const [environmentType, setEnvironmentType] =
    useState<EnvironmentType>('docker');
  const [targetService, setTargetService] =
    useState<TargetService>('benchmark-target');
  const [customTargetUrl, setCustomTargetUrl] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(10);
  const [concurrentUsers, setConcurrentUsers] = useState(1);
  const [requests, setRequests] = useState(1000);
  const [metrics, setMetrics] = useState<BenchmarkMetrics>(defaultMetrics);
  const [runs, setRuns] = useState<BenchmarkRun[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  useEffect(() => {
    async function loadBackendState() {
      try {
        await getBackendHealth();
        setBackendStatus('online');
        await refreshBenchmarkRuns();
      } catch {
        setBackendStatus('offline');
        setMessage({
          type: 'error',
          text: 'Backend недоступен. Запустите NestJS API, чтобы загрузить историю benchmark.',
        });
        setIsLoadingRuns(false);
      }
    }

    void loadBackendState();
  }, []);

  const recommendation = useMemo(() => buildRecommendation(runs), [runs]);
  const historicalTrend = useMemo(() => buildHistoricalTrend(runs), [runs]);

  function handleMetricChange(name: keyof BenchmarkMetrics, value: number) {
    setMetrics((currentMetrics) => ({
      ...currentMetrics,
      [name]: Number.isNaN(value) ? 0 : value,
    }));
  }

  async function refreshBenchmarkRuns() {
    setIsLoadingRuns(true);
    try {
      const benchmarkRuns = await getBenchmarkRuns();
      setRuns(benchmarkRuns);
    } finally {
      setIsLoadingRuns(false);
    }
  }

  async function handleSubmit() {
    const targetUrl =
      targetService === 'benchmark-target' ? benchmarkTargetUrl : customTargetUrl;
    const payload = {
      ...metrics,
      environmentType,
      benchmarkMode,
      ...(benchmarkMode === 'real'
        ? {
            targetUrl,
            durationSeconds,
            vus: concurrentUsers,
          }
        : {}),
      status: 'completed' as const,
      recommendation: recommendation.summary,
      notes:
        benchmarkMode === 'real'
          ? `Запущено из frontend-панели. Целевое число запросов: ${requests}.`
          : 'Запущено из frontend-панели.',
    };

    setIsSubmitting(true);
    setMessage(null);

    try {
      await createBenchmarkRun(payload);
      await refreshBenchmarkRuns();
      setBackendStatus('online');
      setMessage({
        type: 'success',
        text: 'Benchmark-запуск создан, история обновлена.',
      });
    } catch {
      setBackendStatus('offline');
      setMessage({
        type: 'error',
        text: 'Не удалось создать benchmark-запуск. Проверьте backend и database.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <Header backendStatus={backendStatus} />

      {message && (
        <div className={`notice notice-${message.type}`} role="status">
          {message.text}
        </div>
      )}

      <div className="dashboard-layout">
        <ControlPanel
          benchmarkMode={benchmarkMode}
          environmentType={environmentType}
          targetService={targetService}
          customTargetUrl={customTargetUrl}
          durationSeconds={durationSeconds}
          concurrentUsers={concurrentUsers}
          requests={requests}
          metrics={metrics}
          isSubmitting={isSubmitting}
          onBenchmarkModeChange={setBenchmarkMode}
          onEnvironmentChange={setEnvironmentType}
          onTargetServiceChange={setTargetService}
          onCustomTargetUrlChange={setCustomTargetUrl}
          onDurationSecondsChange={(value) =>
            setDurationSeconds(Number.isNaN(value) ? 1 : value)
          }
          onConcurrentUsersChange={(value) =>
            setConcurrentUsers(Number.isNaN(value) ? 1 : value)
          }
          onRequestsChange={(value) =>
            setRequests(Number.isNaN(value) ? 1 : value)
          }
          onMetricChange={handleMetricChange}
          onSubmit={handleSubmit}
        />

        <div className="dashboard-main">
          <MetricCards metrics={metrics} />
          <BenchmarkCharts runs={runs} />
          <TrendSummaryPanel trend={historicalTrend} />
          <ComparisonTable runs={runs} />
          <RecommendationPanel recommendation={recommendation} />
        </div>
      </div>

      <HistoryTable runs={runs} isLoading={isLoadingRuns} />
    </main>
  );
}
