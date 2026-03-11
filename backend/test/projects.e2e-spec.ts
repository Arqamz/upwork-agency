import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { bootstrapApp, login, server, IDS } from './helpers';

describe('Projects (e2e)', () => {
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

  describe('GET /api/projects', () => {
    it('should return paginated projects', async () => {
      const res = await request(server(app))
        .get('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('limit');
      expect(res.body.meta).toHaveProperty('totalPages');
      expect(res.body.meta.total).toBeGreaterThanOrEqual(13);
    });

    it('should filter by stage', async () => {
      const res = await request(server(app))
        .get('/api/projects?stage=DISCOVERED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      for (const project of res.body.data) {
        expect(project.stage).toBe('DISCOVERED');
      }
    });

    it('should filter by organizationId', async () => {
      const res = await request(server(app))
        .get(`/api/projects?organizationId=${IDS.ORG_DEV}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should support pagination', async () => {
      const res = await request(server(app))
        .get('/api/projects?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.meta.limit).toBe(2);
      expect(res.body.meta.page).toBe(1);
    });
  });

  describe('GET /api/projects/pipeline', () => {
    it('should return pipeline stage counts', async () => {
      const res = await request(server(app))
        .get('/api/projects/pipeline')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      // Should have entries for all stages
      const stages = res.body.map((item: any) => item.stage);
      expect(stages).toContain('DISCOVERED');
      expect(stages).toContain('COMPLETED');
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return a project by ID', async () => {
      const res = await request(server(app))
        .get(`/api/projects/${IDS.PROJ_1}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(IDS.PROJ_1);
      expect(res.body.title).toBe('Build AI Customer Support Chatbot');
      expect(res.body.stage).toBe('DISCOVERED');
    });

    it('should return 400 for non-UUID id', async () => {
      await request(server(app))
        .get('/api/projects/not-a-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('POST /api/projects', () => {
    let createdProjectId: string;

    it('should create a new project', async () => {
      const res = await request(server(app))
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'E2E Test Project',
          pricingType: 'FIXED',
          fixedPrice: 5000,
          organizationId: IDS.ORG_DEV,
          nicheId: IDS.NICHE_AI,
          teamId: IDS.TEAM_ALPHA,
          discoveredById: IDS.USER_BIDDER,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('E2E Test Project');
      expect(res.body.stage).toBe('DISCOVERED');
      createdProjectId = res.body.id;
    });

    it('should return 400 with missing required fields', async () => {
      await request(server(app))
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Missing Fields' })
        .expect(400);
    });

    afterAll(async () => {
      // Clean up the test project if created
      if (createdProjectId) {
        await request(server(app))
          .patch(`/api/projects/${createdProjectId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ stage: 'CANCELLED' });
      }
    });
  });

  describe('PATCH /api/projects/:id', () => {
    it('should update project fields', async () => {
      const res = await request(server(app))
        .patch(`/api/projects/${IDS.PROJ_1}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ jobDescription: 'Updated description for E2E test' })
        .expect(200);

      expect(res.body.jobDescription).toBe('Updated description for E2E test');
    });
  });

  describe('POST /api/projects/:id/advance', () => {
    it('should advance DISCOVERED to SCRIPTED', async () => {
      // First create a fresh project to advance
      const createRes = await request(server(app))
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'E2E Advance Test',
          pricingType: 'FIXED',
          fixedPrice: 1000,
          organizationId: IDS.ORG_DEV,
        })
        .expect(201);

      const id = createRes.body.id;

      const res = await request(server(app))
        .post(`/api/projects/${id}/advance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.stage).toBe('SCRIPTED');
    });
  });

  describe('PATCH /api/projects/:id/assign', () => {
    it('should assign a closer without changing stage', async () => {
      const res = await request(server(app))
        .patch(`/api/projects/${IDS.PROJ_3}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assignedCloserId: IDS.USER_CLOSER })
        .expect(200);

      expect(res.body.assignedCloserId).toBe(IDS.USER_CLOSER);
      // Assign no longer auto-advances stage
      expect(res.body.stage).toBe('UNDER_REVIEW');
    });
  });

  describe('POST /api/projects/:id/review', () => {
    it('should approve a project under review', async () => {
      const res = await request(server(app))
        .post(`/api/projects/${IDS.PROJ_3}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'APPROVED',
          comments: 'Looks good, proceed with bid.',
          reviewedById: IDS.USER_LEAD,
        })
        .expect(200);

      expect(res.body.reviewStatus).toBe('APPROVED');
      expect(res.body.reviewComments).toBe('Looks good, proceed with bid.');
      expect(res.body.stage).toBe('UNDER_REVIEW');
    });

    it('should reject a project under review', async () => {
      // First reset PROJ_3 review back to PENDING so we can reject it
      await request(server(app))
        .post(`/api/projects/${IDS.PROJ_3}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PENDING' })
        .expect(200);

      const res = await request(server(app))
        .post(`/api/projects/${IDS.PROJ_3}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'REJECTED',
          comments: 'Needs more detail in the cover letter.',
          reviewedById: IDS.USER_LEAD,
        })
        .expect(200);

      expect(res.body.reviewStatus).toBe('REJECTED');
      expect(res.body.reviewComments).toBe('Needs more detail in the cover letter.');
    });

    it('should allow advance from UNDER_REVIEW when approved', async () => {
      // Create a fresh project and advance to UNDER_REVIEW, then approve
      const createRes = await request(server(app))
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'E2E Review Advance Test',
          pricingType: 'FIXED',
          fixedPrice: 2000,
          organizationId: IDS.ORG_DEV,
        })
        .expect(201);

      const id = createRes.body.id;

      // DISCOVERED -> SCRIPTED
      await request(server(app))
        .post(`/api/projects/${id}/advance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // SCRIPTED -> UNDER_REVIEW (auto-sets reviewStatus: PENDING)
      await request(server(app))
        .post(`/api/projects/${id}/advance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Approve the review
      await request(server(app))
        .post(`/api/projects/${id}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'APPROVED', reviewedById: IDS.USER_LEAD })
        .expect(200);

      // Now advance should work: UNDER_REVIEW -> BID_SUBMITTED
      const res = await request(server(app))
        .post(`/api/projects/${id}/advance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.stage).toBe('BID_SUBMITTED');
    });

    it('should block advance from UNDER_REVIEW when not approved', async () => {
      // Create a fresh project and advance to UNDER_REVIEW (PENDING)
      const createRes = await request(server(app))
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'E2E Review Block Test',
          pricingType: 'FIXED',
          fixedPrice: 1500,
          organizationId: IDS.ORG_DEV,
        })
        .expect(201);

      const id = createRes.body.id;

      // DISCOVERED -> SCRIPTED
      await request(server(app))
        .post(`/api/projects/${id}/advance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // SCRIPTED -> UNDER_REVIEW (auto-sets reviewStatus: PENDING)
      await request(server(app))
        .post(`/api/projects/${id}/advance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Trying to advance from UNDER_REVIEW without approval should fail
      await request(server(app))
        .post(`/api/projects/${id}/advance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('GET /api/projects with excludeStages', () => {
    it('should exclude specified stages', async () => {
      const res = await request(server(app))
        .get('/api/projects?excludeStages=COMPLETED,LOST,CANCELLED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      for (const project of res.body.data) {
        expect(['COMPLETED', 'LOST', 'CANCELLED']).not.toContain(project.stage);
      }
    });
  });
});
