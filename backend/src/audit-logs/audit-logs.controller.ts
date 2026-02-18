import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles('admin')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('search') search?: string,
    @Query('project_id') projectId?: string,
  ) {
    try {
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 50;

      return this.auditLogsService.findAll(
        pageNum,
        limitNum,
        userId,
        action,
        resource,
        search,
        projectId,
      );
    } catch (error) {
      console.error('AuditLogs findAll error:', error);
      throw error;
    }
  }

  @Get('user')
  @Roles('admin')
  async findByUser(@Query('userId') userId: string) {
    return this.auditLogsService.findByUser(userId);
  }

  @Get('resource')
  @Roles('admin')
  async findByResource(
    @Query('resource') resource: string,
    @Query('resourceId') resourceId: string,
  ) {
    return this.auditLogsService.findByResource(resource, resourceId);
  }
}
