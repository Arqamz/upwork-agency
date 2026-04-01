import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  UpdateProfileDto,
  SwitchOrgDto,
} from './dto';
import { CreateUpworkAccountDto } from './dto/upwork-account.dto';
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

  // ── Upwork Account Management ──────────────────────────────────────────

  @Get('upwork-accounts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List linked Upwork accounts for current user' })
  async getUpworkAccounts(@CurrentUser() payload: JwtPayload) {
    return this.authService.getUpworkAccounts(payload.sub);
  }

  @Post('upwork-accounts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link a new Upwork account' })
  async createUpworkAccount(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: CreateUpworkAccountDto,
  ) {
    return this.authService.createUpworkAccount(payload.sub, dto);
  }

  @Delete('upwork-accounts/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink an Upwork account' })
  async deleteUpworkAccount(
    @CurrentUser() payload: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.authService.deleteUpworkAccount(payload.sub, id);
  }

  @Patch('upwork-accounts/:id/default')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set an Upwork account as default' })
  async setDefaultUpworkAccount(
    @CurrentUser() payload: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.authService.setDefaultUpworkAccount(payload.sub, id);
  }
}
