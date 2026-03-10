import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Development Services' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'org-dev',
    description: 'URL-safe slug, lowercase letters/numbers/hyphens',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase letters, numbers, and hyphens only' })
  slug: string;

  @ApiPropertyOptional({ example: 'Handles all software development service projects' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase letters, numbers, and hyphens only' })
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AddMemberDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
