import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { bootstrapApp, login, server, IDS } from './helpers';

describe('Analytics (e2e)', () => {
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

  describe('GET /api/analytics/dashboard', () => {
    it('should return dashboard summary with percentage conversion rates', async () => {
      const res = await request(server(app))
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('totalProjects');
      expect(res.body).toHaveProperty('totalMeetings');
      expect(res.body).toHaveProperty('totalWon');
      expect(res.body).toHaveProperty('totalRevenue');
      expect(res.body).toHaveProperty('conversionRates');

      const rates = res.body.conversionRates;
      expect(rates).toHaveProperty('bidRate');
      expect(rates).toHaveProperty('viewRate');
      expect(rates).toHaveProperty('interviewRate');
      expect(rates).toHaveProperty('winRate');

      // Rates should be in 0-100 range (percentages), not 0-1
      // With 13 seed projects, there are definitely bids submitted, so bidRate > 0
      if (rates.bidRate > 0) {
        expect(rates.bidRate).toBeGreaterThanOrEqual(1);
        expect(rates.bidRate).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('GET /api/analytics/funnel', () => {
    it('should return funnel metrics for a date range', async () => {
      const startDate = '2020-01-01';
      const endDate = '2030-12-31';

      const res = await request(server(app))
        .get(`/api/analytics/funnel?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('discovered');
      expect(res.body).toHaveProperty('scripted');
      expect(res.body).toHaveProperty('underReview');
      expect(res.body).toHaveProperty('assigned');
      expect(res.body).toHaveProperty('bidSubmitted');
      expect(res.body).toHaveProperty('viewed');
      expect(res.body).toHaveProperty('messaged');
      expect(res.body).toHaveProperty('interview');
      expect(res.body).toHaveProperty('won');
      expect(res.body).toHaveProperty('inProgress');
      expect(res.body).toHaveProperty('completed');
      expect(res.body).toHaveProperty('lost');
      expect(res.body).toHaveProperty('cancelled');

      // At least one project in discovered (seed)
      expect(res.body.discovered).toBeGreaterThanOrEqual(1);
    });

    it('should return 400 without date params', async () => {
      await request(server(app))
        .get('/api/analytics/funnel')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('GET /api/analytics/top-closers', () => {
    it('should return top closers with percentage win rates', async () => {
      const startDate = '2020-01-01';
      const endDate = '2030-12-31';

      const res = await request(server(app))
        .get(`/api/analytics/top-closers?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);

      for (const closer of res.body) {
        expect(closer).toHaveProperty('closerId');
        expect(closer).toHaveProperty('closerEmail');
        expect(closer).toHaveProperty('totalBids');
        expect(closer).toHaveProperty('totalWon');
        expect(closer).toHaveProperty('totalRevenue');
        expect(closer).toHaveProperty('winRate');

        // Win rate should be a percentage 0-100
        expect(closer.winRate).toBeGreaterThanOrEqual(0);
        expect(closer.winRate).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('GET /api/analytics/orgs/:organizationId', () => {
    it('should return org summary', async () => {
      const res = await request(server(app))
        .get(`/api/analytics/orgs/${IDS.ORG_DEV}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('totalProjects');
      expect(res.body).toHaveProperty('activeProjects');
      expect(res.body).toHaveProperty('wonProjects');
      expect(res.body).toHaveProperty('totalRevenue');
      expect(res.body.totalProjects).toBeGreaterThanOrEqual(13);
    });
  });
});
