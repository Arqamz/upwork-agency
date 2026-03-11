import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReviewStatus } from '@prisma/client';

export class ReviewProjectDto {
  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsUUID()
  reviewedById?: string;
}
