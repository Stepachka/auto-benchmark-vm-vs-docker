import express from 'express';

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.get('/health', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'benchmark-target',
  });
});

app.get('/cpu-test', (_request, response) => {
  const startedAt = performance.now();
  let result = 0;

  while (performance.now() - startedAt < 75) {
    result += Math.sqrt(Math.random() * 1000);
  }

  response.json({
    workload: 'cpu-test',
    durationMs: Number((performance.now() - startedAt).toFixed(2)),
    result: Number(result.toFixed(2)),
  });
});

app.get('/memory-test', (_request, response) => {
  const items = Array.from({ length: 25_000 }, (_, index) => ({
    id: index,
    value: `benchmark-item-${index}`,
  }));

  response.json({
    workload: 'memory-test',
    items: items.length,
    sample: items.slice(0, 5),
  });
});

app.get('/random-delay', async (_request, response) => {
  const delayMs = randomInt(50, 500);

  await delay(delayMs);

  response.json({
    workload: 'random-delay',
    delayMs,
  });
});

app.get('/json-large', (_request, response) => {
  const payload = Array.from({ length: 1000 }, (_, index) => ({
    id: index,
    name: `service-${index}`,
    status: index % 2 === 0 ? 'active' : 'idle',
    latencyBudgetMs: randomInt(50, 250),
  }));

  response.json({
    workload: 'json-large',
    count: payload.length,
    payload,
  });
});

app.listen(port, () => {
  console.log(`benchmark-target listening on port ${port}`);
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

