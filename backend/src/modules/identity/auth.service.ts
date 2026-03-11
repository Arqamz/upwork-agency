import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtPayload } from '@/common/interfaces';
import { User, Role } from '@prisma/client';
import { UpdateProfileDto } from './dto';

type UserWithRole = User & { role: Role };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        team: true,
        organizations: {
          include: {
            organization: {
              select: { id: true, name: true, slug: true, isActive: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Pick the user's first org membership as default org context
    const firstMembership = await this.prisma.userOrganization.findFirst({
      where: { userId: user.id },
      include: { organization: true },
      orderBy: { createdAt: 'asc' },
    });

    const tokens = await this.generateTokens(user, firstMembership?.organizationId);

    const { passwordHash, ...userWithoutPassword } = user;
    return {
      ...tokens,
      user: {
        ...userWithoutPassword,
        activeOrganizationId: firstMembership?.organizationId ?? null,
      },
    };
  }

  async refreshToken(token: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { include: { role: true, team: true } } },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.generateTokens(storedToken.user);

    const { passwordHash, ...userWithoutPassword } = storedToken.user;
    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        team: true,
        organizations: {
          include: {
            organization: {
              select: { id: true, name: true, slug: true, isActive: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async switchOrganization(userId: string, organizationId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, team: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Admins can switch to any org; others must be a member
    if (user.role.name !== 'admin') {
      const membership = await this.prisma.userOrganization.findUnique({
        where: { userId_organizationId: { userId, organizationId } },
      });

      if (!membership) {
        throw new ForbiddenException('You are not a member of this organization');
      }
    }

    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      throw new NotFoundException(`Organization "${organizationId}" not found`);
    }
    if (!org.isActive) {
      throw new ForbiddenException('This organization is inactive');
    }

    const tokens = await this.generateTokens(user, organizationId);

    const { passwordHash, ...userWithoutPassword } = user;
    return {
      ...tokens,
      user: { ...userWithoutPassword, activeOrganizationId: organizationId },
    };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    return { message: 'Password updated successfully' };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, team: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      include: { role: true, team: true },
    });

    const { passwordHash, ...result } = updated;
    return result;
  }

  async generateTokens(user: UserWithRole, organizationId?: string) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      teamId: user.teamId ?? undefined,
      organizationId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    const refreshTokenValue = uuidv4();
    const refreshExpiresIn = this.configService.get<number>('REFRESH_TOKEN_DAYS', 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId: user.id,
        expiresAt: new Date(Date.now() + refreshExpiresIn * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }
}
