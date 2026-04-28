import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Injectable } from '@nestjs/common';

const execFileAsync = promisify(execFile);

export type DockerRuntimeMetrics = {
  startupTimeSeconds: number;
  restartTimeSeconds: number;
  scalingTimeSeconds: number;
  warnings: string[];
};

type DockerRuntimeOptions = {
  image?: string;
  scalingContainers?: number;
};

@Injectable()
export class DockerRuntimeMetricsService {
  async measure(options: DockerRuntimeOptions = {}): Promise<DockerRuntimeMetrics> {
    const image = options.image ?? 'nginx:alpine';
    const scalingContainers = options.scalingContainers ?? 3;
    const containers: string[] = [];

    try {
      await this.ensureDockerAvailable();

      const startup = await this.startMeasuredContainer(image);
      containers.push(startup.containerId);

      const restartTimeSeconds = await this.measureRestart(startup.containerId);
      const scalingTimeSeconds = await this.measureSequentialScaling(
        image,
        scalingContainers,
        containers,
      );

      return {
        startupTimeSeconds: startup.seconds,
        restartTimeSeconds,
        scalingTimeSeconds,
        warnings: [],
      };
    } catch (error) {
      return {
        startupTimeSeconds: 0,
        restartTimeSeconds: 0,
        scalingTimeSeconds: 0,
        warnings: [this.toWarning(error)],
      };
    } finally {
      await this.cleanup(containers);
    }
  }

  private async ensureDockerAvailable() {
    await this.execDocker(['version', '--format', '{{.Server.Version}}']);
  }

  private async startMeasuredContainer(image: string) {
    const start = performance.now();
    const { stdout } = await this.execDocker(['run', '-d', '-P', image]);
    const containerId = stdout.trim();

    await this.waitUntilReady(containerId);

    return {
      containerId,
      seconds: this.elapsedSeconds(start),
    };
  }

  private async measureRestart(containerId: string) {
    const start = performance.now();

    await this.execDocker(['restart', containerId]);
    await this.waitUntilReady(containerId);

    return this.elapsedSeconds(start);
  }

  private async measureSequentialScaling(
    image: string,
    count: number,
    containers: string[],
  ) {
    const start = performance.now();

    for (let index = 0; index < count; index += 1) {
      const result = await this.startMeasuredContainer(image);
      containers.push(result.containerId);
    }

    return this.elapsedSeconds(start);
  }

  private async waitUntilReady(containerId: string) {
    const deadline = Date.now() + 30_000;

    while (Date.now() < deadline) {
      const status = await this.inspectStatus(containerId);

      if (status === 'healthy' || status === 'running') {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw new Error(`Container ${containerId} did not become ready in time.`);
  }

  private async inspectStatus(containerId: string) {
    const { stdout } = await this.execDocker([
      'inspect',
      '--format',
      '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}',
      containerId,
    ]);

    return stdout.trim();
  }

  private async cleanup(containerIds: string[]) {
    await Promise.all(
      containerIds.map(async (containerId) => {
        try {
          await this.execDocker(['rm', '-f', containerId]);
        } catch {
          // Cleanup is best-effort for benchmark helper containers.
        }
      }),
    );
  }

  private execDocker(args: string[]) {
    return execFileAsync('docker', args, {
      timeout: 60_000,
      maxBuffer: 1024 * 1024,
    });
  }

  private elapsedSeconds(start: number) {
    return Number(((performance.now() - start) / 1000).toFixed(3));
  }

  private toWarning(error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return 'Docker runtime metrics unavailable: Docker CLI not found.';
    }

    const message = error instanceof Error ? error.message : 'unknown error';

    return `Docker runtime metrics unavailable: ${message}`;
  }
}

