import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
} from 'class-validator';

export class UpdateSchemeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  boardState?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  recording?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
