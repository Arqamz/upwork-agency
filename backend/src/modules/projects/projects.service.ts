import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PaginationDto, PaginatedResult } from '@/common/dto';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { Project, ProjectStage } from '@prisma/client';

// Ordered stage list — used for pipeline counting display
export const STAGE_ORDER: ProjectStage[] = [
  ProjectStage.DISCOVERED,
  ProjectStage.SCRIPTED,
  ProjectStage.UNDER_REVIEW,
  ProjectStage.ASSIGNED,
  ProjectStage.BID_SUBMITTED,
  ProjectStage.VIEWED,
  ProjectStage.MESSAGED,
  ProjectStage.INTERVIEW,
  ProjectStage.WON,
  ProjectStage.IN_PROGRESS,
  ProjectStage.COMPLETED,
  ProjectStage.LOST,
  ProjectStage.CANCELLED,
];

// Valid forward transitions (strict mode via /advance endpoint)
const NEXT_STAGE: Partial<Record<ProjectStage, ProjectStage>> = {
  [ProjectStage.DISCOVERED]: ProjectStage.SCRIPTED,
  [ProjectStage.SCRIPTED]: ProjectStage.UNDER_REVIEW,
  [ProjectStage.UNDER_REVIEW]: ProjectStage.ASSIGNED,
  [ProjectStage.ASSIGNED]: ProjectStage.BID_SUBMITTED,
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
          _count: { select: { tasks: true, meetings: true, milestones: true } },
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

    return this.prisma.project.update({
      where: { id },
      data: { stage: nextStage },
    });
  }

  /**
   * Assign closer and/or PM to a project.
   * Automatically advances stage from UNDER_REVIEW → ASSIGNED when a closer is set.
   */
  async assign(
    id: string,
    dto: { assignedCloserId?: string; assignedPMId?: string; lastEditedById?: string },
  ): Promise<Project> {
    const project = await this.findById(id);

    const updateData: Record<string, unknown> = {};

    if (dto.assignedCloserId !== undefined) {
      updateData.assignedCloserId = dto.assignedCloserId;
      // Auto-advance: if currently UNDER_REVIEW and closer is being assigned, move to ASSIGNED
      if (project.stage === ProjectStage.UNDER_REVIEW && dto.assignedCloserId !== null) {
        updateData.stage = ProjectStage.ASSIGNED;
      }
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
