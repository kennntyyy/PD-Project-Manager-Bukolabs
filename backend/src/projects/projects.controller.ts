import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Request } from 'express';
import { Req } from '@nestjs/common';
import { Project } from './entities/project.entity';
import { User } from 'src/users/entities/user.entity';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @Req() req: Request) {

    const user = req.user as any;
    const userId = user.userId; 
    return this.projectsService.create(createProjectDto, userId);
  }

  @Get()
  async getAllProjects(): Promise<Project[]>{
    return this.projectsService.findAll();
  }
  

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateproject(
    @Param('id') id: string,
    @Body() updateData: any
  ) {
    await this.projectsService.update(id, updateData);
    return { updated: true };
  }
  
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteProject(@Param('id') id: string) {
    await this.projectsService.remove(id);
    return { deleted : true };
  }
}
