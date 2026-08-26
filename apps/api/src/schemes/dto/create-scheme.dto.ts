import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsArray,
} from 'class-validator';

enum SchemeTypeDto {
  STATIC = 'STATIC',
  RECORDING = 'RECORDING',
}

export class CreateSchemeDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(SchemeTypeDto)
  type?: SchemeTypeDto;

  @IsObject()
  boardState!: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  recording?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  seasonId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
