import {
    IsString, IsOptional, IsNumber,
    IsBoolean
} from 'class-validator';

export class CreateReportDto {
     //texts
    @IsOptional()
    @IsString()
    report_description: string;

    @IsOptional()
    @IsString()
    work_completed: string;

    @IsOptional()
    @IsString()
    challenges: string;

    @IsOptional()
    @IsString()
    next_steps: string;

    //numbers
    @IsOptional()
    @IsNumber()
    current_progress: number;

    @IsOptional()
    @IsNumber()
    payment_requested: number;

    @IsOptional()
    @IsBoolean()
    payment_triggered: boolean;

    //reference keys / foreign keys
    @IsOptional()
    @IsString()
    project_id: string;

    @IsOptional()
    @IsString()
    created_by: string;

    report_date: Date;
}
   

