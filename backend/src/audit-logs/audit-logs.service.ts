import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface CreateAuditLogDto {
  userId?: string;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(data: CreateAuditLogDto): Promise<AuditLog> {
    const maxDetailsLength = 60000;
    let detailsString = data.details ? JSON.stringify(data.details) : undefined;

    if (detailsString && detailsString.length > maxDetailsLength) {
      detailsString = JSON.stringify({
        truncated: true,
        originalLength: detailsString.length,
        preview: detailsString.slice(0, 1000),
      });
    }

    const auditLog = this.auditLogRepository.create({
      ...data,
      details: detailsString,
    });
    return this.auditLogRepository.save(auditLog);
  }

  async findAll(
    page: number = 1,
    limit: number = 50,
    userId?: string,
    action?: string,
    resource?: string,
    search?: string,
    projectId?: string,
  ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const query = this.auditLogRepository.createQueryBuilder('audit_log');

    if (userId) {
      query.andWhere('audit_log.userId = :userId', { userId });
    }

    if (action) {
      query.andWhere('audit_log.action = :action', { action });
    }

    if (resource) {
      query.andWhere('audit_log.resource = :resource', { resource });
    }

    if (search) {
      query.andWhere(
        '(audit_log.action LIKE :search OR audit_log.resource LIKE :search OR audit_log.userName LIKE :search OR audit_log.resourceId LIKE :search OR audit_log.details LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filter by project_id: includes project updates, subproject creations, and report generations
    if (projectId) {
      query.andWhere(
        '((audit_log.resource = :projectResource AND audit_log.resourceId = :projectId) OR ' +
        '(audit_log.resource = :projectResource AND audit_log.details LIKE :parentProjectPattern) OR ' +
        '(audit_log.resource = :reportResource AND audit_log.details LIKE :projectIdPattern))',
        {
          projectResource: 'PROJECT',
          reportResource: 'REPORT',
          projectId: projectId,
          parentProjectPattern: `%"parent_project_id":"${projectId}"%`,
          projectIdPattern: `%"project_id":"${projectId}"%`,
        },
      );
    }

    query.orderBy('audit_log.timestamp', 'DESC');
    query.skip((page - 1) * limit);
    query.take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findByUser(userId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: 100,
    });
  }

  async findByResource(
    resource: string,
    resourceId: string,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { resource, resourceId },
      order: { timestamp: 'DESC' },
    });
  }
}
