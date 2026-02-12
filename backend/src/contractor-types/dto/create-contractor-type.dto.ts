import {
    IsString,
    IsOptional
} from 'class-validator';

export class CreateContractorTypeDto {
    @IsString()
    type_name: string;
}
