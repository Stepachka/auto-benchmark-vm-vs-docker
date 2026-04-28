# DevOps Benchmark Platform

## Что это за проект

DevOps Benchmark Platform — учебная платформа для сравнения вариантов развертывания микросервисов: условного VM-baseline и Docker/containerized deployment. Проект позволяет запускать benchmark-сценарии, сохранять результаты в PostgreSQL и анализировать их через web-dashboard.

Проект сделан как практическая работа: он показывает не только frontend/backend-разработку, но и типичный DevOps-контур — Docker Compose, CI/CD, benchmark target, реальные и демонстрационные измерения, базовую IaC-структуру Terraform.

## Для чего он нужен

Платформа нужна, чтобы наглядно ответить на вопросы:

- как меняются RPS и latency при разных типах нагрузки;
- чем отличается demo benchmark от real benchmark;
- как Docker влияет на startup/restart/scaling;
- как хранить историю benchmark-запусков;
- как строить dashboard для сравнения VM и Docker;
- как подготовить проект к демонстрации и защите.

## Из каких частей состоит система

```text
frontend/           React + TypeScript + Vite dashboard
backend/            NestJS REST API, benchmark engine, TypeORM
benchmark-target/   легковесный Express-сервис для нагрузки
docker-compose.yml  запуск PostgreSQL, backend, frontend, benchmark-target
infra/terraform/    минимальная Terraform-структура для будущего IaC
.github/workflows/  GitHub Actions CI
docs/               документация для разработки, отчёта и защиты
```

Основной поток данных:

```text
Пользователь -> Frontend -> Backend API -> Benchmark Engine -> PostgreSQL
```

Для real benchmark дополнительно используется:

```text
Backend -> k6 -> benchmark-target
Backend -> Docker CLI -> Docker daemon
```

## Как работает benchmark-процесс

1. Пользователь выбирает режим benchmark: `demo` или `real`.
2. Пользователь выбирает окружение: `vm` или `docker`.
3. Frontend отправляет `POST /benchmark-runs`.
4. Backend создаёт запись со статусом `pending`.
5. Backend переводит запуск в `running`.
6. Benchmark engine выполняет выбранную стратегию.
7. Backend сохраняет метрики и переводит запуск в `completed` или `failed`.
8. Frontend загружает историю и обновляет карточки, графики, таблицы и рекомендации.

Статусы:

```text
pending -> running -> completed
failed
```

## Какие есть режимы: demo / real

### Demo mode

`demo` — режим симуляции. Backend генерирует реалистичные значения метрик без запуска внешних инструментов.

Используется для:

- быстрой демонстрации;
- проверки UI;
- тестирования логики сравнения;
- работы без k6 и Docker runtime metrics.

### Real mode

`real` — режим реального измерения.

Backend:

- генерирует временный k6-скрипт;
- запускает `k6 run`;
- измеряет RPS, latency, p95 latency, error rate, total requests;
- для Docker-окружения дополнительно измеряет startup/restart/scaling через Docker CLI;
- сохраняет результат в PostgreSQL.

Если k6 недоступен, запуск сохраняется со статусом `failed` и понятным сообщением в `notes`.

Если Docker CLI недоступен, k6-часть может завершиться успешно, а Docker runtime metrics будут пропущены с предупреждением в `notes`.

## Как запустить проект локально

Требования:

- Docker Desktop / Docker Engine;
- Docker Compose;
- свободные порты `3000`, `4000`, `5173`, `5432`.

Запуск всей системы:

```bash
docker compose up --build
```

Запуск в фоне:

```bash
docker compose up -d --build
```

Проверить контейнеры:

```bash
docker compose ps
```

Остановить:

```bash
docker compose down
```

Полностью очистить данные PostgreSQL:

```bash
docker compose down -v
```

Подробная инструкция: [docs/local-run-guide.md](docs/local-run-guide.md).

## Как проверить, что frontend работает

Откройте:

```text
http://localhost:5173
```

Ожидаемый результат:

- открывается dashboard;
- вверху виден статус backend;
- отображаются control panel, metric cards, charts, comparison table, history table.

Через терминал:

```bash
curl -I http://localhost:5173
```

Ожидается HTTP `200 OK`.

## Как проверить, что backend работает

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

Проверить историю benchmark-запусков:

```bash
curl http://localhost:3000/benchmark-runs
```

Ожидается JSON-массив.

## Как проверить, что database подключена

Признак корректного подключения: backend успешно стартует и endpoint `GET /benchmark-runs` возвращает ответ без ошибки.

Проверка контейнера PostgreSQL:

```bash
docker compose ps postgres
```

Проверка логов backend:

```bash
docker compose logs backend
```

Если PostgreSQL недоступен, backend обычно не сможет корректно подключиться к базе или будет перезапускаться.

## Как проверить benchmark-target

Benchmark target доступен на порту `4000`.

```bash
curl http://localhost:4000/health
curl http://localhost:4000/cpu-test
curl http://localhost:4000/memory-test
curl http://localhost:4000/random-delay
curl http://localhost:4000/json-large
```

Внутри Docker-сети backend обращается к нему так:

```text
http://benchmark-target:4000/health
```

## Как запустить benchmark вручную

### Demo benchmark

```bash
curl -X POST http://localhost:3000/benchmark-runs \
  -H 'Content-Type: application/json' \
  -d '{
    "environmentType": "docker",
    "benchmarkMode": "demo"
  }'
```

### Real benchmark через benchmark-target

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

