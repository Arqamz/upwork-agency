import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PaginationDto, PaginatedResult } from '@/common/dto';
import { CreateProjectDto, UpdateProjectDto, ReviewProjectDto, ImportFromUpworkDto } from './dto';
import { Project, ProjectStage, ReviewStatus } from '@prisma/client';

// Ordered stage list — used for pipeline counting display
// ASSIGNED is kept in the enum for backward compat but excluded from visible pipeline
export const STAGE_ORDER: ProjectStage[] = [
  ProjectStage.DISCOVERED,
  ProjectStage.SCRIPTED,
  ProjectStage.SCRIPT_REVIEW,
  ProjectStage.VIDEO_DRAFT,
  ProjectStage.UNDER_REVIEW,
  ProjectStage.BID_SUBMITTED,
  ProjectStage.VIEWED,
  ProjectStage.MESSAGED,
  ProjectStage.INTERVIEW,
  ProjectStage.IN_PROGRESS,
  ProjectStage.COMPLETED,
  ProjectStage.LOST,
  ProjectStage.CANCELLED,
];

// Valid forward transitions (strict mode via /advance endpoint)
// Phase 6 changes:
//   - Removed UNDER_REVIEW → ASSIGNED (ASSIGNED stage removed from workflow)
//   - UNDER_REVIEW → BID_SUBMITTED (guarded by reviewStatus === APPROVED in advanceStage)
//   - SCRIPTED → UNDER_REVIEW (auto-sets reviewStatus = PENDING in advanceStage)
//   - INTERVIEW → WON (WON auto-advances to IN_PROGRESS in advanceStage)
//   - WON is no longer a visible kanban column; it auto-advances to IN_PROGRESS
const NEXT_STAGE: Partial<Record<ProjectStage, ProjectStage>> = {
  [ProjectStage.DISCOVERED]: ProjectStage.SCRIPTED,
  [ProjectStage.SCRIPTED]: ProjectStage.SCRIPT_REVIEW,
  [ProjectStage.SCRIPT_REVIEW]: ProjectStage.VIDEO_DRAFT,
  [ProjectStage.VIDEO_DRAFT]: ProjectStage.UNDER_REVIEW,
  [ProjectStage.UNDER_REVIEW]: ProjectStage.BID_SUBMITTED,
  [ProjectStage.BID_SUBMITTED]: ProjectStage.VIEWED,
  [ProjectStage.VIEWED]: ProjectStage.MESSAGED,
  [ProjectStage.MESSAGED]: ProjectStage.INTERVIEW,
  [ProjectStage.INTERVIEW]: ProjectStage.WON,
  [ProjectStage.WON]: ProjectStage.IN_PROGRESS,
  [ProjectStage.IN_PROGRESS]: ProjectStage.COMPLETED,
};

