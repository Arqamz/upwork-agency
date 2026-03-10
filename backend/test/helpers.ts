import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { v5 as uuidv5 } from 'uuid';

const NS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/** Same deterministic UUID helper used in the seed */
export function sid(slug: string): string {
  return uuidv5(slug, NS);
}

/** Well-known seed IDs */
export const IDS = {
  ORG_DEV: sid('org-dev'),
  ORG_ACCOUNTING: sid('org-accounting'),
  ORG_PARALEGAL: sid('org-paralegal'),
  TEAM_ALPHA: sid('team-alpha'),
  USER_ADMIN: sid('user-admin'),
  USER_LEAD: sid('user-lead'),
  USER_BIDDER: sid('user-bidder'),
  USER_BIDDER2: sid('user-bidder2'),
  USER_CLOSER: sid('user-closer'),
  USER_CLOSER2: sid('user-closer2'),
  USER_PM: sid('user-pm'),
  USER_OPERATOR: sid('user-operator'),
  USER_OPERATOR2: sid('user-operator2'),
  USER_QA: sid('user-qa'),
  NICHE_AI: sid('niche-ai'),
  NICHE_WEB: sid('niche-web'),
  PROJ_1: sid('proj-1'),
  PROJ_2: sid('proj-2'),
  PROJ_3: sid('proj-3'),
  PROJ_8: sid('proj-8'),
  PROJ_9: sid('proj-9'),
  PROJ_10: sid('proj-10'),
  MEET_1: sid('meet-1'),
  MEET_2: sid('meet-2'),
  TASK_1: sid('task-1'),
  TASK_2: sid('task-2'),
};

let app: INestApplication;

/**
 * Bootstraps the NestJS app once for all tests in a suite.
 * Call in beforeAll().
 */
export async function bootstrapApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();
  return app;
}

/**
 * Login as a seed user and return the access token.
 */
export async function login(
  appInstance: INestApplication,
  email: string,
  password = 'password123',
): Promise<{ accessToken: string; refreshToken: string; user: any }> {
  const res = await request(appInstance.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  return res.body;
}

/**
 * Get the HTTP server for supertest.
 */
export function server(appInstance: INestApplication) {
  return appInstance.getHttpServer();
}
