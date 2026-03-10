import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards';
import { PaginationDto } from '@/common/dto';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, AssignProjectDto } from './dto';
import { ProjectStage } from '@prisma/client';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project (job discovery)' })
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List projects with optional filters' })
  @ApiQuery({ name: 'stage', enum: ProjectStage, required: false })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'assignedCloserId', required: false })
  @ApiQuery({ name: 'assignedPMId', required: false })
  @ApiQuery({ name: 'discoveredById', required: false })
  @ApiQuery({ name: 'nicheId', required: false })
  @ApiQuery({ name: 'teamId', required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('stage') stage?: ProjectStage,
    @Query('organizationId') organizationId?: string,
    @Query('assignedCloserId') assignedCloserId?: string,
    @Query('assignedPMId') assignedPMId?: string,
    @Query('discoveredById') discoveredById?: string,
    @Query('nicheId') nicheId?: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.projectsService.findAll(pagination, {
      stage,
      organizationId,
      assignedCloserId,
      assignedPMId,
      discoveredById,
      nicheId,
      teamId,
    });
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Get project counts grouped by pipeline stage' })
  @ApiQuery({ name: 'organizationId', required: false })
  getPipelineCounts(@Query('organizationId') organizationId?: string) {
    return this.projectsService.getPipelineCounts(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full project details' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project fields' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Set project stage directly (admin corrections)' })
  updateStage(@Param('id', ParseUUIDPipe) id: string, @Body('stage') stage: ProjectStage) {
    return this.projectsService.updateStage(id, stage);
  }

  @Post(':id/advance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Advance project to the next logical pipeline stage' })
  advanceStage(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.advanceStage(id);
  }

  @Patch(':id/assign')
  @ApiOperation({
    summary: 'Assign closer and/or PM to a project (auto-advances UNDER_REVIEW → ASSIGNED)',
  })
  assign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignProjectDto) {
    return this.projectsService.assign(id, dto);
  }
}
