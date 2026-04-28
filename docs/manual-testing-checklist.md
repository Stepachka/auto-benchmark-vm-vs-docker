# Чек-лист ручного тестирования

Этот файл предназначен для проверки проекта перед демонстрацией и защитой.

## 1. Проверка Docker Compose

```bash
docker compose up -d --build
docker compose ps
```

Проверить, что запущены:

- `postgres`;
- `backend`;
- `frontend`;
- `benchmark-target`.

Ожидаемое состояние:

```text
healthy
```

Что сфотографировать для отчёта:

- вывод `docker compose ps`.

## 2. Проверка backend /health

```bash
curl http://localhost:3000/health
```

Ожидаемый ответ:

```json
{
  "status": "ok",
  "service": "devops-benchmark-backend"
}
```

Что сфотографировать:

- терминал с ответом `/health`.

## 3. Проверка frontend

Открыть:

```text
http://localhost:5173
```

Проверить:

- dashboard загружается;
- статус backend отображается;
- есть control panel;
- есть графики;
- есть таблица истории.

Что сфотографировать:

- главную страницу dashboard.

## 4. Проверка benchmark-target

```bash
curl http://localhost:4000/health
curl http://localhost:4000/cpu-test
curl http://localhost:4000/random-delay
```

Проверить:

- `/health` возвращает `ok`;
- workload endpoints возвращают JSON.

Что сфотографировать:

- ответы benchmark-target в терминале.

## 5. Проверка создания demo benchmark run

```bash
curl -X POST http://localhost:3000/benchmark-runs \
  -H 'Content-Type: application/json' \
  -d '{"environmentType":"docker","benchmarkMode":"demo"}'
```

Проверить:

- `status` равен `completed`;
- есть `rps`;
- есть `latencyMs`;
- есть `recommendation`.

Что сфотографировать:

- ответ API;
- появление записи в интерфейсе.

## 6. Проверка real benchmark

```bash
curl -X POST http://localhost:3000/benchmark-runs \
  -H 'Content-Type: application/json' \
  -d '{
    "environmentType": "docker",
    "benchmarkMode": "real",
    "targetUrl": "http://benchmark-target:4000/health",
    "vus": 1,
    "durationSeconds": 2,
    "dockerImage": "nginx:alpine",
    "scalingContainers": 1
  }'
```

Проверить:

- `status` равен `completed`;
- `requestsPerSecond` больше 0;
- `totalRequests` больше 0;
- `avgLatencyMs` рассчитан;
- Docker runtime metrics рассчитаны или есть понятное предупреждение в `notes`.

Что сфотографировать:

- ответ real benchmark API;
- таблицу истории после запуска.

## 7. Проверка графиков

В интерфейсе проверить:

- RPS trend;
- latency trend;
- scaling time comparison.

Если графики пустые, нужно создать хотя бы один benchmark run.

Что сфотографировать:

- блок графиков после нескольких запусков.

## 8. Проверка истории запусков

Проверить таблицу history:

- дата создания;
- окружение;
- режим запуска;
- статус;
- RPS;
- latency;
- lead time.

Что сфотографировать:

- таблицу истории с несколькими записями.

## 9. Проверка сравнения VM vs Docker

Создать минимум два запуска:

```bash
curl -X POST http://localhost:3000/benchmark-runs \
  -H 'Content-Type: application/json' \
  -d '{"environmentType":"vm","benchmarkMode":"demo"}'

curl -X POST http://localhost:3000/benchmark-runs \
  -H 'Content-Type: application/json' \
  -d '{"environmentType":"docker","benchmarkMode":"demo"}'
```

Проверить:

- таблица сравнения показывает VM и Docker;
- есть процентная разница;
- лучшие значения подсвечиваются;
- recommendation panel обновляется.

Что сфотографировать:

- comparison table;
- recommendation panel.

## 10. Проверка historical analytics

Создать два запуска одного типа, например:

```bash
curl -X POST http://localhost:3000/benchmark-runs \
  -H 'Content-Type: application/json' \
  -d '{"environmentType":"docker","benchmarkMode":"demo"}'

curl -X POST http://localhost:3000/benchmark-runs \
  -H 'Content-Type: application/json' \
  -d '{"environmentType":"docker","benchmarkMode":"demo"}'
```

Проверить:

- блок Historical Trend отображает сравнение latest vs previous;
- есть labels `Improved`, `Stable`, `Regressed`.

Что сфотографировать:

- блок historical trend.

## 11. Проверка ошибок

### Неверный targetUrl

```bash
curl -X POST http://localhost:3000/benchmark-runs \
  -H 'Content-Type: application/json' \
  -d '{
    "environmentType": "docker",
    "benchmarkMode": "real",
    "targetUrl": "http://not-existing-service:9999/health",
    "vus": 1,
    "durationSeconds": 2
  }'
```

Проверить:

- запуск не ломает backend;
- ошибка понятна через `status` или `notes`.

Что сфотографировать:

- ответ API с ошибкой или предупреждением.

## 12. Что обязательно показать на защите

Минимальный набор скриншотов:

- `docker compose ps`;
- frontend dashboard;
- backend `/health`;
- benchmark-target `/health`;
- demo benchmark response;
- real benchmark response;
- history table;
- charts;
- VM vs Docker comparison;
- historical trend;
- GitHub Actions workflow;
- Terraform folder.

## 13. Финальная очистка после тестов

Если нужно начать заново:

```bash
docker compose down -v
docker compose up -d --build
```

