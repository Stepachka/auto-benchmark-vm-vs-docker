import type { BackendStatus } from '../types';

type HeaderProps = {
  backendStatus: BackendStatus;
};

export function Header({ backendStatus }: HeaderProps) {
  const statusLabel: Record<BackendStatus, string> = {
    checking: 'проверяется',
    online: 'доступен',
    offline: 'недоступен',
  };

  return (
    <header className="header">
      <div>
        <p className="eyebrow">Академический DevOps Benchmark</p>
        <h1>Панель сравнения VM и Docker</h1>
      </div>
      <div className={`status-pill status-${backendStatus}`}>
        <span />
        Backend: {statusLabel[backendStatus]}
      </div>
    </header>
  );
}
