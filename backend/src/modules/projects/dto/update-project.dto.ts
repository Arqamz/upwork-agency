import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStage, PricingType } from '@prisma/client';

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobDescription?: string;

  @ApiPropertyOptional({ enum: PricingType })
  @IsOptional()
  @IsEnum(PricingType)
  pricingType?: PricingType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRateMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRateMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedPrice?: number;

  @ApiPropertyOptional({ enum: ProjectStage })
  @IsOptional()
  @IsEnum(ProjectStage)
  stage?: ProjectStage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverLetter?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoScript?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  upworkAccount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  bidAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  suggestedBidAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  nicheId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  lastEditedById?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedCloserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedPMId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  contractValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
