# Архитектура проекта

## Назначение системы

DevOps Benchmark Platform — учебная система для сравнения окружений развертывания микросервисов. В текущей реализации сравниваются два варианта:

- `vm` — условный baseline для виртуальной машины;
- `docker` — контейнеризированное развертывание.

Система не является промышленной observability-платформой. Её цель — показать полный инженерный цикл: запуск нагрузки, сбор метрик, сохранение результатов, визуализация и автоматическая проверка через CI.

## Общая схема

```text
Пользователь
  -> Frontend Dashboard
  -> Backend REST API
  -> Benchmark Engine
  -> PostgreSQL

Real benchmark:
  Backend -> k6 -> benchmark-target
  Backend -> Docker CLI -> Docker daemon
```

## Frontend

Frontend реализован на React + TypeScript + Vite.

Основные функции:

- выбор benchmark-режима: `demo` или `real`;
- выбор окружения: `VM` или `Docker`;
- выбор target service или custom URL;
- запуск benchmark;
- отображение карточек метрик;
- графики RPS, latency и scaling time;
- сравнение последнего VM-запуска и последнего Docker-запуска;
- историческая аналитика latest vs previous;
- таблица истории запусков.

Frontend обращается к backend через REST API:

```text
VITE_API_BASE_URL=http://localhost:3000
```

## Backend

Backend реализован на NestJS.

Основные модули:

- `AppModule` — корневой модуль приложения;
- `AppConfigModule` — загрузка конфигурации из environment variables;
- `DatabaseModule` — подключение TypeORM к PostgreSQL;
- `BenchmarkRunsModule` — API запусков, benchmark engine, recommendation logic;
- `InfrastructureModule` — изолированные инфраструктурные сервисы, например Docker runtime metrics.

Backend отвечает за:

- приём запросов от frontend;
- создание записей benchmark run;
- выполнение demo или real strategy;
- сохранение метрик;
- выдачу истории запусков.

## Database

База данных — PostgreSQL.

Результаты хранятся в таблице:

```text
benchmark_runs
```

В таблице сохраняются:

- тип окружения;
- режим benchmark;
- статус;
- k6-метрики;
- Docker runtime metrics;
- recommendation;
- notes;
- время создания записи.

## Benchmark Engine

Benchmark engine использует стратегию выполнения:

```text
DemoBenchmarkService
RealBenchmarkService
```

### DemoBenchmarkService

Генерирует симулируемые значения метрик. Используется для быстрой демонстрации и проверки интерфейса.

### RealBenchmarkService

Выполняет реальный benchmark:

1. генерирует временный k6 script;
2. запускает `k6 run`;
3. читает JSON summary;
4. извлекает RPS, latency, p95, error rate, total requests;
5. для Docker-окружения вызывает Docker runtime metrics service;
6. возвращает итоговые метрики в backend service.

## Benchmark Target

`benchmark-target` — отдельный лёгкий Express-сервис для тестовой нагрузки.

Доступные endpoint:

```text
GET /health
GET /cpu-test
GET /memory-test
GET /random-delay
GET /json-large
```

Он нужен, чтобы real benchmark запускался не по абстрактному URL, а по контролируемому сервису с разными типами нагрузки.

## Docker Compose

Docker Compose поднимает всю локальную систему:

```text
postgres
backend
frontend
benchmark-target
```

Роли:

- `postgres` — хранение результатов;
- `backend` — API и benchmark execution;
- `frontend` — dashboard;
- `benchmark-target` — сервис под нагрузкой.

Backend container дополнительно получает доступ к Docker daemon через:

```text
/var/run/docker.sock:/var/run/docker.sock
```

Это нужно для измерения Docker startup/restart/scaling.

## CI/CD

GitHub Actions workflow находится здесь:

```text
.github/workflows/ci.yml
```

Pipeline:

1. собирает frontend;
2. собирает backend;
3. собирает Docker images;
4. запускает Compose services;
5. ждёт healthy-состояние backend и benchmark-target;
6. запускает real benchmark через API;
7. сохраняет результат как artifact.

## Где хранятся результаты

Все benchmark-запуски хранятся в PostgreSQL в таблице `benchmark_runs`.

Посмотреть результаты можно:

```bash
curl http://localhost:3000/benchmark-runs
```

Или через frontend:

```text
http://localhost:5173
```

## Как проходит benchmark-запуск от UI до БД

1. Пользователь нажимает кнопку запуска в dashboard.
2. Frontend формирует JSON payload.
3. Backend получает `POST /benchmark-runs`.
4. Backend сохраняет запись со статусом `pending`.
5. Backend переводит запись в `running`.
6. Benchmark engine выполняет `demo` или `real` стратегию.
7. Метрики записываются в `benchmark_runs`.
8. Статус становится `completed` или `failed`.
9. Frontend заново загружает историю.
10. Dashboard обновляет графики, comparison table, trend summary и history table.
