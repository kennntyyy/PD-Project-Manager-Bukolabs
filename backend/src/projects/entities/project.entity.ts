import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PAID = 'paid',
  UNPAID = 'unpaid',
  PARTIALLY_PAID = 'partially_paid',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  project_id: string;

  @Column({ length: 100, nullable: false })
  project_name: string;

  @Column({ type: 'text', nullable: true })
  project_description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount_paid: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount_due: number;

  @CreateDateColumn()
  project_deadline: Date;

  @CreateDateColumn()
  project_start_date: Date;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PLANNING,
  })
  project_status: ProjectStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  payment_status: PaymentStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @CreateDateColumn({ nullable: true })
  deleted_at: Date | null;

  @Column({ default: false })
  isDeleted: boolean;

  //relationships

  @Column({ type: 'uuid', nullable: true })
  client_id: string;

  @Column({ type: 'uuid',nullable: true })
  staff_id: string;

  @Column({ type: 'uuid', nullable: true })
  contractor_id: string;

  @Column({ nullable: true })
  created_by: string;
}