### Real benchmark с другого endpoint

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

## Как посмотреть результаты в интерфейсе

1. Откройте `http://localhost:5173`.
2. Выберите режим `Demo` или `Real`.
3. Выберите окружение `VM` или `Docker`.
4. Для real mode выберите `benchmark-target` или задайте custom URL.
5. Нажмите кнопку запуска.
6. После завершения проверьте:
   - карточки метрик;
   - графики RPS и latency;
   - таблицу сравнения VM vs Docker;
   - блок исторического тренда;
   - таблицу истории запусков.

## Какие метрики рассчитываются

Основные метрики:

- `rps`;
- `latencyMs`;
- `p95LatencyMs`;
- `errorRatePercent`;
- `totalRequests`;
- `scalingTimeSeconds`;
- `startupTimeSeconds`;
- `restartTimeSeconds`;
- `cpuOverheadPercent`;
- `leadTimeSeconds`;
- `timeToProvisionSeconds`.

## Что означают эти метрики

- `rps` — requests per second, количество HTTP-запросов в секунду.
- `latencyMs` — средняя задержка ответа в миллисекундах.
- `p95LatencyMs` — 95-й перцентиль latency: 95% запросов были быстрее этого значения.
- `errorRatePercent` — процент неуспешных HTTP-запросов.
- `totalRequests` — общее количество запросов за benchmark.
- `scalingTimeSeconds` — время последовательного запуска дополнительных контейнеров.
- `startupTimeSeconds` — время запуска контейнера до состояния running/healthy.
- `restartTimeSeconds` — время перезапуска контейнера.
- `cpuOverheadPercent` — оценка CPU overhead; в demo mode симулируется.
- `leadTimeSeconds` — учебная метрика времени доставки изменения до запуска; в demo mode симулируется.
- `timeToProvisionSeconds` — учебная метрика времени подготовки окружения; в demo mode симулируется.

## Какие сценарии тестирования есть

Benchmark target предоставляет разные типы нагрузки:

```text
GET /health        минимальный быстрый endpoint
GET /cpu-test      CPU-bound нагрузка
GET /memory-test   создание большого массива объектов
GET /random-delay  случайная задержка ответа
GET /json-large    большой JSON-ответ
```

Рекомендуемые сценарии:

- сравнить `/health` и `/cpu-test`;
- сделать два real-запуска подряд и проверить historical trend;
- сделать demo-запуски для VM и Docker и проверить comparison table;
- запустить real benchmark с неверным URL и проверить ошибку.

## Что проверять перед защитой

Минимальный чек-лист:

- `docker compose ps` показывает healthy для backend, frontend, postgres, benchmark-target;
- `http://localhost:5173` открывается;
- `GET /health` backend возвращает `ok`;
- `GET /health` benchmark-target возвращает `ok`;
- demo benchmark создаётся через UI;
- real benchmark создаётся через UI или curl;
- результаты появляются в history table;
- графики обновляются;
- VM vs Docker comparison работает после запусков обоих типов;
- historical trend показывает Improved / Stable / Regressed;
- GitHub Actions workflow описан и запускается;
- Terraform-структура объяснена как заготовка IaC.

Подробный чек-лист: [docs/manual-testing-checklist.md](docs/manual-testing-checklist.md).

## Типичные ошибки и как их исправить

### Порт уже занят

Ошибка: контейнер не стартует из-за занятого порта.

Проверка:

```bash
docker compose ps
```

Решение:

```bash
docker compose down
```

Если порт всё ещё занят, остановите локальный процесс, который использует `3000`, `4000`, `5173` или `5432`.

### Backend offline в интерфейсе

Проверьте:

```bash
curl http://localhost:3000/health
docker compose logs backend
```

Частая причина — backend не подключился к PostgreSQL.

### Real benchmark завершается failed

Проверьте поле `notes` в ответе API или в history.

Возможные причины:

- не найден k6;
- неверный `targetUrl`;
- benchmark-target не запущен;
- backend не имеет доступа к Docker daemon.

### Docker runtime metrics не рассчитались

Если k6-метрики есть, но `startupTimeSeconds`, `restartTimeSeconds`, `scalingTimeSeconds` равны нулю, проверьте:

```bash
docker exec devops-benchmark-backend docker version
```

В Docker Compose backend использует mount:

```text
/var/run/docker.sock:/var/run/docker.sock
```

### Пустая история запусков

Проверьте:

```bash
curl http://localhost:3000/benchmark-runs
```

Если массив пустой, создайте benchmark run через UI или curl.

### Нужно начать с чистой базы

```bash
docker compose down -v
docker compose up -d --build
```

## Документация

- [Архитектура](docs/architecture.md)
- [API](docs/api.md)
- [Методология benchmark](docs/benchmark-methodology.md)
- [CI/CD](docs/cicd.md)
- [Локальный запуск](docs/local-run-guide.md)
- [Чек-лист ручного тестирования](docs/manual-testing-checklist.md)

## Как понять проект за 10 минут

1. Прочитайте разделы README: «Что это за проект», «Из каких частей состоит система», «Как работает benchmark-процесс».
2. Запустите `docker compose up -d --build`.
3. Откройте `http://localhost:5173`.
4. Выполните один demo benchmark и один real benchmark.
5. Посмотрите history, charts, comparison table и historical trend.
6. Откройте [docs/architecture.md](docs/architecture.md), чтобы связать UI, backend, database и benchmark engine в одну схему.
