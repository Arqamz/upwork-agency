import 'dotenv/config';
import {
  PrismaClient,
  ProjectStage,
  PricingType,
  MeetingType,
  MeetingStatus,
  TaskStatus,
  ReviewStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { v5 as uuidv5 } from 'uuid';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Namespace UUID for deterministic v5 generation (randomly chosen, stable)
const NS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // DNS namespace — safe to reuse

/** Deterministic UUID from a human-readable slug */
function sid(slug: string): string {
  return uuidv5(slug, NS);
}

// Pre-computed IDs for cross-referencing
const IDS = {
  // Organizations
  ORG_DEV: sid('org-dev'),
  ORG_ACCOUNTING: sid('org-accounting'),
  ORG_PARALEGAL: sid('org-paralegal'),
  // Teams
  TEAM_ALPHA: sid('team-alpha'),
  TEAM_BETA: sid('team-beta'),
  TEAM_OPS: sid('team-ops'),
  TEAM_QA: sid('team-qa'),
  // Users
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
  // Niches
  NICHE_AI: sid('niche-ai'),
  NICHE_WEB: sid('niche-web'),
  NICHE_APP: sid('niche-app'),
  NICHE_DEVOPS: sid('niche-devops'),
  NICHE_BOOKKEEPING: sid('niche-bookkeeping'),
  NICHE_TAX: sid('niche-tax'),
  NICHE_LEGAL_RESEARCH: sid('niche-legal-research'),
  // Projects
  PROJ_1: sid('proj-1'),
  PROJ_2: sid('proj-2'),
  PROJ_3: sid('proj-3'),
  PROJ_4: sid('proj-4'),
  PROJ_5: sid('proj-5'),
  PROJ_6: sid('proj-6'),
  PROJ_7: sid('proj-7'),
  PROJ_8: sid('proj-8'),
  PROJ_9: sid('proj-9'),
  PROJ_10: sid('proj-10'),
  PROJ_11: sid('proj-11'),
  PROJ_12: sid('proj-12'),
  PROJ_13: sid('proj-13'),
  // Meetings
  MEET_1: sid('meet-1'),
  MEET_2: sid('meet-2'),
  MEET_3: sid('meet-3'),
  MEET_4: sid('meet-4'),
  // Tasks
  TASK_1: sid('task-1'),
  TASK_2: sid('task-2'),
  TASK_3: sid('task-3'),
  TASK_4: sid('task-4'),
  TASK_5: sid('task-5'),
  TASK_6: sid('task-6'),
  TASK_7: sid('task-7'),
  // Milestones
  MS_1: sid('ms-1'),
  MS_2: sid('ms-2'),
  MS_3: sid('ms-3'),
  MS_4: sid('ms-4'),
  MS_5: sid('ms-5'),
  MS_6: sid('ms-6'),
};

async function main() {
  console.log('Seeding database...');

  const roles = await seedRoles();
  const teams = await seedTeams();
  const orgs = await seedOrganizations();
  const users = await seedUsers(roles, teams);
  await seedUserOrganizations(users, orgs);
  const niches = await seedNiches(orgs);
  await seedProjects(users, orgs, niches, teams);

  console.log('Seed completed successfully.');
}

// -------------------------------------------------------
// Roles
// -------------------------------------------------------
async function seedRoles() {
  const roleNames = ['admin', 'bidder', 'closer', 'operator', 'qa', 'lead', 'project_manager'];
  const roles: Record<string, { id: string; name: string }> = {};

  for (const name of roleNames) {
    roles[name] = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('  Roles seeded:', roleNames.join(', '));
  return roles;
}

// -------------------------------------------------------
// Teams
// -------------------------------------------------------
async function seedTeams() {
  const teamDefs = [
    { id: IDS.TEAM_ALPHA, name: 'Alpha Sales' },
    { id: IDS.TEAM_BETA, name: 'Beta Sales' },
    { id: IDS.TEAM_OPS, name: 'Operations' },
    { id: IDS.TEAM_QA, name: 'QA' },
  ];

  const teams: Record<string, { id: string; name: string }> = {};

  for (const t of teamDefs) {
    teams[t.id] = await prisma.team.upsert({
      where: { id: t.id },
      update: { name: t.name },
      create: t,
    });
  }

  console.log('  Teams seeded:', teamDefs.map((t) => t.name).join(', '));
  return teams;
}

// -------------------------------------------------------
// Organizations
// -------------------------------------------------------
async function seedOrganizations() {
  const orgDefs = [
    {
      id: IDS.ORG_DEV,
      name: 'Development Services',
      slug: 'development-services',
      description: 'Full-stack web & app development, AI automation, DevOps',
      isActive: true,
    },
    {
      id: IDS.ORG_ACCOUNTING,
      name: 'Accounting Services',
      slug: 'accounting-services',
      description: 'Bookkeeping, tax preparation, financial reporting',
      isActive: true,
    },
    {
      id: IDS.ORG_PARALEGAL,
      name: 'Paralegal Services',
      slug: 'paralegal-services',
      description: 'Legal research, document drafting, case management',
      isActive: true,
    },
  ];

  const orgs: Record<string, { id: string; name: string; slug: string }> = {};

  for (const o of orgDefs) {
    orgs[o.id] = await prisma.organization.upsert({
      where: { slug: o.slug },
      update: { id: o.id, name: o.name, description: o.description, isActive: o.isActive },
      create: o,
    });
  }

  console.log('  Organizations seeded:', orgDefs.map((o) => o.name).join(', '));
  return orgs;
}

// -------------------------------------------------------
// Users
// -------------------------------------------------------
async function seedUsers(
  roles: Record<string, { id: string }>,
  teams: Record<string, { id: string }>,
) {
  const password = await bcrypt.hash('password123', 10);

  const userDefs = [
    {
      id: IDS.USER_ADMIN,
      email: 'admin@aop.local',
      firstName: 'Admin',
      lastName: 'User',
      roleId: roles.admin.id,
      teamId: teams[IDS.TEAM_ALPHA].id,
    },
    {
      id: IDS.USER_LEAD,
      email: 'lead@aop.local',
      firstName: 'Morgan',
      lastName: 'Davis',
      roleId: roles.lead.id,
      teamId: teams[IDS.TEAM_ALPHA].id,
    },
    {
      id: IDS.USER_BIDDER,
      email: 'bidder@aop.local',
      firstName: 'Sarah',
      lastName: 'Chen',
      roleId: roles.bidder.id,
      teamId: teams[IDS.TEAM_ALPHA].id,
    },
    {
      id: IDS.USER_BIDDER2,
      email: 'bidder2@aop.local',
      firstName: 'Ryan',
      lastName: 'Park',
      roleId: roles.bidder.id,
      teamId: teams[IDS.TEAM_ALPHA].id,
    },
    {
      id: IDS.USER_CLOSER,
      email: 'closer@aop.local',
      firstName: 'James',
      lastName: 'Wilson',
      roleId: roles.closer.id,
      teamId: teams[IDS.TEAM_ALPHA].id,
    },
    {
      id: IDS.USER_CLOSER2,
      email: 'closer2@aop.local',
      firstName: 'Maria',
      lastName: 'Garcia',
      roleId: roles.closer.id,
      teamId: teams[IDS.TEAM_ALPHA].id,
    },
    {
      id: IDS.USER_PM,
      email: 'pm@aop.local',
      firstName: 'Taylor',
      lastName: 'Brooks',
      roleId: roles.project_manager.id,
      teamId: teams[IDS.TEAM_OPS].id,
    },
    {
      id: IDS.USER_OPERATOR,
      email: 'operator@aop.local',
      firstName: 'Alex',
      lastName: 'Kim',
      roleId: roles.operator.id,
      teamId: teams[IDS.TEAM_OPS].id,
    },
    {
      id: IDS.USER_OPERATOR2,
      email: 'operator2@aop.local',
      firstName: 'Casey',
      lastName: 'Rivera',
      roleId: roles.operator.id,
      teamId: teams[IDS.TEAM_OPS].id,
    },
    {
      id: IDS.USER_QA,
      email: 'qa@aop.local',
      firstName: 'Pat',
      lastName: 'Taylor',
      roleId: roles.qa.id,
      teamId: teams[IDS.TEAM_QA].id,
    },
  ];

  const users: Record<string, { id: string; email: string }> = {};

  for (const u of userDefs) {
    users[u.id] = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        roleId: u.roleId,
        teamId: u.teamId,
        passwordHash: password,
        isActive: true,
      },
      create: {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        roleId: u.roleId,
        teamId: u.teamId,
        passwordHash: password,
        isActive: true,
      },
    });
  }

  console.log('  Users seeded:', userDefs.map((u) => u.email).join(', '));
  return users;
}

