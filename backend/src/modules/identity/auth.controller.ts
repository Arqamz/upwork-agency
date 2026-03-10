import { Controller, Post, Get, Patch, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  UpdateProfileDto,
  SwitchOrgDto,
} from './dto';
import { Public, CurrentUser } from '@/common/decorators';
import { JwtPayload } from '@/common/interfaces';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and return tokens' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using a refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user with org memberships' })
  async me(@CurrentUser() payload: JwtPayload) {
    return this.authService.getMe(payload.sub);
  }

  @Post('switch-org')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch active organization — returns new tokens scoped to that org' })
  async switchOrg(@CurrentUser() payload: JwtPayload, @Body() dto: SwitchOrgDto) {
    return this.authService.switchOrganization(payload.sub, dto.organizationId);
  }

  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user display name' })
  async updateProfile(@CurrentUser() payload: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(payload.sub, dto);
  }

  @Patch('change-password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  async changePassword(@CurrentUser() payload: JwtPayload, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(payload.sub, dto.currentPassword, dto.newPassword);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all refresh tokens for current user' })
  async logout(@CurrentUser() payload: JwtPayload) {
    await this.authService.logout(payload.sub);
    return { message: 'Logged out successfully' };
  }
}
