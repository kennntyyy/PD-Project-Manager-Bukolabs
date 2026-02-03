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
    const auditLog = this.auditLogRepository.create({
      ...data,
      details: data.details ? JSON.stringify(data.details) : undefined,
    });
    return this.auditLogRepository.save(auditLog);
  }

  async findAll(
    page: number = 1,
    limit: number = 50,
    userId?: string,
    action?: string,
    resource?: string,
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
