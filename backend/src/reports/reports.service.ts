import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { Project } from '../projects/entities/project.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private auditLogsService: AuditLogsService,
  ) {}

  //save data to db table = reports
  async create(
    createReportDto: CreateReportDto,
    files?: Express.Multer.File[],
    currentUser?: any,
  ): Promise<Report> {
    const {
      project_id,
      report_date,
      start_date,
      end_date,
      current_progress,
      report_description,
      work_completed,
      challenges,
      next_steps,
      payment_requested,
      payment_triggered,
      image_urls,
      image_comments,
    } = createReportDto;

    // Generate image URLs from uploaded files
    const imageUrlsArray = files
      ? files.map((file) => `/uploads/reports/${file.filename}`)
      : image_urls || [];

    const report = this.reportRepository.create({
      project_id,
      report_date,
      start_date,
      end_date,
      current_progress,
      report_description,
      work_completed,
      challenges,
      next_steps,
      payment_requested,
      payment_triggered,
      image_urls: imageUrlsArray,
      image_comments: image_comments,
      created_by: currentUser?.username,
    });

    const savedReport = await this.reportRepository.save(report);

    if (project_id && payment_requested) {
      const project = await this.projectRepository.findOne({
        where: { project_id },
      });

      if (project) {
        const currentPaid = Number(project.amount_paid || 0);
        const payment = Number(payment_requested || 0);
        const totalAmount = Number(project.total_amount || 0);
        const newPaid = currentPaid + payment;
        const newDue = Math.max(0, totalAmount - newPaid);

        await this.projectRepository.update(project_id, {
          amount_paid: newPaid,
          amount_due: newDue,
        });
      }
    }

    // Log audit event
    await this.auditLogsService.create({
      userId: currentUser?.userId,
      userName: currentUser?.username,
      action: 'CREATE',
      resource: 'REPORT',
      resourceId: savedReport.report_id,
      details: {
        project_id,
        payment_requested,
        current_progress,
      },
    });

    return savedReport;
  }

  //get all reports from db table = reports where isDeleted = false
  async findAll(includeDeleted = false): Promise<Report[]> {
    if (includeDeleted) {
      return this.reportRepository.find();
    } else {
      return this.reportRepository.find({
        where: { isDeleted: false },
      });
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} report`;
  }

  //update report data in db table = reports
  async update(
    id: string,
    UpdateReportDto: any,
    currentUser?: any,
  ): Promise<void> {
    // Get existing report to compare changes
    const existingReport = await this.reportRepository.findOne({
      where: { report_id: id },
    });

    if (!existingReport) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    const updateData: any = {
      report_date: UpdateReportDto.report_date,
      start_date: UpdateReportDto.start_date,
      end_date: UpdateReportDto.end_date,
      current_progress: UpdateReportDto.current_progress,
      report_description: UpdateReportDto.report_description,
      work_completed: UpdateReportDto.work_completed,
      challenges: UpdateReportDto.challenges,
      next_steps: UpdateReportDto.next_steps,
      payment_requested: UpdateReportDto.payment_requested,
      payment_triggered: UpdateReportDto.payment_triggered,
    };

    await this.reportRepository.update(id, updateData);

    // Track all changes for audit
    const actualChanges: Record<string, any> = {};
    const previousValues: Record<string, any> = {};

    Object.keys(UpdateReportDto).forEach((key) => {
      if (UpdateReportDto[key] !== undefined) {
        const oldValue = (existingReport as any)[key];
        const newValue = UpdateReportDto[key];

        // Handle date comparison
        let valuesAreDifferent = false;
        if (oldValue instanceof Date && newValue) {
          valuesAreDifferent =
            oldValue.toISOString() !== new Date(newValue).toISOString();
        } else {
          valuesAreDifferent = oldValue !== newValue;
        }

        if (valuesAreDifferent) {
          actualChanges[key] = newValue;
          previousValues[key] = oldValue;
        }
      }
    });

    // Log if there were actual changes
    if (Object.keys(actualChanges).length > 0) {
      const paymentStatusChanged =
        actualChanges.payment_triggered !== undefined;
      const auditDetails: any = {
        project_id: existingReport.project_id,
        report_id: id,
        payment_requested: existingReport.payment_requested,
        current_progress: existingReport.current_progress,
        updatedFields: Object.keys(actualChanges),
        changes: actualChanges,
        previousValues: previousValues,
      };

      // Enhance details for payment status changes
      if (paymentStatusChanged) {
        const oldPaymentStatus =
          previousValues.payment_triggered === true ? 'paid' : 'pending';
        const newPaymentStatus =
          actualChanges.payment_triggered === true ? 'paid' : 'pending';

        auditDetails.payment_status_change = {
          from: oldPaymentStatus,
          to: newPaymentStatus,
          amount: existingReport.payment_requested,
          report_date: existingReport.report_date,
          billing_period_start: existingReport.start_date,
          billing_period_end: existingReport.end_date,
        };
      }

      await this.auditLogsService.create({
        userId: currentUser?.userId,
        userName: currentUser?.username,
        action: 'UPDATE',
        resource: 'REPORT',
        resourceId: id,
        details: auditDetails,
      });

      console.log('[AUDIT] Report updated:', {
        reportId: id,
        projectId: existingReport.project_id,
        changes: Object.keys(actualChanges),
        paymentStatusChanged,
        timestamp: new Date().toISOString(),
      });
    }
  }

  //soft delete report from db table = reports
  async remove(id: string, currentUser?: any): Promise<void> {
    // Get the report before deleting to capture context
    const existingReport = await this.reportRepository.findOne({
      where: { report_id: id },
    });

    const result = await this.reportRepository.update(id, {
      isDeleted: true,
      deleted_at: new Date(),
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    // Log audit event with full context
    await this.auditLogsService.create({
      userId: currentUser?.userId,
      userName: currentUser?.username,
      action: 'DELETE',
      resource: 'REPORT',
      resourceId: id,
      details: {
        reportId: id,
        project_id: existingReport?.project_id,
        payment_requested: existingReport?.payment_requested,
        current_progress: existingReport?.current_progress,
        payment_triggered: existingReport?.payment_triggered,
        period_start: existingReport?.start_date,
        period_end: existingReport?.end_date,
      },
    });

    console.log('[AUDIT] Report deleted and logged:', {
      reportId: id,
      projectId: existingReport?.project_id,
      wasPaid: existingReport?.payment_triggered,
      timestamp: new Date().toISOString(),
    });
  }

  //permanently delete report from db table = reports
  async permanentRemove(id: string): Promise<void> {
    const result = await this.reportRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
  }
}
