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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, FindTasksDto, AssignTaskDto } from './dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindTasksDto) {
    return this.tasksService.findAll(query);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all tasks (unpaginated, for kanban — max 500)' })
  findAllForKanban(
    @Query('assigneeId') assigneeId?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.tasksService.findAllForKanban({ assigneeId, projectId });
  }

  @Get('by-project/:projectId')
  @ApiOperation({ summary: 'Get all tasks for a project (unpaginated, for kanban)' })
  findAllByProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.tasksService.findAllByProject(projectId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Post(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignTaskDto) {
    return this.tasksService.assign(id, dto.assigneeId);
  }
}