const USER_SELECT = {
  select: { id: true, email: true, firstName: true, lastName: true },
} as const;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto): Promise<Project> {
    return this.prisma.project.create({ data: dto });
  }

  async findAll(
    pagination: PaginationDto,
    filters?: {
      stage?: ProjectStage;
      excludeStages?: ProjectStage[];
      organizationId?: string;
      assignedCloserId?: string;
      assignedPMId?: string;
      discoveredById?: string;
      nicheId?: string;
      teamId?: string;
    },
  ): Promise<PaginatedResult<Project>> {
    const where: Record<string, unknown> = {};

    if (filters?.stage) where.stage = filters.stage;
    if (filters?.excludeStages && filters.excludeStages.length > 0) {
      where.stage = {
        ...(typeof where.stage === 'object' ? where.stage : {}),
        notIn: filters.excludeStages,
      };
      // If stage filter is a plain value AND excludeStages are set, stage filter takes priority
      if (filters?.stage) {
        where.stage = filters.stage;
      }
    }
    if (filters?.organizationId) where.organizationId = filters.organizationId;
    if (filters?.assignedCloserId) where.assignedCloserId = filters.assignedCloserId;
    if (filters?.assignedPMId) where.assignedPMId = filters.assignedPMId;
    if (filters?.discoveredById) where.discoveredById = filters.discoveredById;
    if (filters?.nicheId) where.nicheId = filters.nicheId;
    if (filters?.teamId) where.teamId = filters.teamId;

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        include: {
          niche: { select: { id: true, name: true, slug: true } },
          team: { select: { id: true, name: true } },
          organization: { select: { id: true, name: true, slug: true } },
          discoveredBy: USER_SELECT,
          assignedCloser: USER_SELECT,
          assignedPM: USER_SELECT,
          reviewedBy: USER_SELECT,
          scriptReviewedBy: USER_SELECT,
          _count: {
            select: { tasks: true, meetings: true, milestones: true, videoProposals: true },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.project.count({ where }),
    ]);

    // Enrich projects with per-status task counts and urgent counts
    const projectIds = data.map((p) => p.id);
    if (projectIds.length > 0) {
      const [taskStatusCounts, urgentCounts] = await Promise.all([
        this.prisma.task.groupBy({
          by: ['projectId', 'status'],
          where: { projectId: { in: projectIds } },
          _count: { id: true },
        }),
        this.prisma.task.groupBy({
          by: ['projectId'],
          where: { projectId: { in: projectIds }, isUrgent: true },
          _count: { id: true },
        }),
      ]);

      const statusMap = new Map<string, Record<string, number>>();
      for (const row of taskStatusCounts) {
        if (!statusMap.has(row.projectId)) statusMap.set(row.projectId, {});
        statusMap.get(row.projectId)![row.status] = row._count.id;
      }

      const urgentMap = new Map<string, number>();
      for (const row of urgentCounts) {
        urgentMap.set(row.projectId, row._count.id);
      }

      for (const project of data as any[]) {
        project.taskStatusCounts = statusMap.get(project.id) ?? {};
        project.urgentTaskCount = urgentMap.get(project.id) ?? 0;
      }
    }

    return new PaginatedResult(data, total, pagination.page ?? 1, pagination.limit ?? 20);
  }

  async findById(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        niche: true,
        team: true,
        organization: true,
        discoveredBy: USER_SELECT,
        lastEditedBy: USER_SELECT,
        assignedCloser: USER_SELECT,
        assignedPM: USER_SELECT,
        reviewedBy: USER_SELECT,
        scriptReviewedBy: USER_SELECT,
        milestones: { orderBy: { createdAt: 'asc' } },
        tasks: {
          orderBy: [{ isUrgent: 'desc' }, { priority: 'desc' }, { createdAt: 'asc' }],
          include: { assignee: USER_SELECT },
        },
        meetings: {
          orderBy: { scheduledAt: 'desc' },
          include: { closer: USER_SELECT },
        },
        videoProposals: { orderBy: { createdAt: 'desc' } },
        links: { orderBy: { createdAt: 'desc' }, include: { addedBy: USER_SELECT } },
        chatMessages: { orderBy: { sentAt: 'asc' } },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with id "${id}" not found`);
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    await this.findById(id);

    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  async updateStage(id: string, stage: ProjectStage): Promise<Project> {
    await this.findById(id);

    return this.prisma.project.update({
      where: { id },
      data: { stage },
    });
  }

  /**
   * Advance the project to the next logical pipeline stage.
   * Phase 6 rules:
   *   - SCRIPTED → SCRIPT_REVIEW: auto-sets scriptReviewStatus = PENDING
   *   - SCRIPT_REVIEW → VIDEO_DRAFT: requires scriptReviewStatus === APPROVED
   *   - VIDEO_DRAFT → UNDER_REVIEW: auto-sets reviewStatus = PENDING
   *   - UNDER_REVIEW → BID_SUBMITTED: requires reviewStatus === APPROVED
   *   - INTERVIEW → WON → IN_PROGRESS: WON auto-advances to IN_PROGRESS
   * Use PATCH /:id/stage for arbitrary stage changes (admin/corrections).
   */
  async advanceStage(id: string): Promise<Project> {
    const project = await this.findById(id);

    const nextStage = NEXT_STAGE[project.stage as ProjectStage];
    if (!nextStage) {
      throw new BadRequestException(
        `Project is at stage "${project.stage}" which has no defined next stage`,
      );
    }

    const updateData: Record<string, unknown> = { stage: nextStage };

    // SCRIPTED → SCRIPT_REVIEW
    if (project.stage === ProjectStage.SCRIPTED && nextStage === ProjectStage.SCRIPT_REVIEW) {
      updateData.scriptReviewStatus = ReviewStatus.PENDING;
    }

    // SCRIPT_REVIEW → VIDEO_DRAFT guard
    if (project.stage === ProjectStage.SCRIPT_REVIEW && nextStage === ProjectStage.VIDEO_DRAFT) {
      if ((project as any).scriptReviewStatus !== ReviewStatus.APPROVED) {
        throw new BadRequestException('Cannot advance: script must be approved by a lead first');
      }
    }

    // VIDEO_DRAFT → UNDER_REVIEW (Video Review)
    if (project.stage === ProjectStage.VIDEO_DRAFT && nextStage === ProjectStage.UNDER_REVIEW) {
      updateData.reviewStatus = ReviewStatus.PENDING;
    }

    // UNDER_REVIEW → BID_SUBMITTED guard
    if (project.stage === ProjectStage.UNDER_REVIEW && nextStage === ProjectStage.BID_SUBMITTED) {
      if ((project as any).reviewStatus !== ReviewStatus.APPROVED) {
        throw new BadRequestException(
          'Cannot submit bid: video proposal must be approved by a lead first',
        );
      }
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: updateData,
    });

    // WON auto-advances to IN_PROGRESS
    if (updated.stage === ProjectStage.WON) {
      return this.prisma.project.update({
        where: { id },
        data: { stage: ProjectStage.IN_PROGRESS },
      });
    }

    return updated;
  }

  /**
   * Assign closer and/or PM to a project.
   * Phase 6: No longer auto-advances stage. Closer is assigned at project creation or later.
   */
  async assign(
    id: string,
    dto: { assignedCloserId?: string; assignedPMId?: string; lastEditedById?: string },
  ): Promise<Project> {
    await this.findById(id);

    const updateData: Record<string, unknown> = {};

    if (dto.assignedCloserId !== undefined) {
      updateData.assignedCloserId = dto.assignedCloserId;
    }

    if (dto.assignedPMId !== undefined) {
      updateData.assignedPMId = dto.assignedPMId;
    }

    if (dto.lastEditedById) {
      updateData.lastEditedById = dto.lastEditedById;
    }

    return this.prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        assignedCloser: USER_SELECT,
        assignedPM: USER_SELECT,
        organization: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  /**
   * Review a project — lead/admin can approve or reject.
   * Handles both SCRIPT_REVIEW and UNDER_REVIEW (video review) stages.
   * If SCRIPT_REVIEW is APPROVED, it auto-advances to VIDEO_DRAFT.
   * If UNDER_REVIEW is APPROVED, it stays there (closer must manually submit bid).
   */
  async reviewProject(id: string, dto: ReviewProjectDto): Promise<Project> {
    const project = await this.findById(id);

    if (
      project.stage !== ProjectStage.SCRIPT_REVIEW &&
      project.stage !== ProjectStage.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        `Cannot review project: project is at stage "${project.stage}", expected SCRIPT_REVIEW or UNDER_REVIEW`,
      );
    }

    const updateData: any = {};
    let nextStage = undefined;

    if (project.stage === ProjectStage.SCRIPT_REVIEW) {
      updateData.scriptReviewStatus = dto.status;
      updateData.scriptReviewComments = dto.comments ?? null;
      updateData.scriptReviewedById = dto.reviewedById ?? undefined;
      updateData.scriptReviewedAt = new Date();

      if (dto.status === ReviewStatus.APPROVED) {
        nextStage = ProjectStage.VIDEO_DRAFT;
        updateData.stage = nextStage;
      }
    } else if (project.stage === ProjectStage.UNDER_REVIEW) {
      updateData.reviewStatus = dto.status;
      updateData.reviewComments = dto.comments ?? null;
      updateData.reviewedById = dto.reviewedById ?? undefined;
      updateData.reviewedAt = new Date();
    }

    return this.prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        reviewedBy: USER_SELECT,
        scriptReviewedBy: USER_SELECT,
        assignedCloser: USER_SELECT,
        assignedPM: USER_SELECT,
        organization: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  /**
   * Import a project from scraped Upwork job listing data (Chrome extension).
   * Creates the project in DISCOVERED stage with extension metadata.
   */
  async importFromUpwork(dto: ImportFromUpworkDto, discoveredById?: string): Promise<Project> {
    return this.prisma.project.create({
      data: {
        title: dto.title,
        jobUrl: dto.jobUrl,
        jobDescription: dto.jobDescription,
        pricingType: dto.pricingType,
        fixedPrice: dto.fixedPrice,
        hourlyRateMin: dto.hourlyRateMin,
        hourlyRateMax: dto.hourlyRateMax,
        upworkSkills: dto.skills ?? [],
        organizationId: dto.organizationId,
        nicheId: dto.nicheId,
        discoveredById,
        stage: ProjectStage.DISCOVERED,
        importedFromExtension: true,
      },
      include: {
        niche: { select: { id: true, name: true, slug: true } },
        organization: { select: { id: true, name: true, slug: true } },
        discoveredBy: USER_SELECT,
      },
    });
  }

  /**
   * Returns per-stage project counts, optionally filtered by org.
   */
  async getPipelineCounts(
    organizationId?: string,
  ): Promise<{ stage: ProjectStage; count: number }[]> {
    const stageCounts = await this.prisma.project.groupBy({
      by: ['stage'],
      where: organizationId ? { organizationId } : {},
      _count: { id: true },
    });

    const byStage = new Map(stageCounts.map((s) => [s.stage, s._count.id]));

    // Return all stages in order, with 0 for empty ones
    return STAGE_ORDER.map((stage) => ({ stage, count: byStage.get(stage) ?? 0 }));
  }
}
