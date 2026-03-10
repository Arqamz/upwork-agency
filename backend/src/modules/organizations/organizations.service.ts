import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto) {
    const existing = await this.prisma.organization.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`An organization with slug "${dto.slug}" already exists`);
    }

    return this.prisma.organization.create({
      data: dto,
      include: { _count: { select: { members: true, projects: true } } },
    });
  }

  async findAll(includeInactive = false) {
    return this.prisma.organization.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: { _count: { select: { members: true, projects: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true, projects: true } },
        members: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!org) {
      throw new NotFoundException(`Organization with id "${id}" not found`);
    }

    return org;
  }

  async findBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      include: { _count: { select: { members: true, projects: true } } },
    });

    if (!org) {
      throw new NotFoundException(`Organization with slug "${slug}" not found`);
    }

    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    await this.findById(id);

    if (dto.slug) {
      const conflict = await this.prisma.organization.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (conflict) {
        throw new ConflictException(`An organization with slug "${dto.slug}" already exists`);
      }
    }

    return this.prisma.organization.update({
      where: { id },
      data: dto,
      include: { _count: { select: { members: true, projects: true } } },
    });
  }

  async addMember(orgId: string, userId: string) {
    await this.findById(orgId);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id "${userId}" not found`);
    }

    const existing = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this organization');
    }

    return this.prisma.userOrganization.create({
      data: { userId, organizationId: orgId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        organization: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async removeMember(orgId: string, userId: string) {
    await this.findById(orgId);

    const membership = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });

    if (!membership) {
      throw new NotFoundException('User is not a member of this organization');
    }

    await this.prisma.userOrganization.delete({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });

    return { message: 'Member removed successfully' };
  }

  async getMembers(orgId: string) {
    await this.findById(orgId);

    return this.prisma.userOrganization.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            role: { select: { id: true, name: true } },
            team: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getUserOrganizations(userId: string) {
    return this.prisma.userOrganization.findMany({
      where: { userId },
      include: {
        organization: {
          include: { _count: { select: { members: true, projects: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async isMember(orgId: string, userId: string): Promise<boolean> {
    const membership = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    return !!membership;
  }
}
