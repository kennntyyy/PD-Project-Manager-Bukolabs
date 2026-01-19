import * as bcrypt from 'bcryptjs';
import { UserRole } from '../users/entities/user.entity';

export const seedUsers = [
  {
    user_id: '1',
    username: 'admin',
    email: 'admin@example.com',
    password: bcrypt.hashSync('admin123', 10),
    user_role: UserRole.ADMIN,
    first_name: 'Admin',
    last_name: 'User',
    is_active: true,
  },
  {
    user_id: '2',
    username: 'staff1',
    email: 'staff@example.com',
    password: bcrypt.hashSync('staff123', 10),
    user_role: UserRole.STAFF,
    first_name: 'Staff',
    last_name: 'User',
    is_active: true,
  },
  {
    user_id: '3',
    username: 'client1',
    email: 'client@example.com',
    password: bcrypt.hashSync('client123', 10),
    user_role: UserRole.CLIENT,
    first_name: 'Client',
    last_name: 'User',
    is_active: true,
  },
  {
    user_id: '4',
    username: 'contractor1',
    email: 'contractor@example.com',
    password: bcrypt.hashSync('contractor123', 10),
    user_role: UserRole.CONTRACTOR,
    first_name: 'Contractor',
    last_name: 'User',
    is_active: true,
  },
];
