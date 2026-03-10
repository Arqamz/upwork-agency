import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { bootstrapApp, login, server, IDS } from './helpers';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let adminRefreshToken: string;

  beforeAll(async () => {
    app = await bootstrapApp();
    const res = await login(app, 'admin@aop.local');
    adminToken = res.accessToken;
    adminRefreshToken = res.refreshToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('should return tokens for valid credentials', async () => {
      const res = await request(server(app))
        .post('/api/auth/login')
        .send({ email: 'admin@aop.local', password: 'password123' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('admin@aop.local');
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 401 for invalid password', async () => {
      await request(server(app))
        .post('/api/auth/login')
        .send({ email: 'admin@aop.local', password: 'wrongpassword' })
        .expect(401);
    });

    it('should return 401 for non-existent email', async () => {
      await request(server(app))
        .post('/api/auth/login')
        .send({ email: 'nonexistent@aop.local', password: 'password123' })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user data with org memberships', async () => {
      const res = await request(server(app))
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.email).toBe('admin@aop.local');
      expect(res.body).toHaveProperty('role');
      expect(res.body.role.name).toBe('admin');
      expect(res.body).toHaveProperty('organizations');
      expect(Array.isArray(res.body.organizations)).toBe(true);
      expect(res.body.organizations.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 401 without a token', async () => {
      await request(server(app)).get('/api/auth/me').expect(401);
    });
  });

  describe('POST /api/auth/switch-org', () => {
    it('should return new tokens when switching to a valid org', async () => {
      const res = await request(server(app))
        .post('/api/auth/switch-org')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ organizationId: IDS.ORG_DEV })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.activeOrganizationId).toBe(IDS.ORG_DEV);
    });

    it('should return 403 when non-member switches to unaffiliated org', async () => {
      // Bidder2 is not in paralegal org
      const bidder2 = await login(app, 'bidder2@aop.local');

      await request(server(app))
        .post('/api/auth/switch-org')
        .set('Authorization', `Bearer ${bidder2.accessToken}`)
        .send({ organizationId: IDS.ORG_PARALEGAL })
        .expect(403);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return new tokens for a valid refresh token', async () => {
      // Get a fresh login to get a non-revoked refresh token
      const freshLogin = await login(app, 'bidder@aop.local');

      const res = await request(server(app))
        .post('/api/auth/refresh')
        .send({ refreshToken: freshLogin.refreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for an invalid refresh token', async () => {
      await request(server(app))
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should revoke refresh tokens', async () => {
      const freshLogin = await login(app, 'operator2@aop.local');

      await request(server(app))
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${freshLogin.accessToken}`)
        .expect(200);

      // The old refresh token should now be revoked
      await request(server(app))
        .post('/api/auth/refresh')
        .send({ refreshToken: freshLogin.refreshToken })
        .expect(401);
    });
  });
});
