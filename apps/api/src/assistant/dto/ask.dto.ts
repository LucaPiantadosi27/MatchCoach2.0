import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AskDto {
  @IsIn(['A', 'B'])
  channel!: 'A' | 'B';

  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsString()
  @IsOptional()
  schemeId?: string;
}
