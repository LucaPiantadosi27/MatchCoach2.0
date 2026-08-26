import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreatePlayerDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  @Max(99)
  number!: number;

  @IsOptional()
  @IsString()
  position?: string;
}
