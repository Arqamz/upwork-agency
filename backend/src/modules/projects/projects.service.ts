import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PaginationDto, PaginatedResult } from '@/common/dto';
import { CreateProjectDto, UpdateProjectDto, ReviewProjectDto } from './dto';
import { Project, ProjectStage, ReviewStatus } from '@prisma/client';

// Ordered stage list — used for pipeline counting display
// ASSIGNED is kept in the enum for backward compat but excluded from visible pipeline
export const STAGE_ORDER: ProjectStage[] = [
  ProjectStage.DISCOVERED,
  ProjectStage.SCRIPTED,
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
  [ProjectStage.SCRIPTED]: ProjectStage.UNDER_REVIEW,
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
          _count: {
            select: { tasks: true, meetings: true, milestones: true, videoProposals: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

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
        milestones: { orderBy: { createdAt: 'asc' } },
        tasks: { orderBy: { createdAt: 'desc' } },
        meetings: { orderBy: { scheduledAt: 'asc' } },
        videoProposals: { orderBy: { createdAt: 'desc' } },
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
   *   - SCRIPTED → UNDER_REVIEW: auto-sets reviewStatus = PENDING
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

    // SCRIPTED → UNDER_REVIEW: auto-set reviewStatus to PENDING
    if (project.stage === ProjectStage.SCRIPTED && nextStage === ProjectStage.UNDER_REVIEW) {
      updateData.reviewStatus = ReviewStatus.PENDING;
    }

    // UNDER_REVIEW → BID_SUBMITTED: guard — require APPROVED review
    if (project.stage === ProjectStage.UNDER_REVIEW && nextStage === ProjectStage.BID_SUBMITTED) {
      if ((project as any).reviewStatus !== ReviewStatus.APPROVED) {
        throw new BadRequestException(
          'Cannot submit bid: project must be approved by a lead first (reviewStatus must be APPROVED)',
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
   * Sets reviewStatus, reviewComments, reviewedById, reviewedAt.
   * If REJECTED, the project stays in UNDER_REVIEW with REJECTED badge.
   */
  async reviewProject(id: string, dto: ReviewProjectDto): Promise<Project> {
    const project = await this.findById(id);

    if (project.stage !== ProjectStage.UNDER_REVIEW) {
      throw new BadRequestException(
        `Cannot review project: project is at stage "${project.stage}", expected UNDER_REVIEW`,
      );
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        reviewStatus: dto.status,
        reviewComments: dto.comments ?? null,
        reviewedById: dto.reviewedById ?? undefined,
        reviewedAt: new Date(),
      },
      include: {
        reviewedBy: USER_SELECT,
        assignedCloser: USER_SELECT,
        assignedPM: USER_SELECT,
        organization: { select: { id: true, name: true, slug: true } },
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
