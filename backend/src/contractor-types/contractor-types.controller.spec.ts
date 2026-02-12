import { Test, TestingModule } from '@nestjs/testing';
import { ContractorTypesController } from './contractor-types.controller';
import { ContractorTypesService } from './contractor-types.service';

describe('ContractorTypesController', () => {
  let controller: ContractorTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractorTypesController],
      providers: [ContractorTypesService],
    }).compile();

    controller = module.get<ContractorTypesController>(ContractorTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
