import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { AppModule } from './app.module';

async function canConnect(params: {
  host: string;
  port: number;
  timeoutMs: number;
}): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const onDone = (ok: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(params.timeoutMs);
    socket.once('connect', () => onDone(true));
    socket.once('timeout', () => onDone(false));
    socket.once('error', () => onDone(false));
    socket.connect(params.port, params.host);
  });
}

async function ensureRedisRunning(): Promise<void> {
  const host = process.env.REDIS_HOST ?? '127.0.0.1';
  const port = Number(process.env.REDIS_PORT ?? 6379);
  const autostart =
    (process.env.REDIS_AUTOSTART ?? '').toLowerCase() === 'true';

  if (autostart && process.env.NODE_ENV === 'production') {
    throw new Error(
      'REDIS_AUTOSTART is not allowed in production. Run Redis as a separate service and disable REDIS_AUTOSTART.',
    );
  }

  const isLocalHost =
    host === '127.0.0.1' || host === 'localhost' || host === '::1';
  if (autostart && !isLocalHost) {
    throw new Error(
      `REDIS_AUTOSTART is only supported for local Redis hosts (localhost/127.0.0.1/::1). Current REDIS_HOST=${host}.`,
    );
  }

  const ok = await canConnect({ host, port, timeoutMs: 300 });
  if (ok) {
    return;
  }

  if (!autostart) {
    throw new Error(
      `Redis is not reachable at ${host}:${port}. Start Redis or set REDIS_AUTOSTART=true (local only).`,
    );
  }

  const started = await new Promise<boolean>((resolve, reject) => {
    const child = spawn('redis-server', ['--port', String(port)], {
      detached: true,
      stdio: 'ignore',
    });

    let settled = false;

    child.once('error', (err) => {
      if (settled) {
        return;
      }
      settled = true;
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(
          new Error(
            'redis-server is not installed or not in PATH. Install Redis locally, or run Redis separately, then restart the API.',
          ),
        );
        return;
      }
      reject(err);
    });

    child.unref();

    setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(true);
    }, 25);
  });

  if (!started) {
    throw new Error('Failed to spawn redis-server');
  }

  for (let i = 0; i < 10; i += 1) {
    await new Promise((r) => setTimeout(r, 200));
    const ready = await canConnect({ host, port, timeoutMs: 300 });
    if (ready) {
      return;
    }
  }

  throw new Error(
    `Failed to start Redis automatically on ${host}:${port}. Ensure redis-server is installed and available in PATH.`,
  );
}

async function bootstrap() {
  await ensureRedisRunning();
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Finance Core API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
