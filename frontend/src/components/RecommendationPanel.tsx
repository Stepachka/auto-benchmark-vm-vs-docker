import type { RecommendationResult } from '../utils';

type RecommendationPanelProps = {
  recommendation: RecommendationResult;
};

export function RecommendationPanel({
  recommendation,
}: RecommendationPanelProps) {
  return (
    <section className="panel recommendation-panel">
      <div className="section-title">
        <h2>Рекомендация</h2>
        <p>Вывод по последним сопоставимым запускам.</p>
      </div>
      <div className="recommendation-box">
        <strong>{recommendation.title}</strong>
        <p>{recommendation.summary}</p>
        <ul>
          {recommendation.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