// -------------------------------------------------------
// User <-> Organization memberships
// -------------------------------------------------------
async function seedUserOrganizations(
  users: Record<string, { id: string }>,
  orgs: Record<string, { id: string }>,
) {
  // All users belong to Development Services
  // Some also belong to Accounting/Paralegal for demo purposes
  const assignments = [
    // Everyone in dev org
    ...Object.values(users).map((u) => ({
      userId: u.id,
      organizationId: orgs[IDS.ORG_DEV].id,
    })),
    // Lead and admin also in accounting
    { userId: users[IDS.USER_ADMIN].id, organizationId: orgs[IDS.ORG_ACCOUNTING].id },
    { userId: users[IDS.USER_LEAD].id, organizationId: orgs[IDS.ORG_ACCOUNTING].id },
    { userId: users[IDS.USER_BIDDER].id, organizationId: orgs[IDS.ORG_ACCOUNTING].id },
    { userId: users[IDS.USER_CLOSER].id, organizationId: orgs[IDS.ORG_ACCOUNTING].id },
    // Admin and lead also in paralegal
    { userId: users[IDS.USER_ADMIN].id, organizationId: orgs[IDS.ORG_PARALEGAL].id },
    { userId: users[IDS.USER_LEAD].id, organizationId: orgs[IDS.ORG_PARALEGAL].id },
  ];

  for (const a of assignments) {
    await prisma.userOrganization.upsert({
      where: { userId_organizationId: { userId: a.userId, organizationId: a.organizationId } },
      update: {},
      create: a,
    });
  }

  console.log('  User-organization memberships seeded.');
}

