import { Injectable } from '@nestjs/common';
import { CreateContractorTypeDto } from './dto/create-contractor-type.dto';
import { UpdateContractorTypeDto } from './dto/update-contractor-type.dto';
import { Repository } from 'typeorm';
import { ContractorType } from './entities/contractor-type.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ContractorTypesService {
  constructor(
    @InjectRepository(ContractorType)
    private contractorTypeRepository: Repository<ContractorType>,
  ) {}

 async create(createContractorTypeDto: CreateContractorTypeDto): Promise<ContractorType> {
    const { type_name } = createContractorTypeDto;

    const type = this.contractorTypeRepository.create({
      type_name,
    });

    const savedType = await this.contractorTypeRepository.save(type);

    return savedType;

  }

  async findAll(): Promise<ContractorType[]> {
    return await this.contractorTypeRepository.find({
      order: { type_name: 'ASC' },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} contractorType`;
  }

  update(id: number, updateContractorTypeDto: UpdateContractorTypeDto) {
    return `This action updates a #${id} contractorType`;
  }

  remove(id: number) {
    return `This action removes a #${id} contractorType`;
  }
}
