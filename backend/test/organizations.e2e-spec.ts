import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { bootstrapApp, login, server, IDS } from './helpers';
import { PrismaService } from '@/prisma/prisma.service';

describe('Organizations (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let bidderToken: string;

  beforeAll(async () => {
    app = await bootstrapApp();
    const adminRes = await login(app, 'admin@aop.local');
    adminToken = adminRes.accessToken;
    const bidderRes = await login(app, 'bidder@aop.local');
    bidderToken = bidderRes.accessToken;

    // Clean up any leftover test orgs from previous runs
    const prisma = app.get(PrismaService);
    await prisma.organization.deleteMany({
      where: { slug: { in: ['e2e-test-org', 'member-test-org'] } },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/organizations', () => {
    it('should list all active organizations', async () => {
      const res = await request(server(app))
        .get('/api/organizations')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('GET /api/organizations/my', () => {
    it("should return the current user's organizations", async () => {
      const res = await request(server(app))
        .get('/api/organizations/my')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/organizations/:id', () => {
    it('should return org by ID', async () => {
      const res = await request(server(app))
        .get(`/api/organizations/${IDS.ORG_DEV}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(IDS.ORG_DEV);
      expect(res.body.name).toBe('Development Services');
    });

    it('should return 400 for non-UUID id', async () => {
      await request(server(app))
        .get('/api/organizations/not-a-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('POST /api/organizations', () => {
    let createdOrgId: string;

    it('should create an organization (admin)', async () => {
      const res = await request(server(app))
        .post('/api/organizations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'E2E Test Org',
          slug: 'e2e-test-org',
          description: 'Created by E2E test',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('E2E Test Org');
      createdOrgId = res.body.id;
    });

    it('should return 403 for non-admin', async () => {
      await request(server(app))
        .post('/api/organizations')
        .set('Authorization', `Bearer ${bidderToken}`)
        .send({
          name: 'Should Fail',
          slug: 'should-fail',
        })
        .expect(403);
    });

    afterAll(async () => {
      // Clean up
      if (createdOrgId) {
        await request(server(app))
          .patch(`/api/organizations/${createdOrgId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ isActive: false });
      }
    });
  });

  describe('PATCH /api/organizations/:id', () => {
    it('should update an organization (admin)', async () => {
      const res = await request(server(app))
        .patch(`/api/organizations/${IDS.ORG_DEV}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated by E2E test' })
        .expect(200);

      expect(res.body.description).toBe('Updated by E2E test');
    });
  });

  describe('GET /api/organizations/:id/members', () => {
    it('should list members of an org', async () => {
      const res = await request(server(app))
        .get(`/api/organizations/${IDS.ORG_DEV}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('POST /api/organizations/:id/members + DELETE', () => {
    let testOrgId: string;

    beforeAll(async () => {
      // Create a test org first
      const res = await request(server(app))
        .post('/api/organizations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Member Test Org', slug: 'member-test-org' });
      testOrgId = res.body.id;
    });

    it('should add a member to an org', async () => {
      const res = await request(server(app))
        .post(`/api/organizations/${testOrgId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: IDS.USER_BIDDER })
        .expect(201);

      expect(res.body).toHaveProperty('userId');
    });

    it('should remove a member from an org', async () => {
      await request(server(app))
        .delete(`/api/organizations/${testOrgId}/members/${IDS.USER_BIDDER}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
