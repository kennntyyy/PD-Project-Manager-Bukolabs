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

    @Column()
    current_progress: number;

    @Column({type: 'text', nullable: true})
    report_description: string;

    @Column({type: 'text'})
    work_completed: string;

    @Column({type: 'text'})
    challenges: string;

    @Column({type: 'text'})
    next_steps: string;

    @Column({type: 'decimal'})
    payment_requested: number;

    @Column({ default: false})
    payment_triggered: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn({ nullable: true })
    deleted_at: Date | null;

    @Column({ default: false })
    isDeleted: boolean;

    //reference keys / foreign keys

    @Column({ type: 'uuid' })
    project_id: string;

    @Column({ type: 'uuid' })
    created_by: string;
}
