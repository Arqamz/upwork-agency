import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUpworkAccountDto {
  @ApiProperty({ example: 'AOP_Main' })
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @ApiPropertyOptional({ example: 'https://www.upwork.com/freelancers/~01abc123' })
  @IsOptional()
  @IsString()
  profileUrl?: string;
}
