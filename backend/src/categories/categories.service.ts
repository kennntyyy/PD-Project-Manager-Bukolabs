import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';


@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const {
      category_name
    } = createCategoryDto;

    const category = this.categoryRepository.create({
      category_name,
    });

    const savedCategory = await this.categoryRepository.save(category);

    return savedCategory;
  }

  findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Category | null> {
    return this.categoryRepository.findOne({
      where: { category_id: id },
    });
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category | null> {
    const category = await this.categoryRepository.findOne({
      where: { category_id: id },
    });

    if (!category) {
      return null;
    }

    const updated = this.categoryRepository.merge(category, updateCategoryDto);
    return this.categoryRepository.save(updated);
  }

  async remove(id: string): Promise<void> {
    await this.categoryRepository.delete({ category_id: id });
  }
}
