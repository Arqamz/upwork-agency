import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SwitchOrgDto {
  @ApiProperty({ example: 'org-uuid' })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;
}
