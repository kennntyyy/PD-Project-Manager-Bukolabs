import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractorTypesService } from './contractor-types.service';
import { ContractorTypesController } from './contractor-types.controller';
import { ContractorType } from './entities/contractor-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContractorType])],
  controllers: [ContractorTypesController],
  providers: [ContractorTypesService],
})
export class ContractorTypesModule {}
