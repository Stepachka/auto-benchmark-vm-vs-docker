# API проекта

Base URL при локальном запуске:

```text
http://localhost:3000
```

Проверять API можно через `curl`, Postman или любой HTTP-клиент.

## GET /health

Проверка доступности backend.

### Пример curl

```bash
curl http://localhost:3000/health
```

### Пример ответа

```json
{
  "status": "ok",
  "service": "devops-benchmark-backend"
}
```

Если этот endpoint не отвечает, frontend тоже не сможет работать с backend.

## GET /benchmark-runs

Возвращает историю benchmark-запусков.

### Пример curl

```bash
curl http://localhost:3000/benchmark-runs
```

### Пример ответа

```json
[
  {
    "id": "69cfdf00-4b24-4f98-8902-e394be62163c",
    "createdAt": "2026-04-21T19:55:17.640Z",
    "environmentType": "docker",
    "status": "completed",
    "benchmarkMode": "real",
    "mode": "real",
    "targetUrl": "http://benchmark-target:4000/health",
    "rps": 9691.03,
    "latencyMs": 0.08,
    "p95LatencyMs": 0.10,
    "errorRatePercent": 0,
    "totalRequests": 19389,
    "startupTimeSeconds": 0.125,
    "restartTimeSeconds": 0.158,
    "scalingTimeSeconds": 0.12,
    "recommendation": "Docker is recommended: faster scaling and delivery with acceptable CPU overhead.",
    "notes": null
  }
]
```

Ответ — массив. Если запусков ещё не было, вернётся:

```json
[]
```

## GET /benchmark-runs/:id

Возвращает один benchmark run по UUID.

### Пример curl

```bash
curl http://localhost:3000/benchmark-runs/69cfdf00-4b24-4f98-8902-e394be62163c
```

### Возможные результаты

- `200 OK` — запись найдена;
- `404 Not Found` — записи с таким ID нет.

## POST /benchmark-runs

Создаёт benchmark-запуск.

Backend сам выполняет benchmark engine и возвращает итоговую запись.

## Поля запроса

Основные поля:

```text
environmentType   vm | docker
benchmarkMode     demo | real
mode              legacy alias для benchmarkMode
targetUrl         URL сервиса для real benchmark
vus               количество виртуальных пользователей k6
durationSeconds   длительность k6-теста
dockerImage       Docker image для runtime metrics
scalingContainers количество дополнительных контейнеров для scaling simulation
```

`benchmarkMode` — основное поле. `mode` сохранён для обратной совместимости.

## Demo benchmark

Demo mode не требует `targetUrl`.

### Пример curl

```bash
curl -X POST http://localhost:3000/benchmark-runs \
  -H 'Content-Type: application/json' \
  -d '{
    "environmentType": "docker",
    "benchmarkMode": "demo"
  }'
```

### Пример ответа

```json
{
  "id": "uuid",
  "createdAt": "2026-04-21T19:00:00.000Z",
  "environmentType": "docker",
  "status": "completed",
  "benchmarkMode": "demo",
  "mode": "demo",
  "timeToProvisionSeconds": 41.2,
  "scalingTimeSeconds": 25.8,
  "rps": 900.4,
  "latencyMs": 110.7,
  "cpuOverheadPercent": 15.4,
  "leadTimeSeconds": 90.1,
  "recommendation": "Docker is recommended: faster scaling and delivery with acceptable CPU overhead.",
  "notes": null
}
```

## Real benchmark через benchmark-target

### Пример curl

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

### Пример ответа

```json
{
  "id": "uuid",
  "createdAt": "2026-04-21T19:55:17.640Z",
  "environmentType": "docker",
  "status": "completed",
  "benchmarkMode": "real",
  "mode": "real",
  "targetUrl": "http://benchmark-target:4000/health",
  "vus": 1,
  "durationSeconds": 2,
  "dockerImage": "nginx:alpine",
  "scalingContainers": 1,
  "rps": 9691.03,
  "latencyMs": 0.08,
  "requestsPerSecond": 9691.03,
  "avgLatencyMs": 0.08,
  "p95LatencyMs": 0.10,
  "errorRatePercent": 0,
  "totalRequests": 19389,
  "startupTimeSeconds": 0.125,
  "restartTimeSeconds": 0.158,
  "scalingTimeSeconds": 0.12,
  "notes": null
}
```

## Real benchmark для разных workload endpoint

```bash
curl -X POST http://localhost:3000/benchmark-runs \
  -H 'Content-Type: application/json' \
  -d '{
    "environmentType": "docker",
    "benchmarkMode": "real",
    "targetUrl": "http://benchmark-target:4000/cpu-test",
    "vus": 2,
    "durationSeconds": 5
  }'
```

Другие варианты:

```text
http://benchmark-target:4000/health
http://benchmark-target:4000/cpu-test
http://benchmark-target:4000/memory-test
http://benchmark-target:4000/random-delay
http://benchmark-target:4000/json-large
```

## Проверка через Postman

1. Создайте `POST` request.
2. URL: `http://localhost:3000/benchmark-runs`.
3. Headers: `Content-Type: application/json`.
4. Body -> raw -> JSON.
5. Вставьте JSON из примера.
6. Отправьте запрос.
7. Проверьте поля `status`, `benchmarkMode`, `rps`, `latencyMs`, `totalRequests`.

## Ошибки API

### k6 недоступен

Пример поля `notes`:

```text
k6 executable not found. Install k6 or use benchmarkMode=demo.
```

### Docker runtime metrics недоступны

Запуск может завершиться `completed`, но в `notes` будет предупреждение:

```text
Docker runtime metrics unavailable: ...
```

### Неверный targetUrl

Возможны:

- `failed` status;
- нулевые или плохие k6-метрики;
- ошибка в `notes`.

## Рекомендуемая ручная проверка API

```bash
curl http://localhost:3000/health
curl http://localhost:3000/benchmark-runs
curl -X POST http://localhost:3000/benchmark-runs \
  -H 'Content-Type: application/json' \
  -d '{"environmentType":"docker","benchmarkMode":"demo"}'
curl http://localhost:3000/benchmark-runs
```
