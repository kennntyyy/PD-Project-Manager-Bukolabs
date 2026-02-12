import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ContractorTypesService } from './contractor-types.service';
import { CreateContractorTypeDto } from './dto/create-contractor-type.dto';
import { UpdateContractorTypeDto } from './dto/update-contractor-type.dto';

@Controller('contractor-types')
export class ContractorTypesController {
  constructor(private readonly contractorTypesService: ContractorTypesService) {}

  @Post()
  create(@Body() createContractorTypeDto: CreateContractorTypeDto) {
    return this.contractorTypesService.create(createContractorTypeDto);
  }

  @Get()
  findAll() {
    return this.contractorTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractorTypesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContractorTypeDto: UpdateContractorTypeDto) {
    return this.contractorTypesService.update(+id, updateContractorTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contractorTypesService.remove(+id);
  }
}
