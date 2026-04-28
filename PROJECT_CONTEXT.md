# Контекст проекта для следующего запуска Codex

Этот файл нужен как краткая карта проекта. Если следующий запуск Codex будет без истории диалога, сначала прочитать этот файл, затем `README.md` и профильные документы из `docs/`.

## Назначение проекта

Проект — учебная DevOps benchmark-платформа для сравнения двух подходов к развёртыванию микросервисов:

- VM baseline;
- Docker/containerized deployment.

Главная задача — запускать benchmark, сохранять результаты в PostgreSQL и показывать сравнение в web-dashboard.

Проект используется для практики/защиты, поэтому важны:

- понятный локальный запуск;
- демонстрация `demo` и `real` benchmark-режимов;
- объяснимая архитектура;
- воспроизводимые проверки;
- документация на русском языке.

## Текущая архитектура

```text
frontend -> backend -> PostgreSQL
              |
              | real benchmark
              v
        k6 -> benchmark-target
              |
              | docker runtime metrics
              v
          Docker CLI / Docker socket
```

Основные части:

- `frontend/` — React + TypeScript + Vite dashboard.
- `backend/` — NestJS REST API.
- `benchmark-target/` — лёгкий Node.js + Express сервис с workload endpoint.
- `docker-compose.yml` — локальная инфраструктура: PostgreSQL, backend, frontend, benchmark-target.
- `.github/workflows/ci.yml` — CI: build frontend/backend, build Docker images, real benchmark smoke test.
- `infra/terraform/` — минимальная образовательная IaC-заготовка.

## Backend

Стек:

- NestJS;
- TypeORM;
- PostgreSQL;
- k6 для real benchmark;
- Docker CLI для runtime metrics в Docker-сценарии.

Ключевые API:

- `GET /health`
- `GET /benchmark-runs`
- `GET /benchmark-runs/:id`
- `POST /benchmark-runs`

Сущность `benchmark_runs` хранит:

- `environmentType`: `vm` или `docker`;
- `benchmarkMode`: `demo` или `real`;
- `status`: `pending`, `running`, `completed`, `failed`;
- `timeToProvisionSeconds`;
- `leadTimeSeconds`;
- `scalingTimeSeconds`;
- `startupTimeSeconds`;
- `restartTimeSeconds`;
- `rps`;
- `latencyMs`;
- `p95LatencyMs`;
- `errorRatePercent`;
- `totalRequests`;
- `cpuOverheadPercent`;
- `recommendation`;
- `notes`.

Benchmark engine реализован через strategy-подход:

- `DemoBenchmarkService` — симулирует реалистичные метрики.
- `RealBenchmarkService` — запускает k6 против `targetUrl`, парсит результат и сохраняет метрики.
- Docker runtime metrics изолированы в инфраструктурном сервисе.

## Frontend

Dashboard переведён на русский язык.

Основные блоки:

- header со статусом backend;
- панель запуска benchmark;
- выбор среды `VM / Docker`;
- выбор режима `Demo / Real`;
- target service: `benchmark-target` или custom URL;
- advanced options: длительность, пользователи, запросы;
- metric cards;
- графики RPS, latency, scaling time;
- исторический тренд;
- таблица сравнения VM vs Docker;
- recommendation panel;
- история запусков.

Используется минимальный state management через React state/hooks. Redux не используется.

## Benchmark target

Папка: `benchmark-target/`.

Endpoint:

- `GET /health`
- `GET /cpu-test`
- `GET /memory-test`
- `GET /random-delay`
- `GET /json-large`

Назначение — дать реалистичную цель для k6 без подключения внешних сервисов.

## Документация

Документация полностью адаптирована на русский язык.

Файлы:

- `README.md` — главный вход в проект.
- `docs/architecture.md` — архитектура простым языком.
- `docs/api.md` — API, curl/Postman, примеры запросов и ответов.
- `docs/benchmark-methodology.md` — методология метрик и интерпретация.
- `docs/cicd.md` — CI/CD flow.
- `docs/local-run-guide.md` — подробный локальный запуск.
- `docs/manual-testing-checklist.md` — ручной чек-лист перед демонстрацией.
- `infra/terraform/README.md` — роль Terraform/IaC.

