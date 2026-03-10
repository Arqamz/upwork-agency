import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AssignProjectDto {
  @ApiPropertyOptional({ description: 'UUID of the closer to assign' })
  @IsOptional()
  @IsUUID()
  assignedCloserId?: string;

  @ApiPropertyOptional({ description: 'UUID of the project manager to assign' })
  @IsOptional()
  @IsUUID()
  assignedPMId?: string;

  @ApiPropertyOptional({ description: 'UUID of the user making this edit (for audit trail)' })
  @IsOptional()
  @IsUUID()
  lastEditedById?: string;
}