// -------------------------------------------------------
// Niches (org-scoped)
// -------------------------------------------------------
async function seedNiches(orgs: Record<string, { id: string }>) {
  const nicheDefs = [
    // Development Services niches
    {
      id: IDS.NICHE_AI,
      name: 'AI Automation',
      slug: 'ai-automation',
      description: 'AI agents, chatbots, workflow automation',
      organizationId: orgs[IDS.ORG_DEV].id,
    },
    {
      id: IDS.NICHE_WEB,
      name: 'Web Development',
      slug: 'web-development',
      description: 'Full-stack web applications and websites',
      organizationId: orgs[IDS.ORG_DEV].id,
    },
    {
      id: IDS.NICHE_APP,
      name: 'App Development',
      slug: 'app-development',
      description: 'Mobile and desktop applications',
      organizationId: orgs[IDS.ORG_DEV].id,
    },
    {
      id: IDS.NICHE_DEVOPS,
      name: 'DevOps & Cloud',
      slug: 'devops-cloud',
      description: 'Infrastructure, CI/CD, cloud architecture',
      organizationId: orgs[IDS.ORG_DEV].id,
    },
    // Accounting Services niches
    {
      id: IDS.NICHE_BOOKKEEPING,
      name: 'Bookkeeping',
      slug: 'bookkeeping',
      description: 'Day-to-day financial record keeping',
      organizationId: orgs[IDS.ORG_ACCOUNTING].id,
    },
    {
      id: IDS.NICHE_TAX,
      name: 'Tax Preparation',
      slug: 'tax-preparation',
      description: 'Individual and business tax filing',
      organizationId: orgs[IDS.ORG_ACCOUNTING].id,
    },
    // Paralegal Services niches
    {
      id: IDS.NICHE_LEGAL_RESEARCH,
      name: 'Legal Research',
      slug: 'legal-research',
      description: 'Case law research and memoranda',
      organizationId: orgs[IDS.ORG_PARALEGAL].id,
    },
  ];

  const niches: Record<string, { id: string; name: string }> = {};

  for (const n of nicheDefs) {
    niches[n.id] = await prisma.niche.upsert({
      where: { slug_organizationId: { slug: n.slug, organizationId: n.organizationId } },
      update: { id: n.id, name: n.name, description: n.description },
      create: n,
    });
  }

  console.log('  Niches seeded:', nicheDefs.map((n) => n.name).join(', '));
  return niches;
}

