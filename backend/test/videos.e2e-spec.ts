import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { bootstrapApp, login, server, IDS } from './helpers';

describe('Videos (e2e)', () => {
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

  describe('POST /api/videos', () => {
    let createdVideoId: string;

    it('should create a video proposal', async () => {
      const res = await request(server(app))
        .post('/api/videos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectId: IDS.PROJ_2,
          videoUrl: 'https://cdn.example.com/videos/e2e-test.mp4',
          storageKey: 'videos/e2e-test/recording.mp4',
          duration: 120,
          fileSize: 5242880,
          mimeType: 'video/mp4',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.projectId).toBe(IDS.PROJ_2);
      expect(res.body.videoUrl).toBe('https://cdn.example.com/videos/e2e-test.mp4');
      createdVideoId = res.body.id;
    });

    it('should return 400 with missing required fields', async () => {
      await request(server(app))
        .post('/api/videos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ videoUrl: 'https://cdn.example.com/missing-fields.mp4' })
        .expect(400);
    });
  });

  describe('GET /api/videos', () => {
    it('should return paginated videos', async () => {
      const res = await request(server(app))
        .get('/api/videos')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter by projectId', async () => {
      const res = await request(server(app))
        .get(`/api/videos?projectId=${IDS.PROJ_2}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      for (const video of res.body.data) {
        expect(video.projectId).toBe(IDS.PROJ_2);
      }
    });
  });

  describe('GET /api/videos/project/:projectId', () => {
    it('should return videos for a project', async () => {
      const res = await request(server(app))
        .get(`/api/videos/project/${IDS.PROJ_2}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });
});
