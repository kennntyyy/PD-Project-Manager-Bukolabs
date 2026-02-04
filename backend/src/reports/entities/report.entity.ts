import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  report_id: string;

  @CreateDateColumn()
  report_date: Date;

  @Column({ type: 'date', nullable: true })
  start_date: string;

  @Column({ type: 'date', nullable: true })
  end_date: string;

  @Column()
  current_progress: number;

  @Column({ type: 'text', nullable: true })
  report_description: string;

  @Column({ type: 'text', nullable: true })
  work_completed: string;

  @Column({ type: 'text', nullable: true })
  challenges: string;

  @Column({ type: 'text', nullable: true })
  next_steps: string;

  @Column({ type: 'decimal', default: 0 })
  payment_requested: number;

  @Column({ default: false })
  payment_triggered: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date | null;

  @Column({ default: false })
  isDeleted: boolean;

  //images
  @Column({ type: 'simple-array', nullable: true })
  image_urls: string[];

  @Column({ type: 'text', nullable: true })
  image_comments: string;

  //reference keys / foreign keys

  @Column({ type: 'uuid' })
  project_id: string;

  @Column({ type: 'varchar', nullable: true })
  created_by: string;
}
