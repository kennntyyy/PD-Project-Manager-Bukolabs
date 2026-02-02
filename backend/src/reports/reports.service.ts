import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { Project } from '../projects/entities/project.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  //save data to db table = reports
  async create(
    createReportDto: CreateReportDto,
    files?: Express.Multer.File[],
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
  async update(id: string, UpdateReportDto: any): Promise<void> {
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
  }

  //soft delete report from db table = reports
  async remove(id: string): Promise<void> {
    const result = await this.reportRepository.update(id, {
      isDeleted: true,
      deleted_at: new Date(),
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
  }

  //permanently delete report from db table = reports
  async permanentRemove(id: string): Promise<void> {
    const result = await this.reportRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
  }
}
