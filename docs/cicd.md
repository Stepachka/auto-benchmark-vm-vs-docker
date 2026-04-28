# CI/CD

## Назначение

CI/CD проверяет, что проект собирается и может выполнить базовый real benchmark в автоматическом окружении.

Workflow-файл:

```text
.github/workflows/ci.yml
```

Запускается на:

```text
push в main
pull_request
```

## Этапы workflow

## Сборка frontend

Шаги:

1. checkout repository;
2. установка Node.js 20;
3. `npm ci` в `frontend`;
4. `npm run build`.

Проверяет, что React/Vite dashboard собирается без TypeScript-ошибок.

## Сборка backend

Шаги:

1. checkout repository;
2. установка Node.js 20;
3. `npm ci` в `backend`;
4. `npm run build`.

Проверяет, что NestJS backend собирается без TypeScript-ошибок.

## Сборка Docker-образов

Собирает Docker images:

```text
backend
frontend
benchmark-target
```

Это подтверждает, что приложения можно упаковать в контейнеры.

## Smoke-тест real benchmark

Самый важный интеграционный этап.

Шаги:

1. запускает Compose services:

```text
postgres
backend
benchmark-target
```

2. ждёт healthy-состояние backend;
3. ждёт healthy-состояние benchmark-target;
4. отправляет `POST /benchmark-runs` с `benchmarkMode=real`;
5. сохраняет ответ в `benchmark-result.json`;
6. проверяет, что `status === "completed"`;
7. загружает `benchmark-result.json` как artifact;
8. останавливает Compose services через `docker compose down -v`.

## Что проверяет benchmark stage

Benchmark stage проверяет не только сборку, но и реальную связку:

```text
backend -> k6 -> benchmark-target -> PostgreSQL
```

Также backend container имеет Docker CLI и mount Docker socket, поэтому может проверить Docker runtime metrics.

## Артефакт с результатом

Результат benchmark сохраняется как GitHub Actions artifact:

```text
benchmark-result
```

Файл внутри artifact:

```text
benchmark-result.json
```

Этот файл можно использовать в отчёте как подтверждение автоматического benchmark-запуска.

## Роль Docker в CI/CD

Docker используется для:

- воспроизводимого окружения;
- проверки контейнерной сборки;
- запуска PostgreSQL;
- запуска backend;
- запуска benchmark-target;
- выполнения real benchmark.

## Роль Terraform в CI/CD

Terraform пока не выполняет cloud deployment. Его роль — заготовка IaC-слоя.

В будущем в CI можно добавить:

```bash
cd infra/terraform
terraform fmt -check
terraform init -backend=false
terraform validate
terraform plan
```

`terraform apply` не стоит запускать автоматически в обычном pull request. Для учебного проекта достаточно `fmt`, `validate`, `plan`.

## Что проверить перед защитой

- workflow существует;
- jobs называются понятно;
- frontend и backend build проходят;
- Docker images собираются;
- benchmark stage запускает real benchmark;
- artifact `benchmark-result` создаётся;
- в README объяснено, зачем нужен CI/CD.
