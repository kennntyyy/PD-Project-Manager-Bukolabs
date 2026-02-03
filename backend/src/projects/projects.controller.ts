import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Request } from 'express';
import { Req } from '@nestjs/common';
import { Project } from './entities/project.entity';
import { User } from 'src/users/entities/user.entity';
import { CurrentUser } from 'src/common/guards/current-user.decorator';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createProjectDto: CreateProjectDto,
    @Req() req: Request,
    @CurrentUser() currentUser?: any,
  ) {
    const user = req.user as any;
    const userId = user.userId;
    return this.projectsService.create(createProjectDto, userId, currentUser);
  }

  @Get()
  async getAllProjects(@Req() req: Request): Promise<Project[]> {
    const includeDeleted = req.query['includeDeleted'] === 'true';
    return this.projectsService.findAll(includeDeleted);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateproject(
    @Param('id') id: string,
    @Body() updateData: any,
    @CurrentUser() currentUser?: any,
  ) {
    await this.projectsService.update(id, updateData, currentUser);
    return { updated: true };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteProject(
    @Param('id') id: string,
    @Req() req: Request,
    @CurrentUser() currentUser?: any,
  ) {
    const permanent = req.query['permanent'] === 'true';
    if (permanent) {
      await this.projectsService.permanentRemove(id, currentUser);
      return { deleted: true, permanent: true };
    } else {
      await this.projectsService.remove(id, currentUser);
      return { deleted: true, permanent: false };
    }
  }
}
