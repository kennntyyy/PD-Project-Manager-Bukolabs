import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('contractor_types')
export class ContractorType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({nullable: false})
  type_name: string;
}
