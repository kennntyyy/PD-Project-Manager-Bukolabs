import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';

export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled'
}

export enum PaymentStatus {
    PAID = 'paid',
    UNPAID = 'unpaid',
    PARTIALLY_PAID = 'partially_paid'
}

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn('uuid')
    project_id: string;

    @Column({ length: 100 })
    project_name: string;

    @Column()
    project_description: Text;

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
        default: ProjectStatus.PLANNING
    })
    project_status: ProjectStatus;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.UNPAID
    })
    payment_status: PaymentStatus;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @CreateDateColumn()
    deleted_at: Date;

    @Column()
    isDeleted: boolean;

    //relationships

    @Column()
    client_id: number;

    @Column()
    staff_id: number;

    @Column()
    contractor_id: number;

    @Column()
    created_by: number;

}
