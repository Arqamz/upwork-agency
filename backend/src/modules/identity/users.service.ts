import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/prisma/prisma.service';
import { PaginationDto, PaginatedResult } from '@/common/dto';
import { CreateUserDto, UpdateUserDto } from './dto';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleId: dto.roleId,
        teamId: dto.teamId,
      },
      include: { role: true, team: true },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findAll(pagination: PaginationDto) {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: pagination.skip,
        take: pagination.take,
        include: { role: true, team: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    const sanitized = users.map(({ passwordHash, ...user }) => user);

    return new PaginatedResult(sanitized, total, pagination.page ?? 1, pagination.limit ?? 20);
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true, team: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true, team: true },
    });

    if (!user) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async update(id: string, dto: UpdateUserDto): Promise<Omit<User, 'passwordHash'>> {
    await this.findById(id);

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    const updateData: Record<string, unknown> = {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      roleId: dto.roleId,
      teamId: dto.teamId,
    };

    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true, team: true },
    });

    const { passwordHash, ...result } = user;
    return result;
  }

  async listRoles() {
    return this.prisma.role.findMany({ orderBy: { name: 'asc' } });
  }

  async listTeams() {
    return this.prisma.team.findMany({ orderBy: { name: 'asc' } });
  }
}
