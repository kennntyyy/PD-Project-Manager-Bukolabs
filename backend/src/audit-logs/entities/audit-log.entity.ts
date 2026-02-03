import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  userName: string;

  @Column()
  action: string; // e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'

  @Column()
  resource: string; // e.g., 'USER', 'PROJECT', 'REPORT'

  @Column({ nullable: true })
  resourceId: string;

  @Column({ type: 'text', nullable: true })
  details: string; // JSON string with additional details

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  timestamp: Date;
}
