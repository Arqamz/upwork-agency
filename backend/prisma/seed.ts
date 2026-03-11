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
  // Additional Dev projects
  PROJ_14: sid('proj-14'),
  PROJ_15: sid('proj-15'),
  PROJ_16: sid('proj-16'),
  PROJ_17: sid('proj-17'),
  // Accounting projects
  PROJ_18: sid('proj-18'),
  PROJ_19: sid('proj-19'),
  PROJ_20: sid('proj-20'),
  PROJ_21: sid('proj-21'),
  PROJ_22: sid('proj-22'),
  PROJ_23: sid('proj-23'),
  PROJ_24: sid('proj-24'),
  PROJ_25: sid('proj-25'),
  PROJ_26: sid('proj-26'),
  PROJ_27: sid('proj-27'),
  PROJ_28: sid('proj-28'),
  // Paralegal projects
  PROJ_29: sid('proj-29'),
  PROJ_30: sid('proj-30'),
  PROJ_31: sid('proj-31'),
  PROJ_32: sid('proj-32'),
  PROJ_33: sid('proj-33'),
  PROJ_34: sid('proj-34'),
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
    { userId: users[IDS.USER_BIDDER].id, organizationId: orgs[IDS.ORG_PARALEGAL].id },
    { userId: users[IDS.USER_CLOSER].id, organizationId: orgs[IDS.ORG_PARALEGAL].id },
    { userId: users[IDS.USER_PM].id, organizationId: orgs[IDS.ORG_PARALEGAL].id },
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

    // ── Extra Development Services projects ──────────────────────────────────

    // Stage: DISCOVERED — React Native mobile app
    {
      id: IDS.PROJ_14,
      title: 'React Native Mobile App for E-Commerce Platform',
      jobUrl: 'https://www.upwork.com/jobs/~01rn001',
      jobDescription:
        'We need a mobile app for our e-commerce business on iOS and Android. Push notifications, cart, checkout with Stripe, order tracking.',
      pricingType: PricingType.HOURLY,
      hourlyRateMin: 60,
      hourlyRateMax: 80,
      stage: ProjectStage.DISCOVERED,
      organizationId: orgId,
      nicheId: niches[IDS.NICHE_APP].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER2].id,
    },
    // Stage: SCRIPTED — ML pipeline
    {
      id: IDS.PROJ_15,
      title: 'Python ML Pipeline for Predictive Analytics',
      jobUrl: 'https://www.upwork.com/jobs/~01ml001',
      jobDescription:
        'Build a production-grade ML pipeline: data ingestion, feature engineering, model training (XGBoost + LightGBM), FastAPI serving layer.',
      pricingType: PricingType.FIXED,
      fixedPrice: 4500,
      stage: ProjectStage.SCRIPTED,
      coverLetter:
        "Our data science team has built production ML systems for 15+ companies. We'll deliver a clean, well-tested pipeline with CI/CD for model retraining and a Grafana dashboard for model performance monitoring.",
      videoScript:
        'Show architecture diagram: Airflow → feature store → training → MLflow → FastAPI. Live demo of model serving. Emphasize monitoring and drift detection.',
      organizationId: orgId,
      nicheId: niches[IDS.NICHE_WEB].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      lastEditedById: users[IDS.USER_BIDDER2].id,
    },
    // Stage: INTERVIEW — DevOps engineer
    {
      id: IDS.PROJ_16,
      title: 'DevOps Engineer for AWS Infrastructure Modernization',
      jobUrl: 'https://www.upwork.com/jobs/~01ops002',
      jobDescription:
        'Series A startup needs DevOps support: EKS cluster, Terraform, GitOps with ArgoCD, security hardening, SOC2 prep.',
      pricingType: PricingType.HOURLY,
      hourlyRateMin: 75,
      hourlyRateMax: 100,
      stage: ProjectStage.INTERVIEW,
      upworkAccount: 'AOP DevOps',
      bidAmount: 8800,
      bidSubmittedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      organizationId: orgId,
      nicheId: niches[IDS.NICHE_DEVOPS].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      assignedCloserId: users[IDS.USER_CLOSER2].id,
    },
    // Stage: COMPLETED — SaaS full stack
    {
      id: IDS.PROJ_17,
      title: 'Full-Stack SaaS Application — Team Collaboration Tool',
      pricingType: PricingType.FIXED,
      fixedPrice: 8000,
      stage: ProjectStage.COMPLETED,
      clientName: 'Collabify Inc.',
      contractValue: 8000,
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      organizationId: orgId,
      nicheId: niches[IDS.NICHE_WEB].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER2].id,
      assignedCloserId: users[IDS.USER_CLOSER].id,
      assignedPMId: users[IDS.USER_PM].id,
    },

    // ── Accounting Services projects ──────────────────────────────────────────

    // Stage: DISCOVERED
    {
      id: IDS.PROJ_18,
      title: 'Monthly Bookkeeping for Small E-Commerce Business',
      jobUrl: 'https://www.upwork.com/jobs/~01bk001',
      jobDescription:
        'Need a bookkeeper to reconcile accounts, categorize transactions in QuickBooks Online, and prepare monthly P&L reports. ~150 transactions/month.',
      pricingType: PricingType.HOURLY,
      hourlyRateMin: 25,
      hourlyRateMax: 35,
      stage: ProjectStage.DISCOVERED,
      organizationId: orgs[IDS.ORG_ACCOUNTING].id,
      nicheId: niches[IDS.NICHE_BOOKKEEPING].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
    },
    // Stage: DISCOVERED
    {
      id: IDS.PROJ_19,
      title: 'QuickBooks Online Setup and Chart of Accounts Configuration',
      jobUrl: 'https://www.upwork.com/jobs/~01bk002',
      jobDescription:
        'New LLC needs QuickBooks Online set up from scratch: chart of accounts, bank feeds, invoice templates, and a 1-hour training session.',
      pricingType: PricingType.FIXED,
      fixedPrice: 800,
      stage: ProjectStage.DISCOVERED,
      organizationId: orgs[IDS.ORG_ACCOUNTING].id,
      nicheId: niches[IDS.NICHE_BOOKKEEPING].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
    },
    // Stage: SCRIPTED
    {
      id: IDS.PROJ_20,
      title: 'Annual Tax Return Preparation for Multi-Member LLC',
      jobUrl: 'https://www.upwork.com/jobs/~01tax001',
      jobDescription:
        'Need CPA to prepare Form 1065 and K-1s for our 3-member LLC. Revenue ~$280k, straightforward business with home office deductions.',
      pricingType: PricingType.FIXED,
      fixedPrice: 1200,
      stage: ProjectStage.SCRIPTED,
      coverLetter:
        "Our licensed CPAs specialize in pass-through entity taxation. We've filed 200+ LLC returns and always deliver on time. We'll review your prior year returns at no charge to identify any missed deductions.",
      videoScript:
        'Walk through our tax prep process: document checklist, review call, draft → review → final. Show client portal for secure document sharing. Highlight: guaranteed accuracy, IRS representation included.',
      organizationId: orgs[IDS.ORG_ACCOUNTING].id,
      nicheId: niches[IDS.NICHE_TAX].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      lastEditedById: users[IDS.USER_BIDDER].id,
      assignedCloserId: users[IDS.USER_CLOSER].id,
    },
    // Stage: SCRIPTED
    {
      id: IDS.PROJ_21,
      title: 'Payroll Processing Setup for 12-Person Team',
      jobUrl: 'https://www.upwork.com/jobs/~01bk003',
      jobDescription:
        'Growing startup needs payroll processing: biweekly payroll runs, tax filings (940/941), new hire onboarding, PTO tracking integration.',
      pricingType: PricingType.HOURLY,
      hourlyRateMin: 20,
      hourlyRateMax: 30,
      stage: ProjectStage.SCRIPTED,
      coverLetter:
        "We process payroll for 40+ businesses ranging from 5 to 200 employees. We use Gusto/ADP and handle all federal and state filings. You'll have a dedicated payroll specialist who's available same-day for urgent questions.",
      videoScript:
        'Show Gusto dashboard walkthrough. Demonstrate payroll run workflow: hours import → review → approve → direct deposit. Show tax filing dashboard.',
      organizationId: orgs[IDS.ORG_ACCOUNTING].id,
      nicheId: niches[IDS.NICHE_BOOKKEEPING].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      lastEditedById: users[IDS.USER_BIDDER].id,
    },
    // Stage: UNDER_REVIEW (PENDING)
    {
      id: IDS.PROJ_22,
      title: 'Financial Statements Preparation — GAAP Compliant',
      jobUrl: 'https://www.upwork.com/jobs/~01tax002',
      jobDescription:
        'Need a CPA to prepare investor-ready financial statements: balance sheet, income statement, cash flow statement, notes to financials. SaaS company.',
      pricingType: PricingType.FIXED,
      fixedPrice: 2000,
      stage: ProjectStage.UNDER_REVIEW,
      reviewStatus: ReviewStatus.PENDING,
      coverLetter:
        'We prepare GAAP-compliant financials for SaaS companies seeking Series A/B funding. We know what investors and auditors look for. Our statements have supported successful due diligence processes for 12 funded startups.',
      organizationId: orgs[IDS.ORG_ACCOUNTING].id,
      nicheId: niches[IDS.NICHE_TAX].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      lastEditedById: users[IDS.USER_BIDDER].id,
      assignedCloserId: users[IDS.USER_CLOSER].id,
    },
    // Stage: UNDER_REVIEW (APPROVED)
    {
      id: IDS.PROJ_23,
      title: 'Accounts Receivable Management and Collections',
      jobUrl: 'https://www.upwork.com/jobs/~01bk004',
      jobDescription:
        'B2B services company has $180k in outstanding AR. Need help managing invoicing, follow-up calls/emails, and implementing a collections process.',
      pricingType: PricingType.HOURLY,
      hourlyRateMin: 28,
      hourlyRateMax: 40,
      stage: ProjectStage.UNDER_REVIEW,
      reviewStatus: ReviewStatus.APPROVED,
      reviewComments: 'Strong proposal, good AR experience. Submit the bid.',
      reviewedById: users[IDS.USER_LEAD].id,
      reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      coverLetter:
        'Our AR specialists have recovered $2M+ in outstanding receivables for professional services firms. We use a systematic 3-touch follow-up process and can integrate with your existing accounting system.',
      organizationId: orgs[IDS.ORG_ACCOUNTING].id,
      nicheId: niches[IDS.NICHE_BOOKKEEPING].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      assignedCloserId: users[IDS.USER_CLOSER].id,
    },
    // Stage: BID_SUBMITTED
    {
      id: IDS.PROJ_24,
      title: 'Tax Planning and Strategy for High-Income Freelancer',
      jobUrl: 'https://www.upwork.com/jobs/~01tax003',
      jobDescription:
        'Self-employed consultant earning ~$350k/year needs proactive tax planning: S-corp election analysis, retirement accounts, QBI deduction optimization.',
      pricingType: PricingType.FIXED,
      fixedPrice: 1500,
      stage: ProjectStage.BID_SUBMITTED,
      upworkAccount: 'AOP Accounting',
      bidAmount: 1400,
      bidSubmittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      organizationId: orgs[IDS.ORG_ACCOUNTING].id,
      nicheId: niches[IDS.NICHE_TAX].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      assignedCloserId: users[IDS.USER_CLOSER].id,
    },
    // Stage: VIEWED
    {
      id: IDS.PROJ_25,
      title: 'Virtual CFO Services for Pre-Revenue Startup',
      jobUrl: 'https://www.upwork.com/jobs/~01tax004',
      jobDescription:
        'Early-stage SaaS startup needs fractional CFO: financial modeling, runway analysis, investor reporting, board presentation prep.',
      pricingType: PricingType.HOURLY,
      hourlyRateMin: 50,
      hourlyRateMax: 65,
      stage: ProjectStage.VIEWED,
      upworkAccount: 'AOP Accounting',
      bidAmount: 3200,
      bidSubmittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      organizationId: orgs[IDS.ORG_ACCOUNTING].id,
      nicheId: niches[IDS.NICHE_TAX].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      assignedCloserId: users[IDS.USER_CLOSER].id,
    },
    // Stage: IN_PROGRESS
    {
      id: IDS.PROJ_26,
      title: 'Year-End Financial Audit Support and Work Papers',
      jobUrl: 'https://www.upwork.com/jobs/~01bk005',
      pricingType: PricingType.FIXED,
      fixedPrice: 3500,
      stage: ProjectStage.IN_PROGRESS,
      upworkAccount: 'AOP Accounting',
      bidAmount: 3500,
      clientName: 'Summit Ventures LLC',
      clientNotes:
        'Annual audit for Series A company. Auditor is Grant Thornton. Deadline: March 31.',
      contractValue: 3500,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      organizationId: orgs[IDS.ORG_ACCOUNTING].id,
      nicheId: niches[IDS.NICHE_TAX].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      assignedCloserId: users[IDS.USER_CLOSER].id,
      assignedPMId: users[IDS.USER_PM].id,
    },
    // Stage: COMPLETED
    {
      id: IDS.PROJ_27,
      title: 'Business Tax Filing 2023 — S-Corporation',
      pricingType: PricingType.FIXED,
      fixedPrice: 950,
      stage: ProjectStage.COMPLETED,
      clientName: 'GreenLeaf Consulting',
      contractValue: 950,
      startDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      organizationId: orgs[IDS.ORG_ACCOUNTING].id,
      nicheId: niches[IDS.NICHE_TAX].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      assignedCloserId: users[IDS.USER_CLOSER].id,
    },
    // Stage: LOST
    {
      id: IDS.PROJ_28,
      title: 'Corporate Tax Strategy Overhaul — Multi-Entity Structure',
      jobUrl: 'https://www.upwork.com/jobs/~01tax005',
      pricingType: PricingType.HOURLY,
      hourlyRateMin: 60,
      hourlyRateMax: 80,
      stage: ProjectStage.LOST,
      upworkAccount: 'AOP Accounting',
      bidAmount: 5500,
      organizationId: orgs[IDS.ORG_ACCOUNTING].id,
      nicheId: niches[IDS.NICHE_TAX].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      assignedCloserId: users[IDS.USER_CLOSER].id,
    },

    // ── Paralegal Services projects ───────────────────────────────────────────

    // Stage: DISCOVERED
    {
      id: IDS.PROJ_29,
      title: 'Legal Research — Contract Dispute Case Law Analysis',
      jobUrl: 'https://www.upwork.com/jobs/~01lr001',
      jobDescription:
        'Need a paralegal to research case law on breach of contract in California. Looking for precedents on material breach vs. minor breach, and damages calculations.',
      pricingType: PricingType.HOURLY,
      hourlyRateMin: 35,
      hourlyRateMax: 50,
      stage: ProjectStage.DISCOVERED,
      organizationId: orgs[IDS.ORG_PARALEGAL].id,
      nicheId: niches[IDS.NICHE_LEGAL_RESEARCH].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
    },
    // Stage: SCRIPTED
    {
      id: IDS.PROJ_30,
      title: 'Document Review and Legal Memo — Employment Law',
      jobUrl: 'https://www.upwork.com/jobs/~01lr002',
      jobDescription:
        'Review 200+ pages of employment contracts and HR policies. Prepare legal memo identifying non-compliant provisions under CA employment law.',
      pricingType: PricingType.FIXED,
      fixedPrice: 1800,
      stage: ProjectStage.SCRIPTED,
      coverLetter:
        "Our paralegal team specializes in CA employment law document review. We use Relativity for efficient document management and can turn around a comprehensive memo within 5 business days. We've reviewed 50k+ employment documents for law firms and HR departments.",
      videoScript:
        'Walk through our document review workflow: intake → privilege log → issue coding → memo drafting. Show sample legal memo structure. Emphasize turnaround time and attorney supervision.',
      organizationId: orgs[IDS.ORG_PARALEGAL].id,
      nicheId: niches[IDS.NICHE_LEGAL_RESEARCH].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      lastEditedById: users[IDS.USER_BIDDER].id,
      assignedCloserId: users[IDS.USER_CLOSER].id,
    },
    // Stage: UNDER_REVIEW (PENDING)
    {
      id: IDS.PROJ_31,
      title: 'Paralegal Support — Real Estate Transaction Due Diligence',
      jobUrl: 'https://www.upwork.com/jobs/~01lr003',
      jobDescription:
        'Commercial real estate firm needs paralegal support for 3 concurrent property acquisitions: title review, lien searches, survey review, closing checklist.',
      pricingType: PricingType.FIXED,
      fixedPrice: 2500,
      stage: ProjectStage.UNDER_REVIEW,
      reviewStatus: ReviewStatus.PENDING,
      coverLetter:
        "Commercial real estate closings are our specialty. We've supported 80+ transactions totaling $500M+ in value. Our team knows how to spot title defects and coordinate with title companies, surveyors, and lenders to keep closings on track.",
      organizationId: orgs[IDS.ORG_PARALEGAL].id,
      nicheId: niches[IDS.NICHE_LEGAL_RESEARCH].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      lastEditedById: users[IDS.USER_BIDDER].id,
      assignedCloserId: users[IDS.USER_CLOSER].id,
    },
    // Stage: BID_SUBMITTED
    {
      id: IDS.PROJ_32,
      title: 'Legal Brief Writing — Motion to Dismiss Support',
      jobUrl: 'https://www.upwork.com/jobs/~01lr004',
      jobDescription:
        'Attorney needs assistance drafting motion to dismiss brief for federal court (SDNY). Contract claim, 12(b)(6) motion. Need PACER research and citation-perfect brief.',
      pricingType: PricingType.HOURLY,
      hourlyRateMin: 40,
      hourlyRateMax: 55,
      stage: ProjectStage.BID_SUBMITTED,
      upworkAccount: 'AOP Paralegal',
      bidAmount: 2200,
      bidSubmittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      organizationId: orgs[IDS.ORG_PARALEGAL].id,
      nicheId: niches[IDS.NICHE_LEGAL_RESEARCH].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      assignedCloserId: users[IDS.USER_CLOSER].id,
    },
    // Stage: IN_PROGRESS
    {
      id: IDS.PROJ_33,
      title: 'Corporate Due Diligence Research — M&A Transaction',
      jobUrl: 'https://www.upwork.com/jobs/~01lr005',
      pricingType: PricingType.FIXED,
      fixedPrice: 4200,
      stage: ProjectStage.IN_PROGRESS,
      upworkAccount: 'AOP Paralegal',
      bidAmount: 4200,
      clientName: 'Meridian Capital Partners',
      clientNotes:
        'Acquiring a SaaS company. Need IP, litigation, and employment due diligence. NDA signed.',
      contractValue: 4200,
      startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      organizationId: orgs[IDS.ORG_PARALEGAL].id,
      nicheId: niches[IDS.NICHE_LEGAL_RESEARCH].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      assignedCloserId: users[IDS.USER_CLOSER].id,
    },
    // Stage: COMPLETED
    {
      id: IDS.PROJ_34,
      title: 'Immigration Document Preparation — EB-2 NIW Package',
      pricingType: PricingType.FIXED,
      fixedPrice: 1100,
      stage: ProjectStage.COMPLETED,
      clientName: 'Dr. Priya Sharma',
      contractValue: 1100,
      startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      organizationId: orgs[IDS.ORG_PARALEGAL].id,
      nicheId: niches[IDS.NICHE_LEGAL_RESEARCH].id,
      teamId,
      discoveredById: users[IDS.USER_BIDDER].id,
      assignedCloserId: users[IDS.USER_CLOSER].id,
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