`docs/deployment.md` сейчас отсутствует.

## Что было сделано в последней сессии

1. Проведена ревизия всей пользовательской markdown-документации.
2. README переписан на русском и расширен разделами:
   - что это за проект;
   - для чего он нужен;
   - состав системы;
   - benchmark-процесс;
   - режимы `demo / real`;
   - локальный запуск;
   - проверки frontend/backend/database/benchmark-target;
   - ручной benchmark;
   - метрики и их смысл;
   - сценарии тестирования;
   - что проверять перед защитой;
   - типичные ошибки.
3. Добавлены:
   - `docs/manual-testing-checklist.md`;
   - `docs/local-run-guide.md`.
4. Переписаны:
   - `docs/architecture.md`;
   - `docs/api.md`;
   - `docs/benchmark-methodology.md`;
   - `docs/cicd.md`;
   - `infra/terraform/README.md`.
5. Переведён видимый frontend-интерфейс на русский язык.
6. Проверена сборка frontend:

```bash
cd frontend
npm run build
```

Сборка прошла успешно. Предупреждение Vite о размере чанка связано с chart-библиотекой и не является ошибкой.

## Как запускать локально

Быстрый запуск:

```bash
docker compose up --build
```

URL:

- frontend: `http://localhost:5173`
- backend health: `http://localhost:3000/health`
- benchmark-target health: `http://localhost:4000/health`

Остановка:

```bash
docker compose down
```

Полная очистка БД:

```bash
docker compose down -v
docker compose up --build
```

Подробности: `docs/local-run-guide.md`.

## Быстрая ручная проверка API

Health:

```bash
curl http://localhost:3000/health
```

История:

```bash
curl http://localhost:3000/benchmark-runs
```

Demo benchmark:

```bash
curl -X POST http://localhost:3000/benchmark-runs \
  -H "Content-Type: application/json" \
  -d '{
    "environmentType": "docker",
    "benchmarkMode": "demo",
    "status": "completed"
  }'
```

Real benchmark:

```bash
curl -X POST http://localhost:3000/benchmark-runs \
  -H "Content-Type: application/json" \
  -d '{
    "environmentType": "docker",
    "benchmarkMode": "real",
    "targetUrl": "http://benchmark-target:4000/health",
    "durationSeconds": 10,
    "vus": 1
  }'
```

Важно: внутри Docker Compose backend должен обращаться к `benchmark-target` по адресу `http://benchmark-target:4000/...`, а не `localhost`.

## Что проверять перед защитой

См. `docs/manual-testing-checklist.md`.

Минимум:

1. `docker compose up --build` запускает все сервисы.
2. `GET /health` возвращает `ok`.
3. frontend открывается.
4. benchmark-target отвечает.
5. demo benchmark создаёт запись.
6. real benchmark создаёт запись.
7. история запусков отображается.
8. графики строятся.
9. VM и Docker сравниваются.
10. recommendation panel показывает понятный вывод.
11. CI workflow есть и описан.
12. Terraform layer объяснён как будущий IaC-слой.

## Правила дальнейшей работы

- Не менять архитектуру без явного запроса.
- Не добавлять тяжёлые UI-фреймворки.
- Сохранять frontend/backend разделёнными.
- Для документации писать на русском академично-инженерным стилем.
- Для пользовательского UI писать на русском, технические термины можно оставлять, если они общеприняты: `benchmark`, `backend`, `frontend`, `RPS`, `latency`, `Docker`, `VM`.
- При изменениях backend проверять API и DTO.
- При изменениях frontend запускать:

```bash
cd frontend
npm run build
```

- При изменениях backend запускать:

```bash
cd backend
npm run build
```

- При изменениях Docker/интеграции проверять:

```bash
docker compose up --build
```

## Как быстро понять проект за 10 минут

1. Прочитать `README.md` до раздела "Как запустить проект локально".
2. Посмотреть схему в `docs/architecture.md`.
3. Открыть `docs/api.md` и понять `POST /benchmark-runs`.
4. Прочитать `docs/benchmark-methodology.md`, особенно различия `demo` и `real`.
5. Запустить проект по `docs/local-run-guide.md`.
6. Пройти краткий сценарий из `docs/manual-testing-checklist.md`.
