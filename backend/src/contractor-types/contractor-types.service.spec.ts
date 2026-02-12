import { Test, TestingModule } from '@nestjs/testing';
import { ContractorTypesService } from './contractor-types.service';

describe('ContractorTypesService', () => {
  let service: ContractorTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContractorTypesService],
    }).compile();

    service = module.get<ContractorTypesService>(ContractorTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
