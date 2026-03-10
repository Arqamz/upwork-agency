import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { bootstrapApp, login, server, IDS } from './helpers';

describe('Tasks & QA (e2e)', () => {
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

  describe('GET /api/tasks', () => {
    it('should return paginated tasks', async () => {
      const res = await request(server(app))
        .get('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(7);
    });

    it('should filter by status', async () => {
      const res = await request(server(app))
        .get('/api/tasks?status=TODO')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      for (const task of res.body.data) {
        expect(task.status).toBe('TODO');
      }
    });

    it('should filter by projectId', async () => {
      const res = await request(server(app))
        .get(`/api/tasks?projectId=${IDS.PROJ_10}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      for (const task of res.body.data) {
        expect(task.projectId).toBe(IDS.PROJ_10);
      }
    });
  });

  describe('POST /api/tasks', () => {
    let createdTaskId: string;

    it('should create a task for a project', async () => {
      const res = await request(server(app))
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectId: IDS.PROJ_9,
          assigneeId: IDS.USER_OPERATOR,
          title: 'E2E Test Task',
          description: 'Created by E2E test',
          priority: 1,
          estimatedHours: 4,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('E2E Test Task');
      expect(res.body.status).toBe('TODO');
      createdTaskId = res.body.id;
    });

    it('should return 400 with missing required fields', async () => {
      await request(server(app))
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Missing projectId' })
        .expect(400);
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('should update task status', async () => {
      const res = await request(server(app))
        .patch(`/api/tasks/${IDS.TASK_2}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'DONE' })
        .expect(200);

      expect(res.body.status).toBe('DONE');
      expect(res.body.completedAt).toBeTruthy();
    });
  });

  describe('QA Reviews', () => {
    describe('GET /api/qa-reviews', () => {
      it('should return paginated QA reviews', async () => {
        const res = await request(server(app))
          .get('/api/qa-reviews')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('meta');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
      });
    });

    describe('POST /api/qa-reviews', () => {
      it('should create a QA review', async () => {
        const res = await request(server(app))
          .post('/api/qa-reviews')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            taskId: IDS.TASK_2,
            reviewerId: IDS.USER_QA,
            score: 8,
            comments: 'E2E test review',
          })
          .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body.score).toBe(8);
        expect(res.body.status).toBe('PENDING');
      });
    });

    describe('PATCH /api/qa-reviews/:id', () => {
      it('should update a QA review', async () => {
        // Get the existing review for task-1
        const getRes = await request(server(app))
          .get(`/api/qa-reviews/task/${IDS.TASK_1}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const reviewId = getRes.body.id;

        const res = await request(server(app))
          .patch(`/api/qa-reviews/${reviewId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'APPROVED', score: 10 })
          .expect(200);

        expect(res.body.status).toBe('APPROVED');
        expect(res.body.score).toBe(10);
      });
    });
  });
});
