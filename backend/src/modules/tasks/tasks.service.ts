import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { PaginatedResult } from '@/common/dto';
import { CreateTaskDto, UpdateTaskDto, FindTasksDto } from './dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaskDto) {
    return this.prisma.task.create({ data: dto });
  }

  async findAll(query: FindTasksDto) {
    const where: Prisma.TaskWhereInput = {};

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.task.count({ where }),
    ]);

    return new PaginatedResult(data, total, query.page ?? 1, query.limit ?? 20);
  }

  async findAllByProject(projectId: string) {
    return this.prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: [{ isUrgent: 'desc' }, { priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findById(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        assignee: true,
        qaReview: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with id "${id}" not found`);
    }

    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.findById(id);

    const data: Prisma.TaskUpdateInput = { ...dto };

    if (dto.status === TaskStatus.DONE) {
      data.completedAt = new Date();
    }

    return this.prisma.task.update({
      where: { id },
      data,
    });
  }

  async assign(id: string, assigneeId: string) {
    await this.findById(id);

    return this.prisma.task.update({
      where: { id },
      data: { assigneeId },
    });
  }
}
