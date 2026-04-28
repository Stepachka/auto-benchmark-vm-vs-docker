# Методология benchmark

## Цель измерений

Методология нужна для сравнения двух подходов к развертыванию:

- VM baseline;
- Docker/containerized deployment.

Сравнение проводится по метрикам производительности и эксплуатационным метрикам запуска контейнеров.

## Режимы benchmark

## Demo mode

Demo mode не запускает реальные внешние инструменты. Backend генерирует реалистичные значения, чтобы можно было:

- быстро показать dashboard;
- проверить таблицы и графики;
- сравнить VM и Docker без настройки k6;
- использовать проект на демонстрации, если реальное окружение недоступно.

В demo mode часть метрик является симулируемой:

- `timeToProvisionSeconds`;
- `leadTimeSeconds`;
- `scalingTimeSeconds`;
- `rps`;
- `latencyMs`;
- `cpuOverheadPercent`.

Логика симуляции:

- Docker обычно быстрее масштабируется;
- Docker имеет небольшой CPU overhead;
- RPS Docker близок к VM;
- VM медленнее масштабируется, но имеет меньший overhead.

## Real mode

Real mode выполняет реальные измерения через k6.

Backend:

1. создаёт временный k6 script;
2. запускает `k6 run --summary-export`;
3. читает JSON summary;
4. извлекает метрики HTTP-нагрузки;
5. при `environmentType=docker` дополнительно измеряет Docker runtime metrics.

## Какие метрики считаются реально

В real mode через k6 реально считаются:

- `requestsPerSecond`;
- `avgLatencyMs`;
- `p95LatencyMs`;
- `errorRatePercent`;
- `totalRequests`.

Для Docker-окружения через Docker CLI реально измеряются:

- `startupTimeSeconds`;
- `restartTimeSeconds`;
- `scalingTimeSeconds`.

## Какие метрики могут быть симулируемыми

В demo mode симулируются все benchmark-метрики.

В real mode пока не измеряются полноценно и могут оставаться нулевыми или учебными:

- `timeToProvisionSeconds`;
- `leadTimeSeconds`;
- `cpuOverheadPercent`.

Их можно расширить позже через monitoring exporters, Docker stats, Prometheus или cloud provider metrics.

## Как считается RPS

RPS — requests per second.

В real mode значение берётся из k6 summary:

```text
http_reqs.rate
```

Это количество HTTP-запросов в секунду за время теста.

Интерпретация:

- выше RPS — лучше throughput;
- сравнивать RPS корректно только при одинаковых `targetUrl`, `vus`, `durationSeconds`.

## Как считается latency

Средняя latency берётся из k6:

```text
http_req_duration.avg
```

p95 latency берётся из:

```text
http_req_duration.p(95)
```

Интерпретация:

- ниже latency — быстрее ответ сервиса;
- p95 важнее среднего значения, если нужно понимать «хвосты» задержек.

## Как считается error rate

Error rate берётся из k6:

```text
http_req_failed.rate * 100
```

Интерпретация:

- `0%` — ошибок нет;
- рост error rate означает, что сервис или окружение не выдерживает нагрузку.

## Как считается scaling time

В real Docker benchmark backend запускает N дополнительных контейнеров последовательно.

Параметр:

```text
scalingContainers
```

Метрика:

```text
scalingTimeSeconds
```

Она показывает суммарное время запуска дополнительных контейнеров.

Важно: это учебная scaling simulation, а не полноценное autoscaling в Kubernetes.

## Как считается startup time

Backend через Docker CLI выполняет:

```text
docker run -d -P <image>
```

Затем ждёт состояние:

```text
running
```

или, если у контейнера есть healthcheck:

```text
healthy
```

Метрика:

```text
startupTimeSeconds
```

## Как считается restart time

Backend выполняет:

```text
docker restart <container>
```

Затем снова ждёт `running` или `healthy`.

Метрика:

```text
restartTimeSeconds
```

## Как интерпретировать результаты

### Docker выглядит лучше, если:

- ниже `startupTimeSeconds`;
- ниже `restartTimeSeconds`;
- ниже `scalingTimeSeconds`;
- RPS близок к VM или выше;
- latency не ухудшается значительно.

### VM выглядит лучше, если:

- ниже overhead;
- latency стабильнее;
- нет необходимости в быстром scaling;
- важнее простота baseline-инфраструктуры.

## Историческая аналитика

Frontend сравнивает последний запуск с предыдущим сопоставимым запуском.

Сопоставимость означает одинаковые:

```text
environmentType
benchmarkMode
```

Проверяются регрессии:

- RPS снизился;
- latency выросла;
- scaling time вырос.

Метки:

```text
Improved
Stable
Regressed
```

## Ограничения методологии

- Demo mode не является реальным измерением.
- Real mode зависит от доступности k6.
- Docker runtime metrics требуют доступа к Docker daemon.
- Scaling simulation не заменяет Kubernetes HPA или cloud autoscaling.
- Сравнивать результаты нужно при одинаковых параметрах теста.
