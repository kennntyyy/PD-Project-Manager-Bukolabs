import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { Report } from '../reports/entities/report.entity';

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
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
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

    // Filter by project_id using robust application-side matching to avoid JSON formatting issues
    if (projectId) {
      query.andWhere('audit_log.resource IN (:...resources)', {
        resources: ['PROJECT', 'REPORT'],
      });
      console.log('[AUDIT-LOGS] Querying for project:', projectId);
    }

    query.orderBy('audit_log.timestamp', 'DESC');

    let data: AuditLog[] = [];
    let total = 0;

    if (projectId) {
      const candidateLogs = await query.getMany();
      const reportIds = Array.from(
        new Set(
          candidateLogs
            .filter(
              (log) => log.resource === 'REPORT' && Boolean(log.resourceId),
            )
            .map((log) => log.resourceId as string),
        ),
      );

      let reportProjectMap = new Map<string, string>();
      if (reportIds.length > 0) {
        const reports = await this.reportRepository.find({
          where: {
            report_id: In(reportIds),
          },
          select: ['report_id', 'project_id'],
        });

        reportProjectMap = new Map(
          reports.map((report) => [
            String(report.report_id),
            String(report.project_id),
          ]),
        );
      }

      const filteredLogs = candidateLogs.filter((log) =>
        this.isLogRelatedToProject(log, projectId, reportProjectMap),
      );

      total = filteredLogs.length;
      const start = (page - 1) * limit;
      data = filteredLogs.slice(start, start + limit);
    } else {
      query.skip((page - 1) * limit);
      query.take(limit);
      [data, total] = await query.getManyAndCount();
    }

    if (projectId) {
      console.log('[AUDIT-LOGS] Query result:', {
        projectId,
        total,
        found: data.length,
        actions: data.map((d) => ({ action: d.action, resource: d.resource })),
      });
    }

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

  private isLogRelatedToProject(
    log: AuditLog,
    projectId: string,
    reportProjectMap: Map<string, string>,
  ): boolean {
    if (log.resource === 'PROJECT' && log.resourceId === projectId) {
      return true;
    }

    if (log.resource === 'REPORT' && log.resourceId) {
      const linkedProjectId = reportProjectMap.get(String(log.resourceId));
      if (linkedProjectId === projectId) {
        return true;
      }
    }

    const details = this.parseDetails(log.details);

    if (this.containsProjectReference(details, projectId)) {
      return true;
    }

    if (typeof log.details === 'string' && log.details.includes(projectId)) {
      return true;
    }

    return false;
  }

  private parseDetails(details?: string | object): unknown {
    if (!details) {
      return null;
    }

    if (typeof details === 'object') {
      return details;
    }

    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  }

  private containsProjectReference(value: unknown, projectId: string): boolean {
    if (value == null) {
      return false;
    }

    if (typeof value === 'string') {
      return value === projectId;
    }

    if (Array.isArray(value)) {
      return value.some((entry) =>
        this.containsProjectReference(entry, projectId),
      );
    }

    if (typeof value === 'object') {
      for (const [key, nestedValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        if (
          (key === 'project_id' || key === 'parent_project_id') &&
          nestedValue === projectId
        ) {
          return true;
        }

        if (this.containsProjectReference(nestedValue, projectId)) {
          return true;
        }
      }
    }

    return false;
  }
}
