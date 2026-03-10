import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ProjectStage } from '@prisma/client';

const WON_STAGES = [ProjectStage.WON, ProjectStage.IN_PROGRESS, ProjectStage.COMPLETED];

const BID_SUBMITTED_STAGES = [
  ProjectStage.BID_SUBMITTED,
  ProjectStage.VIEWED,
  ProjectStage.MESSAGED,
  ProjectStage.INTERVIEW,
  ProjectStage.WON,
  ProjectStage.IN_PROGRESS,
  ProjectStage.COMPLETED,
  ProjectStage.LOST,
];

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Pipeline funnel counts filtered by an optional date range (based on createdAt).
   */
  async getFunnelMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    discovered: number;
    scripted: number;
    underReview: number;
    assigned: number;
    bidSubmitted: number;
    viewed: number;
    messaged: number;
    interview: number;
    won: number;
    inProgress: number;
    completed: number;
    lost: number;
    cancelled: number;
  }> {
    const dateFilter = { createdAt: { gte: startDate, lte: endDate } };

    const stageCounts = await this.prisma.project.groupBy({
      by: ['stage'],
      where: dateFilter,
      _count: { id: true },
    });

    const byStage: Partial<Record<ProjectStage, number>> = {};
    for (const row of stageCounts) {
      byStage[row.stage] = row._count.id;
    }

    const get = (s: ProjectStage) => byStage[s] ?? 0;

    return {
      discovered: get(ProjectStage.DISCOVERED),
      scripted: get(ProjectStage.SCRIPTED),
      underReview: get(ProjectStage.UNDER_REVIEW),
      assigned: get(ProjectStage.ASSIGNED),
      bidSubmitted: get(ProjectStage.BID_SUBMITTED),
      viewed: get(ProjectStage.VIEWED),
      messaged: get(ProjectStage.MESSAGED),
      interview: get(ProjectStage.INTERVIEW),
      won: get(ProjectStage.WON),
      inProgress: get(ProjectStage.IN_PROGRESS),
      completed: get(ProjectStage.COMPLETED),
      lost: get(ProjectStage.LOST),
      cancelled: get(ProjectStage.CANCELLED),
    };
  }

  /**
   * Top closers by win rate within the given date range.
   */
  async getTopClosers(
    startDate: Date,
    endDate: Date,
    limit: number,
  ): Promise<
    {
      closerId: string;
      closerEmail: string;
      totalBids: number;
      totalWon: number;
      totalRevenue: number;
      winRate: number;
    }[]
  > {
    const dateFilter = { createdAt: { gte: startDate, lte: endDate } };

    const closers = await this.prisma.user.findMany({
      where: { role: { name: 'closer' } },
      select: { id: true, email: true },
    });

    const results = await Promise.all(
      closers.map(async (closer) => {
        const [totalBids, totalWon, revenueAgg] = await Promise.all([
          this.prisma.project.count({
            where: {
              assignedCloserId: closer.id,
              stage: { in: BID_SUBMITTED_STAGES },
              ...dateFilter,
            },
          }),
          this.prisma.project.count({
            where: { assignedCloserId: closer.id, stage: { in: WON_STAGES }, ...dateFilter },
          }),
          this.prisma.project.aggregate({
            where: { assignedCloserId: closer.id, stage: { in: WON_STAGES }, ...dateFilter },
            _sum: { contractValue: true },
          }),
        ]);

        return {
          closerId: closer.id,
          closerEmail: closer.email,
          totalBids,
          totalWon,
          totalRevenue: revenueAgg._sum.contractValue ?? 0,
          winRate: totalBids > 0 ? Math.round((totalWon / totalBids) * 1000) / 10 : 0,
        };
      }),
    );

    return results.sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, limit);
  }

  /**
   * Overall dashboard summary — all-time counts + conversion rates.
   */
  async getDashboardSummary(): Promise<{
    totalProjects: number;
    totalMeetings: number;
    totalWon: number;
    totalRevenue: number;
    conversionRates: {
      bidRate: number;
      viewRate: number;
      interviewRate: number;
      winRate: number;
    };
  }> {
    const [totalProjects, totalMeetings, stageCounts, revenueAgg] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.meeting.count(),
      this.prisma.project.groupBy({
        by: ['stage'],
        _count: { id: true },
      }),
      this.prisma.project.aggregate({
        where: { stage: { in: WON_STAGES } },
        _sum: { contractValue: true },
      }),
    ]);

    const byStage: Partial<Record<ProjectStage, number>> = {};
    for (const row of stageCounts) {
      byStage[row.stage] = row._count.id;
    }

    const get = (s: ProjectStage) => byStage[s] ?? 0;

    const totalBidSubmitted = BID_SUBMITTED_STAGES.reduce((sum, s) => sum + get(s), 0);
    const totalViewed =
      get(ProjectStage.VIEWED) +
      get(ProjectStage.MESSAGED) +
      get(ProjectStage.INTERVIEW) +
      get(ProjectStage.WON) +
      get(ProjectStage.IN_PROGRESS) +
      get(ProjectStage.COMPLETED);
    const totalInterview =
      get(ProjectStage.INTERVIEW) +
      get(ProjectStage.WON) +
      get(ProjectStage.IN_PROGRESS) +
      get(ProjectStage.COMPLETED);
    const totalWon = WON_STAGES.reduce((sum, s) => sum + get(s), 0);

    return {
      totalProjects,
      totalMeetings,
      totalWon,
      totalRevenue: revenueAgg._sum.contractValue ?? 0,
      conversionRates: {
        bidRate:
          totalProjects > 0 ? Math.round((totalBidSubmitted / totalProjects) * 1000) / 10 : 0,
        viewRate:
          totalBidSubmitted > 0 ? Math.round((totalViewed / totalBidSubmitted) * 1000) / 10 : 0,
        interviewRate: totalViewed > 0 ? Math.round((totalInterview / totalViewed) * 1000) / 10 : 0,
        winRate: totalBidSubmitted > 0 ? Math.round((totalWon / totalBidSubmitted) * 1000) / 10 : 0,
      },
    };
  }

  /**
   * Per-org pipeline summary.
   */
  async getOrgSummary(organizationId: string): Promise<{
    totalProjects: number;
    activeProjects: number;
    wonProjects: number;
    totalRevenue: number;
  }> {
    const [totalProjects, activeProjects, wonProjects, revenueAgg] = await Promise.all([
      this.prisma.project.count({ where: { organizationId } }),
      this.prisma.project.count({
        where: {
          organizationId,
          stage: { notIn: [ProjectStage.COMPLETED, ProjectStage.LOST, ProjectStage.CANCELLED] },
        },
      }),
      this.prisma.project.count({
        where: { organizationId, stage: { in: WON_STAGES } },
      }),
      this.prisma.project.aggregate({
        where: { organizationId, stage: { in: WON_STAGES } },
        _sum: { contractValue: true },
      }),
    ]);

    return {
      totalProjects,
      activeProjects,
      wonProjects,
      totalRevenue: revenueAgg._sum.contractValue ?? 0,
    };
  }
}
