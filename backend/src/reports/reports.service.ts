import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
  ) {}

  //save data to db table = reports
  async create(createReportDto: CreateReportDto): Promise<Report> {
    const {
      project_id,
      report_date,
      current_progress,
      report_description,
      work_completed,
      challenges,
      next_steps,
      payment_requested,
      payment_triggered,
      
    } = createReportDto;

    const report = this.reportRepository.create({
      project_id,
      report_date,
      current_progress,
      report_description,
      work_completed,
      challenges,
      next_steps,
      payment_requested,
      payment_triggered,
      
    });

    return await this.reportRepository.save(report);
  }

  //get all reports from db table = reports where isDeleted = false
  async findAll(includeDeleted = false): Promise<Report[]> {
    if(includeDeleted) {
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
  async update(id: string,  UpdateReportDto: any): Promise<void> {
    const updateData: any = {
      report_date: UpdateReportDto.report_date,
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

    if(result.affected === 0) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
  }

  //permanently delete report from db table = reports
  async permanentRemove(id: string): Promise<void> {
    const result = await this.reportRepository.delete(id);

    if(result.affected === 0) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
  }

}