// -------------------------------------------------------
// Projects — full pipeline coverage
// -------------------------------------------------------
async function seedProjects(
  users: Record<string, { id: string }>,
  orgs: Record<string, { id: string }>,
  niches: Record<string, { id: string }>,
  teams: Record<string, { id: string }>,
) {
  const orgId = orgs[IDS.ORG_DEV].id;
  const teamId = teams[IDS.TEAM_ALPHA].id;

  const projectDefs = [
    // Stage: DISCOVERED
    {
      id: IDS.PROJ_1,
      title: 'Build AI Customer Support Chatbot',
      jobUrl: 'https://www.upwork.com/jobs/~01abc123',
      jobDescription:
        'We need an intelligent chatbot integrated with our CRM. Must handle 500+ concurrent users. Budget is flexible for the right team.',
      pricingType: PricingType.FIXED,
      fixedPrice: 8000,
      stage: ProjectStage.DISCOVERED,
      organizationId: orgId,
      nicheId: niches[IDS.NICHE_AI].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
    },
    // Stage: SCRIPTED
    {
      id: IDS.PROJ_2,
      title: 'React Dashboard for SaaS Analytics Platform',
      jobUrl: 'https://www.upwork.com/jobs/~01def456',
      jobDescription:
        'Looking for a senior React developer to build a comprehensive analytics dashboard. Charts, filters, real-time data updates.',
      pricingType: PricingType.HOURLY,
      hourlyRateMin: 50,
      hourlyRateMax: 75,
      stage: ProjectStage.SCRIPTED,
      coverLetter:
        "Hi! We specialize in building beautiful, high-performance React dashboards. Our team has delivered 20+ analytics platforms for SaaS companies, and we'd love to bring that expertise to your project. We use Recharts/Victory for visualizations and TanStack Query for real-time data management.",
      videoScript:
        'Open with: Show our portfolio dashboard. Key points: 1) Team expertise in React/TypeScript 2) Examples of analytics dashboards we built 3) Our process: discovery → wireframe → build → iterate. Close with: Offer a free 30min consultation call.',
      organizationId: orgId,
      nicheId: niches[IDS.NICHE_WEB].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER2].id,
      lastEditedById: users[IDS.USER_BIDDER].id,
    },
    // Stage: UNDER_REVIEW (reviewStatus: PENDING — awaiting lead review)
    {
      id: IDS.PROJ_3,
      title: 'Flutter Mobile App for Fitness Tracking',
      jobUrl: 'https://www.upwork.com/jobs/~01ghi789',
      jobDescription:
        'Need a cross-platform mobile app for iOS and Android. Features: workout logging, nutrition tracking, progress charts, social sharing.',
      pricingType: PricingType.FIXED,
      fixedPrice: 12000,
      stage: ProjectStage.UNDER_REVIEW,
      reviewStatus: ReviewStatus.PENDING,
      coverLetter:
        "Your fitness app concept is exactly the kind of project we excel at. We've built 8 Flutter apps in the health/fitness space, including [App Name] which hit 10k downloads in its first month. We'll deliver a polished, performant app on time.",
      videoScript:
        'Demo our existing Flutter fitness app. Highlight: smooth animations, offline mode, BLE device integration. Show our development timeline approach.',
      organizationId: orgId,
      nicheId: niches[IDS.NICHE_APP].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      lastEditedById: users[IDS.USER_BIDDER].id,
      assignedCloserId: users[IDS.USER_CLOSER2].id,
    },
    // Stage: UNDER_REVIEW (reviewStatus: APPROVED — lead approved, closer can now submit bid)
    {
      id: IDS.PROJ_4,
      title: 'AWS Infrastructure Setup & CI/CD Pipeline',
      jobUrl: 'https://www.upwork.com/jobs/~01jkl012',
      jobDescription:
        'Startup needs AWS infrastructure from scratch: ECS, RDS, S3, CloudFront. Must include GitHub Actions CI/CD, monitoring with Datadog.',
      pricingType: PricingType.FIXED,
      fixedPrice: 5500,
      stage: ProjectStage.UNDER_REVIEW,
      reviewStatus: ReviewStatus.APPROVED,
      reviewComments:
        'Great proposal! The technical approach is solid. Go ahead and submit the bid.',
      reviewedById: users[IDS.USER_LEAD].id,
      reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      coverLetter:
        "We're AWS-certified architects who have set up infrastructure for 30+ startups. We'll have your full stack deployed, monitored, and auto-scaling within 2 weeks. We include thorough documentation and a handover call.",
      videoScript:
        'Walk through our AWS architecture diagram. Show a live deployment pipeline. Emphasize: security best practices, cost optimization, disaster recovery.',
      organizationId: orgId,
      nicheId: niches[IDS.NICHE_DEVOPS].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER2].id,
      lastEditedById: users[IDS.USER_BIDDER2].id,
      assignedCloserId: users[IDS.USER_CLOSER].id,
    },
    // Stage: BID_SUBMITTED
    {
      id: IDS.PROJ_5,
      title: 'N8N Automation Workflow for Lead Generation',
      jobUrl: 'https://www.upwork.com/jobs/~01mno345',
      jobDescription:
        'We want to automate our entire lead gen funnel using N8N: LinkedIn scraping, email enrichment, CRM sync, follow-up sequences.',
      pricingType: PricingType.HOURLY,
      hourlyRateMin: 45,
      hourlyRateMax: 60,
      stage: ProjectStage.BID_SUBMITTED,
      coverLetter:
        "N8N automation is our bread and butter. We've built over 50 automation workflows for agencies and SaaS companies. Your lead gen funnel will be fully automated within 1 week, saving your team 20+ hours per week.",
      videoScript:
        "Show live N8N workflow demo. Demonstrate LinkedIn → Email enrichment → CRM sync flow. Show the client's specific use case scenario.",
      upworkAccount: 'AOP Agency Pro',
      bidAmount: 2400,
      bidSubmittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      organizationId: orgId,
      nicheId: niches[IDS.NICHE_AI].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      lastEditedById: users[IDS.USER_BIDDER].id,
      assignedCloserId: users[IDS.USER_CLOSER2].id,
    },
    // Stage: VIEWED
    {
      id: IDS.PROJ_6,
      title: 'Next.js E-Commerce Platform with Shopify Integration',
      jobUrl: 'https://www.upwork.com/jobs/~01pqr678',
      jobDescription:
        'Custom Next.js storefront with headless Shopify backend. Need SSR, fast checkout, custom product configurator.',
      pricingType: PricingType.FIXED,
      fixedPrice: 9500,
      stage: ProjectStage.VIEWED,
      coverLetter:
        'We build headless Shopify storefronts that convert. Our last e-commerce project increased conversion rate by 34%. We use Next.js 14 with App Router, Tailwind, and Shopify Storefront API.',
      upworkAccount: 'AOP Agency Pro',
      bidAmount: 9500,
      bidSubmittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      organizationId: orgId,
      nicheId: niches[IDS.NICHE_WEB].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER2].id,
      lastEditedById: users[IDS.USER_BIDDER2].id,
      assignedCloserId: users[IDS.USER_CLOSER].id,
    },
    // Stage: MESSAGED
    {
      id: IDS.PROJ_7,
      title: 'Python Data Pipeline & BI Dashboard',
      jobUrl: 'https://www.upwork.com/jobs/~01stu901',
      jobDescription:
        'Need a data engineer to build ETL pipelines from 5 data sources into a central warehouse (Snowflake). Plus a Metabase/Superset dashboard.',
      pricingType: PricingType.HOURLY,
      hourlyRateMin: 55,
      hourlyRateMax: 80,
      stage: ProjectStage.MESSAGED,
      upworkAccount: 'AOP Data Team',
      bidAmount: 6000,
      bidSubmittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      organizationId: orgId,
      nicheId: niches[IDS.NICHE_WEB].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      assignedCloserId: users[IDS.USER_CLOSER2].id,
    },
    // Stage: INTERVIEW
    {
      id: IDS.PROJ_8,
      title: 'OpenAI-Powered Document Processing System',
      jobUrl: 'https://www.upwork.com/jobs/~01vwx234',
      jobDescription:
        'Legal tech startup needs AI system to extract structured data from contracts, invoices, court filings. Must handle PDFs, images, handwriting.',
      pricingType: PricingType.FIXED,
      fixedPrice: 15000,
      stage: ProjectStage.INTERVIEW,
      upworkAccount: 'AOP Agency Pro',
      bidAmount: 14500,
      bidSubmittedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      organizationId: orgId,
      nicheId: niches[IDS.NICHE_AI].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER2].id,
      assignedCloserId: users[IDS.USER_CLOSER].id,
    },
    // Stage: WON
    {
      id: IDS.PROJ_9,
      title: 'SaaS Subscription Management Platform',
      jobUrl: 'https://www.upwork.com/jobs/~01yza567',
      jobDescription:
        'Build full subscription management system: billing (Stripe), usage tracking, plan upgrades/downgrades, customer portal.',
      pricingType: PricingType.FIXED,
      fixedPrice: 18000,
      stage: ProjectStage.WON,
      upworkAccount: 'AOP Agency Pro',
      bidAmount: 17500,
      bidSubmittedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      clientName: 'TechScale Inc.',
      clientNotes:
        'Very responsive client. Prefers async communication via Slack. Has existing codebase in Next.js + NestJS. Weekly check-in calls on Fridays.',
      contractValue: 18000,
      organizationId: orgId,
      nicheId: niches[IDS.NICHE_WEB].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      assignedCloserId: users[IDS.USER_CLOSER].id,
      assignedPMId: users[IDS.USER_PM].id,
    },
    // Stage: IN_PROGRESS
    {
      id: IDS.PROJ_10,
      title: 'Kubernetes Migration for Monolith App',
      jobUrl: 'https://www.upwork.com/jobs/~01bcd890',
      jobDescription:
        'Migrate legacy Node.js monolith to microservices on Kubernetes (EKS). 8 services total, zero-downtime migration required.',
      pricingType: PricingType.HOURLY,
      hourlyRateMin: 70,
      hourlyRateMax: 90,
      stage: ProjectStage.IN_PROGRESS,
      upworkAccount: 'AOP DevOps',
      bidAmount: 22000,
      bidSubmittedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      clientName: 'CloudFirst Systems',
      clientNotes:
        'Enterprise client — requires SOC2 compliance, all code to be reviewed by their security team. PM is their CTO directly.',
      contractValue: 22000,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      organizationId: orgId,
      nicheId: niches[IDS.NICHE_DEVOPS].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER2].id,
      assignedCloserId: users[IDS.USER_CLOSER2].id,
      assignedPMId: users[IDS.USER_PM].id,
    },
    // Stage: COMPLETED
    {
      id: IDS.PROJ_11,
      title: 'WhatsApp Business API Integration',
      pricingType: PricingType.FIXED,
      fixedPrice: 3500,
      stage: ProjectStage.COMPLETED,
      clientName: 'RetailMax Ltd.',
      contractValue: 3500,
      startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      organizationId: orgId,
      nicheId: niches[IDS.NICHE_AI].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      assignedCloserId: users[IDS.USER_CLOSER].id,
      assignedPMId: users[IDS.USER_PM].id,
    },
    // Stage: LOST
    {
      id: IDS.PROJ_12,
      title: 'Unity Game Development — Casual Mobile Game',
      jobUrl: 'https://www.upwork.com/jobs/~01efg123',
      pricingType: PricingType.FIXED,
      fixedPrice: 25000,
      stage: ProjectStage.LOST,
      upworkAccount: 'AOP Agency Pro',
      bidAmount: 24000,
      organizationId: orgId,
      teamId,
      discoveredById: users[IDS.USER_BIDDER2].id,
      assignedCloserId: users[IDS.USER_CLOSER2].id,
    },
    // Stage: CANCELLED
    {
      id: IDS.PROJ_13,
      title: 'Blockchain NFT Marketplace',
      jobUrl: 'https://www.upwork.com/jobs/~01hij456',
      pricingType: PricingType.FIXED,
      fixedPrice: 35000,
      stage: ProjectStage.CANCELLED,
      organizationId: orgId,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
    },
  ];

  for (const p of projectDefs) {
    await prisma.project.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }

  console.log(`  Projects seeded: ${projectDefs.length} across all pipeline stages.`);

  // Seed meetings for interview-stage and beyond
  await seedMeetings(users);

  // Seed tasks for in-progress projects
  await seedTasks(users);

  // Seed milestones for won/in-progress projects
  await seedMilestones();
}

