import { Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<Project> {
    const { project_name, project_description, total_amount, project_deadline, contractor_id } = createProjectDto;

    const project = this.projectRepository.create({
        project_name,           
        project_description,    
        total_amount,           
        project_deadline,
        created_by: userId,
        contractor_id,
    });

    return await this.projectRepository.save(project);
  }

  async findAll(): Promise<Project[]> {
   
    return await this.projectRepository.find({
      where: { isDeleted: false }
    });
  }

  findOne(id: string) {
    
    return `This action returns a #${id} project`;
  }

  async update(id: string, UpdateProjectDto: any): Promise<void> {

    await this.projectRepository.update(id, {
      project_name: UpdateProjectDto.project_name,
      project_description: UpdateProjectDto.project_description,
      total_amount: UpdateProjectDto.total_amount,
      project_deadline: UpdateProjectDto.project_deadline,
    });
  }

  async remove(id: string): Promise<void> {
    await this.projectRepository.update(id, { isDeleted: true });
  }
}
