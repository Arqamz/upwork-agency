import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { bootstrapApp, login, server, IDS } from './helpers';

describe('Meetings (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    app = await bootstrapApp();
    const res = await login(app, 'admin@aop.local');
    adminToken = res.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/meetings', () => {
    it('should return paginated meetings', async () => {
      const res = await request(server(app))
        .get('/api/meetings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(4);
    });

    it('should filter by status', async () => {
      const res = await request(server(app))
        .get('/api/meetings?status=SCHEDULED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      for (const meeting of res.body.data) {
        expect(meeting.status).toBe('SCHEDULED');
      }
    });
  });

  describe('POST /api/meetings', () => {
    it('should create a new meeting', async () => {
      const scheduledAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(server(app))
        .post('/api/meetings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectId: IDS.PROJ_9,
          closerId: IDS.USER_CLOSER,
          type: 'CLIENT_CHECKIN',
          scheduledAt,
          notes: 'E2E test meeting',
          meetingUrl: 'https://meet.google.com/e2e-test',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.notes).toBe('E2E test meeting');
      expect(res.body.type).toBe('CLIENT_CHECKIN');
    });

    it('should return 400 with missing projectId', async () => {
      await request(server(app))
        .post('/api/meetings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scheduledAt: new Date().toISOString(),
          notes: 'Missing projectId',
        })
        .expect(400);
    });
  });

  describe('POST /api/meetings/:id/complete', () => {
    it('should complete a meeting', async () => {
      const res = await request(server(app))
        .post(`/api/meetings/${IDS.MEET_1}/complete`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Meeting completed via E2E test',
          fathomUrl: 'https://fathom.video/share/e2e',
        })
        .expect(201);

      expect(res.body.status).toBe('COMPLETED');
      expect(res.body.completedAt).toBeTruthy();
    });
  });
});