// -------------------------------------------------------
// Meetings
// -------------------------------------------------------
async function seedMeetings(users: Record<string, { id: string }>) {
  const meetingDefs = [
    {
      id: IDS.MEET_1,
      projectId: IDS.PROJ_8, // INTERVIEW stage
      closerId: users[IDS.USER_CLOSER].id,
      type: MeetingType.INTERVIEW,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: MeetingStatus.SCHEDULED,
      notes:
        'Client wants to see a live demo of our document processing. Prepare 3 example contracts.',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
    },
    {
      id: IDS.MEET_2,
      projectId: IDS.PROJ_10, // IN_PROGRESS
      closerId: users[IDS.USER_CLOSER2].id,
      type: MeetingType.CLIENT_CHECKIN,
      scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: MeetingStatus.COMPLETED,
      notes:
        'Sprint 1 review. Client happy with service decomposition progress. Requested adding rate limiting to API gateway.',
      meetingUrl: 'https://zoom.us/j/123456789',
      fathomUrl: 'https://fathom.video/share/abc123',
      loomUrl: 'https://loom.com/share/def456',
    },
    {
      id: IDS.MEET_3,
      projectId: IDS.PROJ_10, // IN_PROGRESS — upcoming
      closerId: users[IDS.USER_CLOSER2].id,
      type: MeetingType.CLIENT_CHECKIN,
      scheduledAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      status: MeetingStatus.SCHEDULED,
      notes: 'Sprint 2 review. Need to demo the auth service and user service migration.',
      meetingUrl: 'https://zoom.us/j/987654321',
    },
    {
      id: IDS.MEET_4,
      projectId: IDS.PROJ_9, // WON — kickoff
      closerId: users[IDS.USER_CLOSER].id,
      type: MeetingType.CLIENT_CHECKIN,
      scheduledAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      status: MeetingStatus.SCHEDULED,
      notes: 'Project kickoff call. Go over requirements, timeline, Slack channel setup.',
      meetingUrl: 'https://meet.google.com/xyz-uvwx-yz',
    },
  ];

  for (const m of meetingDefs) {
    await prisma.meeting.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
  }

  console.log('  Meetings seeded:', meetingDefs.length);
}

