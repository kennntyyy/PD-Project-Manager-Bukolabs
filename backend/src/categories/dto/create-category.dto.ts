import {
    IsString,
    IsOptional,
    IsNumber
} from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    category_name: string;
}
