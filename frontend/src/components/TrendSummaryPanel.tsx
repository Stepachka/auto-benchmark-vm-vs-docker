import type { HistoricalTrend } from '../utils';

type TrendSummaryPanelProps = {
  trend: HistoricalTrend;
};

export function TrendSummaryPanel({ trend }: TrendSummaryPanelProps) {
  const statusLabel = {
    Improved: 'Улучшено',
    Stable: 'Стабильно',
    Regressed: 'Регрессия',
  };

  return (
    <section className="panel trend-panel">
      <div className="section-title">
        <h2>Исторический тренд</h2>
        <p>{trend.summary}</p>
      </div>

      <div className="trend-header">{trend.title}</div>

      {trend.metrics.length === 0 ? (
        <div className="empty-state">
          <span>Нужен ещё один сопоставимый запуск</span>
        </div>
      ) : (
        <div className="trend-grid">
          {trend.metrics.map((metric) => (
            <article key={metric.label} className="trend-card">
              <span>{metric.label}</span>
              <strong className={`trend-${metric.status.toLowerCase()}`}>
                {statusLabel[metric.status]}
              </strong>
              <small>{metric.delta}</small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