// -------------------------------------------------------
// Tasks (PM creates for operators)
// -------------------------------------------------------
async function seedTasks(users: Record<string, { id: string }>) {
  const taskDefs = [
    // proj-10 (IN_PROGRESS — K8s migration)
    {
      id: IDS.TASK_1,
      projectId: IDS.PROJ_10,
      assigneeId: users[IDS.USER_OPERATOR].id,
      title: 'Containerize auth service with Docker',
      description:
        'Create Dockerfile, docker-compose for local dev, and push to ECR. Follow the monorepo structure.',
      status: TaskStatus.DONE,
      priority: 1,
      estimatedHours: 8,
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: IDS.TASK_2,
      projectId: IDS.PROJ_10,
      assigneeId: users[IDS.USER_OPERATOR].id,
      title: 'Containerize user service with Docker',
      description:
        'Create Dockerfile for user service. Ensure DB connection pooling config works in container env.',
      status: TaskStatus.IN_REVIEW,
      priority: 1,
      estimatedHours: 6,
    },
    {
      id: IDS.TASK_3,
      projectId: IDS.PROJ_10,
      assigneeId: users[IDS.USER_OPERATOR2].id,
      title: 'Write K8s manifests for auth + user services',
      description: 'Deployments, Services, ConfigMaps, Secrets (sealed). Include HPA configs.',
      status: TaskStatus.IN_PROGRESS,
      priority: 2,
      estimatedHours: 10,
    },
    {
      id: IDS.TASK_4,
      projectId: IDS.PROJ_10,
      assigneeId: users[IDS.USER_OPERATOR2].id,
      title: 'Set up GitHub Actions CI/CD pipeline',
      description:
        'Build + test + deploy pipeline. Trigger on PR merge to main. Deploy to staging first, then prod with manual approval.',
      status: TaskStatus.TODO,
      priority: 2,
      estimatedHours: 12,
    },
    {
      id: IDS.TASK_5,
      projectId: IDS.PROJ_10,
      assigneeId: users[IDS.USER_OPERATOR].id,
      title: 'Configure Datadog APM for all services',
      description:
        'Install dd-trace in each service, set up dashboards, create alerts for p99 latency > 500ms.',
      status: TaskStatus.TODO,
      priority: 3,
      estimatedHours: 8,
    },
    // proj-9 (WON — just starting)
    {
      id: IDS.TASK_6,
      projectId: IDS.PROJ_9,
      assigneeId: users[IDS.USER_OPERATOR].id,
      title: 'Set up Next.js project with Stripe integration',
      description:
        'Initialize project, install Stripe SDK, set up webhooks endpoint, configure products/prices in Stripe dashboard.',
      status: TaskStatus.TODO,
      priority: 1,
      estimatedHours: 8,
    },
    {
      id: IDS.TASK_7,
      projectId: IDS.PROJ_9,
      assigneeId: users[IDS.USER_OPERATOR2].id,
      title: 'Build subscription management backend',
      description:
        'NestJS service for subscription CRUD, plan changes, usage tracking. Integrate with Stripe Customer Portal.',
      status: TaskStatus.TODO,
      priority: 1,
      estimatedHours: 16,
    },
  ];

  for (const t of taskDefs) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: t,
      create: t,
    });
  }

  console.log('  Tasks seeded:', taskDefs.length);

  // QA review for the completed task
  await prisma.qAReview.upsert({
    where: { taskId: IDS.TASK_1 },
    update: {},
    create: {
      taskId: IDS.TASK_1,
      reviewerId: users[IDS.USER_QA].id,
      status: 'APPROVED',
      score: 9,
      comments:
        'Clean Dockerfile, proper multi-stage build. Image size is optimal. Security scan passed.',
    },
  });

  console.log('  QA reviews seeded.');
}

