import type { BenchmarkRun } from './types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

async function request<T>(path: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getBackendHealth() {
  return request<{ status: string; service: string }>('/health');
}

export async function getBenchmarkRuns() {
  return request<BenchmarkRun[]>('/benchmark-runs');
}

export async function createBenchmarkRun(
  payload: Omit<BenchmarkRun, 'id' | 'createdAt'>,
) {
  return request<BenchmarkRun>('/benchmark-runs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
