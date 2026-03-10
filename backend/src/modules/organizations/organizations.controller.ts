import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles, CurrentUser } from '@/common/decorators';
import { ROLES } from '@/common/constants';
import { JwtPayload } from '@/common/interfaces';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto, AddMemberDto } from './dto';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all organizations' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.orgsService.findAll(includeInactive === 'true');
  }

  @Get('my')
  @ApiOperation({ summary: "List the current user's organization memberships" })
  getMyOrganizations(@CurrentUser() user: JwtPayload) {
    return this.orgsService.getUserOrganizations(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID (with members)' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgsService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Create a new organization (admin only)' })
  create(@Body() dto: CreateOrganizationDto) {
    return this.orgsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Update organization (admin only)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrganizationDto) {
    return this.orgsService.update(id, dto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List members of an organization' })
  getMembers(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgsService.getMembers(id);
  }

  @Post(':id/members')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Add a user to an organization (admin only)' })
  addMember(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddMemberDto) {
    return this.orgsService.addMember(id, dto.userId);
  }

  @Delete(':id/members/:userId')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Remove a user from an organization (admin only)' })
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.orgsService.removeMember(id, userId);
  }
}