// -------------------------------------------------------
// Milestones
// -------------------------------------------------------
async function seedMilestones() {
  const milestoneDefs = [
    // proj-10 milestones
    {
      id: IDS.MS_1,
      projectId: IDS.PROJ_10,
      name: 'Phase 1: Service Containerization',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      amount: 7333,
      completed: false,
    },
    {
      id: IDS.MS_2,
      projectId: IDS.PROJ_10,
      name: 'Phase 2: K8s Deployment & CI/CD',
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      amount: 7333,
      completed: false,
    },
    {
      id: IDS.MS_3,
      projectId: IDS.PROJ_10,
      name: 'Phase 3: Monitoring & Cutover',
      dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      amount: 7334,
      completed: false,
    },
    // proj-9 milestones
    {
      id: IDS.MS_4,
      projectId: IDS.PROJ_9,
      name: 'Billing & Subscription Core',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      amount: 9000,
      completed: false,
    },
    {
      id: IDS.MS_5,
      projectId: IDS.PROJ_9,
      name: 'Customer Portal & Final Delivery',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      amount: 9000,
      completed: false,
    },
    // proj-11 (completed)
    {
      id: IDS.MS_6,
      projectId: IDS.PROJ_11,
      name: 'WhatsApp API Integration Delivery',
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      amount: 3500,
      completed: true,
    },
  ];

  for (const m of milestoneDefs) {
    await prisma.milestone.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
  }

  console.log('  Milestones seeded:', milestoneDefs.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
