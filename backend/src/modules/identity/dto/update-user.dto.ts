import { OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

class UpdateUserBaseDto extends PartialType(OmitType(CreateUserDto, ['password'] as const)) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUserDto extends UpdateUserBaseDto {}
