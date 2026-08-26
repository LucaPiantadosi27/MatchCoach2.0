import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateVideoDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  schemeId?: string;

  @IsString()
  @IsOptional()
  filename?: string;
}
