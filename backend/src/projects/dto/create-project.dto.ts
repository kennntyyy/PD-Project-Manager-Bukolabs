import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  project_name: string;

  @IsOptional()
  @IsString()
  project_description?: string;

  @IsOptional()
  @IsNumber()
  total_amount?: number;

  @IsOptional()
  @IsNumber()
  amount_paid?: number;

  @IsOptional()
  @IsNumber()
  amount_due?: number;

  @IsOptional()
  project_deadline?: Date;

  @IsOptional()
  project_start_date?: Date;

  @IsOptional()
  @IsString()
  project_status?: string;

  @IsOptional()
  @IsString()
  payment_status?: string;

  @IsOptional()
  @IsString()
  client_id?: string;

  @IsOptional()
  @IsString()
  staff_id?: string;

  @IsOptional()
  @IsString()
  contractor_id?: string;
}
