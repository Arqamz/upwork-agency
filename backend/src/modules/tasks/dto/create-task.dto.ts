import { IsString, IsOptional, IsUUID, IsNumber, IsInt, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiProperty({ example: 'Implement login page' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Create a responsive login page with email/password fields' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;
}
