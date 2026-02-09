import { Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    userId: string,
    currentUser?: any,
  ): Promise<Project> {
    const {
      project_name,
      project_description,
      total_amount,
      project_deadline,
      contractor_id,
      client_id,
      parent_project_id,
    } = createProjectDto;

    const project = this.projectRepository.create({
      project_name,
      project_description,
      total_amount,
      project_deadline,
      created_by: userId,
      contractor_id,
      client_id,
      parent_project_id,
    });

    const savedProject = await this.projectRepository.save(project);

    // Log audit event
    await this.auditLogsService.create({
      userId: currentUser?.userId,
      userName: currentUser?.username,
      action: 'CREATE',
      resource: 'PROJECT',
      resourceId: savedProject.project_id,
      details: {
        project_name: savedProject.project_name,
        contractor_id,
        client_id,
        parent_project_id,
      },
    });

    return savedProject;
  }

  async findAll(includeDeleted = false): Promise<Project[]> {
    if (includeDeleted) {
      return await this.projectRepository.find();
    } else {
      return await this.projectRepository.find({
        where: { isDeleted: false },
      });
    }
  }

  findOne(id: string) {
    return `This action returns a #${id} project`;
  }

  async update(
    id: string,
    UpdateProjectDto: any,
    currentUser?: any,
  ): Promise<void> {
    // Get existing project to compare changes
    const existingProject = await this.projectRepository.findOne({
      where: { project_id: id },
    });

    const updateData: any = {
      project_name: UpdateProjectDto.project_name,
      project_description: UpdateProjectDto.project_description,
      total_amount: UpdateProjectDto.total_amount,
      project_deadline: UpdateProjectDto.project_deadline,
      contractor_id: UpdateProjectDto.contractor_id,
      client_id: UpdateProjectDto.client_id,
      project_status: UpdateProjectDto.project_status,
    };
    // If restoring, clear deleted_at and isDeleted
    if (UpdateProjectDto.isDeleted === false) {
      updateData.isDeleted = false;
      updateData.deleted_at = null;
    }
    await this.projectRepository.update(id, updateData);

    // Log audit event - only log fields that actually changed
    const fieldMapping: Record<string, string> = {
      project_name: 'project_name',
      project_description: 'project_description',
      total_amount: 'total_amount',
      project_deadline: 'project_deadline',
      contractor_id: 'contractor_id',
      client_id: 'client_id',
      project_status: 'project_status',
      parent_project_id: 'parent_project_id',
    };

    const actualChanges: Record<string, any> = {};
    Object.keys(UpdateProjectDto).forEach((dtoKey) => {
      const dbKey = fieldMapping[dtoKey] || dtoKey;
      if (existingProject && UpdateProjectDto[dtoKey] !== undefined) {
        const oldValue = (existingProject as any)[dbKey];
        const newValue = UpdateProjectDto[dtoKey];

        // Handle date comparison
        let valuesAreDifferent = false;
        if (oldValue instanceof Date && newValue) {
          valuesAreDifferent =
            oldValue.toISOString() !== new Date(newValue).toISOString();
        } else {
          valuesAreDifferent = oldValue !== newValue;
        }

        if (valuesAreDifferent) {
          actualChanges[dtoKey] = UpdateProjectDto[dtoKey];
        }
      }
    });

    // Only log if there were actual changes
    if (Object.keys(actualChanges).length > 0) {
      // Check if this is a restore operation
      const isRestore =
        UpdateProjectDto.isDeleted === false &&
        existingProject?.isDeleted === true;

      await this.auditLogsService.create({
        userId: currentUser?.userId,
        userName: currentUser?.username,
        action: isRestore ? 'RESTORE' : 'UPDATE',
        resource: 'PROJECT',
        resourceId: id,
        details: {
          updatedFields: Object.keys(actualChanges),
          changes: actualChanges,
        },
      });
    }
  }

  async remove(id: string, currentUser?: any): Promise<void> {
    await this.projectRepository.update(id, {
      isDeleted: true,
      deleted_at: new Date(),
    });

    // Log audit event
    await this.auditLogsService.create({
      userId: currentUser?.userId,
      userName: currentUser?.username,
      action: 'DELETE',
      resource: 'PROJECT',
      resourceId: id,
      details: { projectId: id },
    });
  }

  async permanentRemove(id: string, currentUser?: any): Promise<void> {
    await this.projectRepository.delete(id);

    // Log audit event for permanent deletion
    await this.auditLogsService.create({
      userId: currentUser?.userId,
      userName: currentUser?.username,
      action: 'DELETE',
      resource: 'PROJECT',
      resourceId: id,
      details: { projectId: id, permanentDelete: true },
    });
  }
}
