import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum UserRole {
  DOCTOR = 'doctor',
  PACIENTE = 'paciente',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  ci!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ type: 'varchar', length: 20, default: UserRole.PACIENTE })
  role!: UserRole;

  @CreateDateColumn()
  createdAt!: Date;
}