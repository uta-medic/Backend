import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApplication } from './../src/configure-app';
import { SupabaseService } from './../src/database/supabase.service';
import { FoundryDoctorService } from './../src/doctor-ai/foundry-doctor.service';

describe('Backend infrastructure (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    process.env.FRONTEND_URL = 'http://localhost:5173';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue({})
      .overrideProvider(FoundryDoctorService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app, { enableSwagger: false });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('preserves the official root endpoint under the global prefix', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect('Hello World!');

    expect(response.headers['x-correlation-id']).toBeDefined();
  });

  it('GET / returns 404 with a generated correlation ID', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(404);

    expect(response.headers['x-correlation-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    const responseBody = response.body as { correlationId?: unknown };
    expect(responseBody.correlationId).toBe(
      response.headers['x-correlation-id'],
    );
  });

  it('GET /api/v1/health returns the public health contract', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'utamedic-backend',
    });
    expect(response.text).toMatch(
      /"timestamp":"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z"/,
    );
    expect(JSON.stringify(response.body)).not.toMatch(
      /azure|sql|foundry|agent.?id|secret/i,
    );
  });

  it('propagates a valid correlation ID to the response', async () => {
    const correlationId = 'utamedic-test-123';
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('X-Correlation-Id', correlationId)
      .expect(200);

    expect(response.headers['x-correlation-id']).toBe(correlationId);
  });

  it('replaces invalid correlation IDs', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('X-Correlation-Id', 'invalid value with spaces')
      .expect(200);

    expect(response.headers['x-correlation-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('replaces correlation IDs longer than 128 characters', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('X-Correlation-Id', 'a'.repeat(129))
      .expect(200);

    expect(response.headers['x-correlation-id']).not.toBe('a'.repeat(129));
  });

  it('returns the uniform error contract for an unknown API route', async () => {
    const correlationId = 'unknown-route-test';
    const response = await request(app.getHttpServer())
      .get('/api/v1/no-existe')
      .set('X-Correlation-Id', correlationId)
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'Cannot GET /api/v1/no-existe',
      path: '/api/v1/no-existe',
      correlationId,
    });
    expect(response.text).toMatch(
      /"timestamp":"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z"/,
    );
  });

  it('allows the configured local frontend origin', async () => {
    const response = await request(app.getHttpServer())
      .options('/api/v1/health')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'x-doctor-user-id')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
    expect(response.headers['access-control-allow-headers']).toContain(
      'X-Doctor-User-Id',
    );
  });

  it('does not authorize an unconfigured frontend origin', async () => {
    const response = await request(app.getHttpServer())
      .options('/api/v1/health')
      .set('Origin', 'https://untrusted.example')
      .set('Access-Control-Request-Method', 'GET')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
