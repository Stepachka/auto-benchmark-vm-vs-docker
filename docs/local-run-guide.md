# Подробная инструкция локального запуска

## 1. Что должно быть установлено

Проверьте:

```bash
docker --version
docker compose version
```

Для запуска через Docker не нужно отдельно устанавливать Node.js, PostgreSQL, k6 или nginx. Всё запускается в контейнерах.

## 2. Запуск проекта

Из корня проекта:

```bash
docker compose up -d --build
```

Что произойдёт:

- соберётся backend image;
- соберётся frontend image;
- соберётся benchmark-target image;
- запустится PostgreSQL;
- запустится backend;
- запустится frontend;
- запустится benchmark-target.

## 3. Как понять, что всё поднялось успешно

```bash
docker compose ps
```

Ожидаемые сервисы:

```text
devops-benchmark-postgres
devops-benchmark-backend
devops-benchmark-frontend
devops-benchmark-target
```

Желательное состояние:

```text
healthy
```

Для frontend состояние может быть `healthy`, если healthcheck уже прошёл.

## 4. Проверка frontend

Откройте:

```text
http://localhost:5173
```

Через терминал:

```bash
curl -I http://localhost:5173
```

Ожидается:

```text
HTTP/1.1 200 OK
```

## 5. Проверка backend

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

## 6. Проверка PostgreSQL

Проверка контейнера:

```bash
docker compose ps postgres
```

Проверка через backend:

```bash
curl http://localhost:3000/benchmark-runs
```

Если backend возвращает JSON-массив, значит подключение к базе работает.

## 7. Проверка benchmark-target

```bash
curl http://localhost:4000/health
```

Ожидаемый ответ:

```json
{
  "status": "ok",
  "service": "benchmark-target"
}
```

Проверка workload endpoint:

```bash
curl http://localhost:4000/cpu-test
curl http://localhost:4000/memory-test
curl http://localhost:4000/random-delay
curl http://localhost:4000/json-large
```

## 8. Запуск demo benchmark

```bash
curl -X POST http://localhost:3000/benchmark-runs \
  -H 'Content-Type: application/json' \
  -d '{"environmentType":"docker","benchmarkMode":"demo"}'
```

Ожидается:

```text
"status":"completed"
```

## 9. Запуск real benchmark

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

Ожидается:

- `status` равен `completed`;
- `requestsPerSecond` больше 0;
- `totalRequests` больше 0;
- для Docker могут быть рассчитаны `startupTimeSeconds`, `restartTimeSeconds`, `scalingTimeSeconds`.

## 10. Проверка истории результатов

```bash
curl http://localhost:3000/benchmark-runs
```

История также отображается во frontend в таблице «История запусков».

## 11. Просмотр логов

Все сервисы:

```bash
docker compose logs
```

Только backend:

```bash
docker compose logs backend
```

Только frontend:

```bash
docker compose logs frontend
```

Только benchmark-target:

```bash
docker compose logs benchmark-target
```

Логи в режиме follow:

```bash
docker compose logs -f backend
```

## 12. Остановка проекта

```bash
docker compose down
```

Контейнеры будут остановлены, но volume PostgreSQL останется.

## 13. Пересборка контейнеров

Если изменился код:

```bash
docker compose up -d --build
```

Если нужно пересобрать только backend:

```bash
docker compose up -d --build backend
```

Если нужно пересобрать только frontend:

```bash
docker compose up -d --build frontend
```

Если нужно пересобрать только benchmark-target:

```bash
docker compose up -d --build benchmark-target
```

## 14. Удаление volume и запуск с чистой базой

```bash
docker compose down -v
docker compose up -d --build
```

После этого история benchmark-запусков будет пустой.

## 15. Частые проблемы

### Backend не healthy

Проверьте:

```bash
docker compose logs backend
docker compose ps postgres
```

### benchmark-target не отвечает

Проверьте:

```bash
docker compose logs benchmark-target
curl http://localhost:4000/health
```

### Real benchmark failed

Проверьте:

```bash
curl http://localhost:3000/benchmark-runs
```

Смотрите поле `notes`.

### Docker runtime metrics не работают

Проверьте доступ Docker CLI внутри backend:

```bash
docker exec devops-benchmark-backend docker version
```

Если команда не работает, real benchmark может выполниться без Docker runtime metrics.

